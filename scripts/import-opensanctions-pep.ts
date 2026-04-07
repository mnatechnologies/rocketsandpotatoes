#!/usr/bin/env tsx

/**
 * OpenSanctions PEP/RCA Import Script
 * Adapted from IntelliCompli compliance platform for Australian National Bullion.
 *
 * Streams the full OpenSanctions FTM JSON dataset (~2.6GB),
 * filters for Person entities with role.pep or role.rca topics,
 * and batch-upserts them into the pep_entities table.
 *
 * Stale entities are soft-deleted (is_active=false) to preserve audit trail
 * and support FATF R12 former-PEP wind-down period.
 *
 * Prerequisites:
 *   1. Run the migration: supabase/migrations/20260408000001_create_pep_entities.sql
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npx tsx scripts/import-opensanctions-pep.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as https from 'https';
import * as http from 'http';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '../.env.development') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OPENSANCTIONS_URL =
  'https://data.opensanctions.org/datasets/latest/default/entities.ftm.json';

const BATCH_SIZE = 500;
const MIN_EXPECTED_ENTITIES = 1000;

interface FTMEntity {
  id: string;
  caption: string;
  schema: string;
  properties: Record<string, string[]>;
  datasets: string[];
  referents: string[];
  target: boolean;
  first_seen: string;
  last_seen: string;
  last_change: string;
}

interface PepEntityRow {
  opensanctions_id: string;
  source: string;
  schema_type: string;
  caption: string;
  names: string[];
  birth_dates: string[];
  nationalities: string[];
  countries: string[];
  positions: string[];
  topics: string[];
  datasets: string[];
  first_seen: string | null;
  last_seen: string | null;
  last_change: string | null;
  is_active: boolean;
  deactivated_at: null;
}

function isPepOrRca(entity: FTMEntity): boolean {
  if (entity.schema !== 'Person') return false;
  const topics = entity.properties?.topics;
  if (!topics || !Array.isArray(topics)) return false;
  return topics.some(t => t === 'role.pep' || t === 'role.rca');
}

function entityToRow(entity: FTMEntity): PepEntityRow {
  const props = entity.properties || {};
  return {
    opensanctions_id: entity.id,
    source: 'opensanctions',
    schema_type: entity.schema,
    caption: entity.caption || props.name?.[0] || 'Unknown',
    names: props.name || [entity.caption],
    birth_dates: props.birthDate || [],
    nationalities: props.nationality || [],
    countries: props.country || [],
    positions: props.position || [],
    topics: entity.properties?.topics || [],
    datasets: entity.datasets || [],
    first_seen: entity.first_seen || null,
    last_seen: entity.last_seen || null,
    last_change: entity.last_change || null,
    is_active: true,
    deactivated_at: null,
  };
}

function followRedirects(url: string): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const follow = (u: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const client = u.startsWith('https') ? https : http;
      client.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          const loc = res.headers.location;
          if (loc) return follow(loc, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
        resolve(res);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function streamAndImport(): Promise<void> {
  const { data: importLog, error: logError } = await supabase
    .from('pep_import_log')
    .insert({
      source_url: OPENSANCTIONS_URL,
      source: 'opensanctions',
      status: 'running',
    })
    .select('id')
    .single();

  if (logError || !importLog) {
    console.error('Failed to create import log:', logError);
    throw new Error('Failed to create import log');
  }

  const importId = importLog.id;
  const seenIds = new Set<string>();
  let batch: PepEntityRow[] = [];
  let totalImported = 0;
  let totalLines = 0;
  let totalFiltered = 0;
  let totalSkipped = 0;

  console.log(`Streaming from: ${OPENSANCTIONS_URL}`);
  console.log('Filtering for Person entities with role.pep or role.rca topics...\n');

  const response = await followRedirects(OPENSANCTIONS_URL);

  const rl = readline.createInterface({
    input: response,
    crlfDelay: Infinity,
  });

  async function flushBatch(): Promise<void> {
    if (batch.length === 0) return;

    const toUpsert = batch.splice(0, batch.length);

    const { error } = await supabase
      .from('pep_entities')
      .upsert(toUpsert, { onConflict: 'source,opensanctions_id' });

    if (error) {
      console.error(`Upsert error (batch at ${totalImported}):`, error.message);
      totalSkipped += toUpsert.length;
    } else {
      totalImported += toUpsert.length;
    }

    if (totalImported % 5000 === 0 || totalImported === toUpsert.length) {
      console.log(
        `Progress: ${totalLines.toLocaleString()} lines read, ` +
        `${totalFiltered.toLocaleString()} PEP/RCA found, ` +
        `${totalImported.toLocaleString()} imported`
      );
    }
  }

  for await (const line of rl) {
    totalLines++;
    if (!line.trim()) continue;

    try {
      const entity: FTMEntity = JSON.parse(line);

      if (isPepOrRca(entity)) {
        totalFiltered++;
        const row = entityToRow(entity);
        seenIds.add(row.opensanctions_id);
        batch.push(row);

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      }
    } catch {
      totalSkipped++;
    }
  }

  await flushBatch();

  console.log(`\nImport phase complete:`);
  console.log(`  Lines read: ${totalLines.toLocaleString()}`);
  console.log(`  PEP/RCA entities found: ${totalFiltered.toLocaleString()}`);
  console.log(`  Entities imported: ${totalImported.toLocaleString()}`);
  console.log(`  Lines skipped: ${totalSkipped.toLocaleString()}`);

  if (totalImported < MIN_EXPECTED_ENTITIES) {
    const errMsg = `Import validation failed: only ${totalImported} entities imported (expected >= ${MIN_EXPECTED_ENTITIES}). Possible data source issue.`;
    console.error(errMsg);

    await supabase
      .from('pep_import_log')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        entities_imported: totalImported,
        entities_skipped: totalSkipped,
        error_message: errMsg,
      })
      .eq('id', importId);

    throw new Error(errMsg);
  }

  // Soft-delete stale entities not in current dataset
  console.log('\nDeactivating stale entities...');
  let totalDeactivated = 0;

  const PAGE_SIZE = 1000;
  let allExistingIds: { opensanctions_id: string }[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: page } = await supabase
      .from('pep_entities')
      .select('opensanctions_id')
      .eq('source', 'opensanctions')
      .eq('is_active', true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (page && page.length > 0) {
      allExistingIds = allExistingIds.concat(page);
      offset += PAGE_SIZE;
      hasMore = page.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  const toDeactivate = allExistingIds
    .map(e => e.opensanctions_id)
    .filter((id: string) => !seenIds.has(id));

  const CHUNK_SIZE = 1000;
  for (let i = 0; i < toDeactivate.length; i += CHUNK_SIZE) {
    const chunk = toDeactivate.slice(i, i + CHUNK_SIZE);
    const { error: deactError } = await supabase
      .from('pep_entities')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .in('opensanctions_id', chunk)
      .eq('source', 'opensanctions');

    if (deactError) {
      console.error(`Deactivation error:`, deactError.message);
    } else {
      totalDeactivated += chunk.length;
    }
  }

  console.log(`  Stale entities deactivated: ${totalDeactivated}`);

  await supabase
    .from('pep_import_log')
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed',
      entities_imported: totalImported,
      entities_deactivated: totalDeactivated,
      entities_skipped: totalSkipped,
    })
    .eq('id', importId);

  console.log(`\nImport complete!`);
}

async function main() {
  try {
    console.log('OpenSanctions PEP/RCA Import — Australian National Bullion');
    console.log('============================================================\n');

    await streamAndImport();

    console.log('\nDone.');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);

    try {
      await supabase
        .from('pep_import_log')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('status', 'running')
        .eq('source', 'opensanctions');
    } catch {
      // ignore
    }

    process.exit(1);
  }
}

main();
