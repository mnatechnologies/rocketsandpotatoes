import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import { read, utils } from 'xlsx';
import { createLogger } from '@/lib/utils/logger';
import { sendComplianceAlert } from '@/lib/email/sendComplianceAlert';

const logger = createLogger('SANCTIONS_INGESTION');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngestionResult {
  inserted: number;
  deleted: number;
  errors: string[];
}

interface SanctionedEntityRow {
  full_name: string;
  aliases: string[];
  date_of_birth: string | null;
  nationality: string | null;
  entity_type: 'individual' | 'entity';
  source: 'DFAT' | 'UN';
  reference_number: string | null;
  listing_info: string | null;
}

// ---------------------------------------------------------------------------
// Shared Supabase client factory
// ---------------------------------------------------------------------------

function makeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ---------------------------------------------------------------------------
// DFAT Excel parser
// ---------------------------------------------------------------------------

const DFAT_URL =
  'https://www.dfat.gov.au/sites/default/files/regulation8_consolidated.xlsx';

/**
 * Normalise a raw cell value to a trimmed string or null.
 */
function cellStr(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim() || null;
}

/**
 * Split a comma- or semicolon-delimited alias string into a cleaned array.
 */
function splitAliases(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Attempt to parse an Excel serial date or ISO-ish date string into
 * a YYYY-MM-DD string. Returns null when the value cannot be parsed.
 */
function parseDob(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;

  // xlsx may return JS Date objects when cellDates is true
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  const str = String(value).trim();
  if (!str) return null;

  // Accept YYYY-MM-DD and DD/MM/YYYY variants
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try native Date parsing as a last resort
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  return null;
}

/**
 * Map a header row to column indices using fuzzy matching against known
 * header names. Returns a map of semantic key → column index.
 */
function mapDfatHeaders(headers: unknown[]): Record<string, number> {
  const normalise = (s: unknown) =>
    String(s ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const candidates: Record<string, string[]> = {
    name:      ['name', 'fullname', 'firstname', 'entityname'],
    aliases:   ['alias', 'aliases', 'alsoknownas', 'aka'],
    dob:       ['dateofbirth', 'dob', 'birthdate', 'born'],
    nationality: ['nationality', 'country', 'citizen'],
    type:      ['type', 'entitytype', 'individualentity'],
    reference: ['reference', 'referencenumber', 'refno', 'ref', 'id'],
    listing:   ['listinginfo', 'listing', 'reason', 'comments', 'grounds'],
  };

  const result: Record<string, number> = {};

  headers.forEach((h, idx) => {
    const norm = normalise(h);
    for (const [key, variants] of Object.entries(candidates)) {
      if (!(key in result) && variants.some(v => norm.includes(v))) {
        result[key] = idx;
      }
    }
  });

  return result;
}

async function parseDfat(): Promise<SanctionedEntityRow[]> {
  logger.log('Fetching DFAT consolidated list...');
  const response = await fetch(DFAT_URL);
  if (!response.ok) {
    throw new Error(
      `DFAT fetch failed: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();
  const workbook = read(buffer, { type: 'array', cellDates: true });

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('DFAT workbook has no sheets');

  const sheet = workbook.Sheets[sheetName];
  // header: 1 → first row is headers, returns array-of-arrays
  const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  if (rows.length < 2) throw new Error('DFAT sheet has no data rows');

  const headerRow = rows[0] as unknown[];
  const colMap = mapDfatHeaders(headerRow);

  logger.log('DFAT column map:', colMap);

  if (!('name' in colMap)) {
    throw new Error(
      `Could not locate a "Name" column in DFAT sheet. Headers found: ${headerRow
        .map(h => String(h ?? ''))
        .join(', ')}`
    );
  }

  const entities: SanctionedEntityRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const fullName = cellStr(row[colMap.name]);
    if (!fullName) continue; // skip blank rows

    const rawType = cellStr(
      'type' in colMap ? row[colMap.type] : null
    )?.toLowerCase();

    const entityType: 'individual' | 'entity' =
      rawType && (rawType.includes('entity') || rawType.includes('organisation') || rawType.includes('organization'))
        ? 'entity'
        : 'individual';

    entities.push({
      full_name: fullName,
      aliases: splitAliases(cellStr('aliases' in colMap ? row[colMap.aliases] : null)),
      date_of_birth: parseDob('dob' in colMap ? row[colMap.dob] : null),
      nationality: cellStr('nationality' in colMap ? row[colMap.nationality] : null),
      entity_type: entityType,
      source: 'DFAT',
      reference_number: cellStr('reference' in colMap ? row[colMap.reference] : null),
      listing_info: cellStr('listing' in colMap ? row[colMap.listing] : null),
    });
  }

  logger.log(`DFAT: parsed ${entities.length} entries`);
  return entities;
}

// ---------------------------------------------------------------------------
// UN XML parser
// ---------------------------------------------------------------------------

const UN_URL =
  'https://scsanctions.un.org/resources/xml/en/consolidated.xml';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  trimValues: true,
  isArray: (tagName) =>
    [
      'INDIVIDUAL',
      'ENTITY',
      'INDIVIDUAL_ALIAS',
      'ENTITY_ALIAS',
      'INDIVIDUAL_DATE_OF_BIRTH',
      'NATIONALITY',
    ].includes(tagName),
});

/**
 * Safely extract a string from a parsed XML node that may be a plain value
 * or an object with a `#text` key.
 */
function xmlStr(node: unknown): string | null {
  if (node === undefined || node === null) return null;
  if (typeof node === 'string') return node.trim() || null;
  if (typeof node === 'number') return String(node);
  if (typeof node === 'object') {
    const text = (node as Record<string, unknown>)['#text'];
    if (text !== undefined && text !== null) return String(text).trim() || null;
  }
  return null;
}

function xmlAliases(
  aliasNodes: unknown,
  nameKey: string
): string[] {
  if (!Array.isArray(aliasNodes)) return [];
  const results: string[] = [];
  for (const node of aliasNodes) {
    if (typeof node !== 'object' || node === null) continue;
    const quality = xmlStr((node as Record<string, unknown>)['QUALITY']);
    // Skip "Bad quality" aliases
    if (quality && quality.toLowerCase().includes('bad')) continue;
    const name = xmlStr((node as Record<string, unknown>)[nameKey]);
    if (name) results.push(name);
  }
  return results;
}

function xmlFirstDob(dobNodes: unknown): string | null {
  if (!Array.isArray(dobNodes)) return null;
  for (const node of dobNodes) {
    if (typeof node !== 'object' || node === null) continue;
    const raw = xmlStr((node as Record<string, unknown>)['DATE']);
    const parsed = parseDob(raw);
    if (parsed) return parsed;
  }
  return null;
}

function xmlNationality(natNodes: unknown): string | null {
  if (!Array.isArray(natNodes)) return null;
  for (const node of natNodes) {
    if (typeof node !== 'object' || node === null) continue;
    const val = xmlStr((node as Record<string, unknown>)['VALUE']);
    if (val) return val;
  }
  return null;
}

/**
 * Join up to three name parts, dropping nulls.
 */
function joinNameParts(...parts: (string | null)[]): string {
  return parts.filter(Boolean).join(' ').trim();
}

async function parseUn(): Promise<SanctionedEntityRow[]> {
  logger.log('Fetching UN Security Council consolidated list...');
  const response = await fetch(UN_URL);
  if (!response.ok) {
    throw new Error(
      `UN fetch failed: ${response.status} ${response.statusText}`
    );
  }

  const xmlText = await response.text();
  const parsed = xmlParser.parse(xmlText) as Record<string, unknown>;

  // The root element is CONSOLIDATED_LIST
  const root = parsed['CONSOLIDATED_LIST'] as Record<string, unknown> | undefined;
  if (!root) {
    throw new Error('UN XML: missing CONSOLIDATED_LIST root element');
  }

  const individualsWrapper = root['INDIVIDUALS'] as Record<string, unknown> | undefined;
  const entitiesWrapper = root['ENTITIES'] as Record<string, unknown> | undefined;

  const individuals = (individualsWrapper?.['INDIVIDUAL'] ?? []) as unknown[];
  const entityList = (entitiesWrapper?.['ENTITY'] ?? []) as unknown[];

  const entities: SanctionedEntityRow[] = [];

  // Parse individuals
  for (const ind of individuals) {
    if (typeof ind !== 'object' || ind === null) continue;
    const rec = ind as Record<string, unknown>;

    const first = xmlStr(rec['FIRST_NAME']);
    const second = xmlStr(rec['SECOND_NAME']);
    const third = xmlStr(rec['THIRD_NAME']);
    const fullName = joinNameParts(first, second, third);
    if (!fullName) continue;

    entities.push({
      full_name: fullName,
      aliases: xmlAliases(rec['INDIVIDUAL_ALIAS'], 'ALIAS_NAME'),
      date_of_birth: xmlFirstDob(rec['INDIVIDUAL_DATE_OF_BIRTH']),
      nationality: xmlNationality(rec['NATIONALITY']),
      entity_type: 'individual',
      source: 'UN',
      reference_number: xmlStr(rec['REFERENCE_NUMBER']),
      listing_info: xmlStr(rec['COMMENTS1']),
    });
  }

  // Parse entities
  for (const ent of entityList) {
    if (typeof ent !== 'object' || ent === null) continue;
    const rec = ent as Record<string, unknown>;

    const fullName = xmlStr(rec['FIRST_NAME']);
    if (!fullName) continue;

    entities.push({
      full_name: fullName,
      aliases: xmlAliases(rec['ENTITY_ALIAS'], 'ALIAS_NAME'),
      date_of_birth: null,
      nationality: null,
      entity_type: 'entity',
      source: 'UN',
      reference_number: xmlStr(rec['REFERENCE_NUMBER']),
      listing_info: xmlStr(rec['COMMENTS1']),
    });
  }

  logger.log(`UN: parsed ${entities.length} entries (${individuals.length} individuals, ${entityList.length} entities)`);
  return entities;
}

// ---------------------------------------------------------------------------
// Core ingestion logic
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;

async function upsertSource(
  source: 'DFAT' | 'UN',
  rows: SanctionedEntityRow[]
): Promise<{ inserted: number; deleted: number }> {
  const supabase = makeSupabaseClient();

  // Sanity check: get current count before modifying anything
  const { count: currentCount } = await supabase
    .from('sanctioned_entities')
    .select('*', { count: 'exact', head: true })
    .eq('source', source);

  const previousCount = currentCount ?? 0;

  // Abort if new data deviates >50% from previous in either direction
  // Protects against empty/corrupt responses AND unexpected format changes
  if (previousCount > 50) {
    if (rows.length < previousCount * 0.5) {
      const msg = `${source} sanity check failed: parsed ${rows.length} rows but expected ~${previousCount}. ` +
        `Refusing to replace — upstream data may be corrupt or truncated.`;
      logger.error(msg);
      throw new Error(msg);
    }
    if (rows.length > previousCount * 1.5) {
      const msg = `${source} sanity check warning: parsed ${rows.length} rows but expected ~${previousCount} (+${Math.round((rows.length / previousCount - 1) * 100)}%). ` +
        `Refusing to auto-load — possible format change or data corruption. Manual review required.`;
      logger.error(msg);
      throw new Error(msg);
    }
  }

  if (rows.length === 0) {
    throw new Error(`${source}: parsed 0 rows. Refusing to delete existing data.`);
  }

  // Insert all new rows first (before deleting old ones) to ensure we have valid data
  // Use a unique batch marker to identify the new rows
  const batchMarker = `${source}_staging_${Date.now()}`;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map(row => ({
      ...row,
      listing_info: row.listing_info
        ? `${row.listing_info}\n__batch:${batchMarker}`
        : `__batch:${batchMarker}`,
    }));

    const { error: insertError } = await supabase
      .from('sanctioned_entities')
      .insert(batch);

    if (insertError) {
      // Rollback: delete any rows we've already inserted in this batch
      await supabase
        .from('sanctioned_entities')
        .delete()
        .like('listing_info', `%__batch:${batchMarker}%`);

      throw new Error(
        `Failed to insert ${source} batch at offset ${i}: ${insertError.message}. ` +
        `Rolled back staged rows. Existing data preserved.`
      );
    }
    inserted += batch.length;
  }

  // All inserts succeeded — now safe to delete the old rows
  const { error: deleteError, count: deleteCount } = await supabase
    .from('sanctioned_entities')
    .delete({ count: 'exact' })
    .eq('source', source)
    .not('listing_info', 'like', `%__batch:${batchMarker}%`);

  if (deleteError) {
    logger.error(`Failed to delete old ${source} entries (new data preserved):`, deleteError);
  }

  // Clean up batch markers from new rows
  const { data: stagedRows } = await supabase
    .from('sanctioned_entities')
    .select('id, listing_info')
    .like('listing_info', `%__batch:${batchMarker}%`);

  if (stagedRows) {
    for (let i = 0; i < stagedRows.length; i += BATCH_SIZE) {
      const batch = stagedRows.slice(i, i + BATCH_SIZE);
      for (const row of batch) {
        const cleanedInfo = row.listing_info
          ?.replace(`\n__batch:${batchMarker}`, '')
          ?.replace(`__batch:${batchMarker}`, '') || null;
        await supabase
          .from('sanctioned_entities')
          .update({ listing_info: cleanedInfo })
          .eq('id', row.id);
      }
    }
  }

  const deleted = deleteCount ?? 0;
  return { inserted, deleted };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function refreshSanctionsList(
  source: 'DFAT' | 'UN'
): Promise<IngestionResult> {
  const errors: string[] = [];
  let inserted = 0;
  let deleted = 0;

  try {
    const rows = source === 'DFAT' ? await parseDfat() : await parseUn();
    const counts = await upsertSource(source, rows);
    inserted = counts.inserted;
    deleted = counts.deleted;

    logger.log(`${source}: inserted ${inserted}, deleted ${deleted}`);

    // Audit log
    const supabase = makeSupabaseClient();
    await supabase.from('audit_logs').insert({
      action_type: 'sanctions_list_refreshed',
      entity_type: 'system',
      description: `${source} sanctions list refreshed: ${inserted} entries loaded`,
      metadata: { source, inserted, deleted },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`${source} ingestion error:`, err);
    errors.push(message);

    // LOUD failure: email alert + audit log for ingestion failures
    // Screening against an incomplete list is a compliance risk
    try {
      await sendComplianceAlert({
        type: 'sanctions_ingestion_failure',
        severity: 'critical',
        title: `${source} sanctions list ingestion failed`,
        description: `The ${source} sanctions list failed to refresh. ` +
          `Screening may be operating against stale data.\n\n` +
          `Error: ${message}\n\n` +
          `Action required: Investigate and re-trigger ingestion manually.`,
      });
    } catch (alertErr) {
      logger.error('Failed to send ingestion failure alert:', alertErr);
    }

    const supabase = makeSupabaseClient();
    await supabase.from('audit_logs').insert({
      action_type: 'sanctions_ingestion_failed',
      entity_type: 'system',
      description: `CRITICAL: ${source} sanctions list ingestion failed: ${message}`,
      metadata: { source, error: message },
    });
  }

  return { inserted, deleted, errors };
}

export async function refreshAllSanctionsLists(): Promise<{
  dfat: IngestionResult;
  un: IngestionResult;
}> {
  const [dfat, un] = await Promise.allSettled([
    refreshSanctionsList('DFAT'),
    refreshSanctionsList('UN'),
  ]);

  return {
    dfat:
      dfat.status === 'fulfilled'
        ? dfat.value
        : { inserted: 0, deleted: 0, errors: [dfat.reason?.message ?? 'Unknown error'] },
    un:
      un.status === 'fulfilled'
        ? un.value
        : { inserted: 0, deleted: 0, errors: [un.reason?.message ?? 'Unknown error'] },
  };
}
