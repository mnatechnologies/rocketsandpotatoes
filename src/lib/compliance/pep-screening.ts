/**
 * PEP (Politically Exposed Person) screening module.
 * Adapted from IntelliCompli compliance platform.
 *
 * Screens customers against the pep_entities table (populated from OpenSanctions)
 * using Jaro-Winkler + Double Metaphone composite matching with transliteration variants.
 *
 * This replaces the self-declaration-only approach. AML/CTF Rules Part 4.13 requires
 * the reporting entity to screen, not rely on customer honesty.
 */

import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { jaroWinklerSimilarity, phoneticMatch, expandNameVariants } from './phonetic';

const logger = createLogger('PEP_SCREENING');

const DEFAULT_PEP_THRESHOLD = 0.65;
const FORMER_PEP_MONTHS = 24;

export interface PepScreeningInput {
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: string;
  customerId?: string;
}

export type PepCategory = 'foreign' | 'domestic' | 'international_org' | 'unknown';

export interface PepScreeningMatch {
  name: string;
  matchScore: number;
  position: string;
  country: string;
  pepType: 'pep' | 'rca' | 'both';
  pepCategory: PepCategory;
  isFormerPep: boolean;
  source: string;
}

export interface PepScreeningResult {
  isPep: boolean;
  isRca: boolean;
  pepCategory: PepCategory;
  status: 'clear' | 'potential_match';
  matchScore: number;
  matches: PepScreeningMatch[];
  screenedName: string;
  screenedAt: Date;
  warnings: string[];
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateMatchScore(str1: string, str2: string): number {
  const n1 = normalizeName(str1);
  const n2 = normalizeName(str2);

  if (n1.length === 0 || n2.length === 0) return 0;
  if (n1 === n2) return 1.0;

  const jwScore = jaroWinklerSimilarity(n1, n2);
  const phonScore = phoneticMatch(n1, n2);
  const compositeScore = 0.7 * jwScore + 0.3 * phonScore;

  const variants1 = expandNameVariants(n1);
  const variants2 = expandNameVariants(n2);

  let bestVariantScore = compositeScore;
  for (const v1 of variants1) {
    for (const v2 of variants2) {
      if (v1 === v2) return 1.0;
      const vScore = 0.7 * jaroWinklerSimilarity(v1, v2) + 0.3 * phoneticMatch(v1, v2);
      if (vScore > bestVariantScore) bestVariantScore = vScore;
    }
  }

  return Math.min(1.0, bestVariantScore);
}

const INTL_ORG_KEYWORDS = [
  'united nations', 'world bank', 'imf', 'international monetary fund',
  'world trade organization', 'interpol', 'international criminal court',
  'european commission', 'european parliament', 'nato',
  'african union', 'asean', 'oecd', 'world health organization', 'fatf',
];

function classifyPepCategory(
  entityCountries: string[],
  positions?: string[],
): PepCategory {
  // Check for international org PEPs
  if (positions?.some(p => {
    const lower = p.toLowerCase();
    return INTL_ORG_KEYWORDS.some(kw => lower.includes(kw));
  })) {
    return 'international_org';
  }

  if (entityCountries.length === 0) return 'unknown';

  // ANB is Australian — classify relative to AU
  const isLocal = entityCountries.some(
    c => c.toLowerCase() === 'au' || c.toLowerCase() === 'australia'
  );
  return isLocal ? 'domestic' : 'foreign';
}

function derivePepType(topics: string[]): 'pep' | 'rca' | 'both' {
  const isPep = topics.includes('role.pep');
  const isRca = topics.includes('role.rca');
  if (isPep && isRca) return 'both';
  if (isPep) return 'pep';
  return 'rca';
}

/**
 * Screen a person against the PEP/RCA database.
 */
export async function pepScreening(
  input: PepScreeningInput,
  minimumMatchScore: number = DEFAULT_PEP_THRESHOLD,
): Promise<PepScreeningResult> {
  const supabase = getSupabaseClient();
  const fullName = input.fullName || `${input.firstName} ${input.lastName}`.trim();
  const warnings: string[] = [];

  if (!input.firstName?.trim() && !input.lastName?.trim() && !input.fullName?.trim()) {
    return {
      isPep: false, isRca: false, pepCategory: 'unknown',
      status: 'clear', matchScore: 0, matches: [],
      screenedName: fullName || 'unknown', screenedAt: new Date(),
      warnings: ['Screening skipped: customer name is missing'],
    };
  }

  // Check if pep_entities table has data
  const { count, error: countError } = await supabase
    .from('pep_entities')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (countError) {
    logger.error('PEP data health check failed:', countError);
    warnings.push('PEP screening may be incomplete due to database error');
  }

  if (!count || count === 0) {
    warnings.push('PEP entity database is empty. Import OpenSanctions data to enable PEP screening.');
    return {
      isPep: false, isRca: false, pepCategory: 'unknown',
      status: 'clear', matchScore: 0, matches: [],
      screenedName: fullName, screenedAt: new Date(), warnings,
    };
  }

  // 1. Exact match
  const exactMatches = await checkExactPepMatch(supabase, fullName);

  // 2. Fuzzy match
  const fuzzyMatches = await checkFuzzyPepMatch(supabase, fullName, input.dateOfBirth);

  // 3. Former PEP check (FATF R12: 24 months after leaving office)
  const formerMatches = await checkFormerPeps(supabase, fullName, input.dateOfBirth);

  // Combine, deduplicate, filter
  const allMatches = [...exactMatches, ...fuzzyMatches, ...formerMatches];
  const seen = new Set<string>();
  const uniqueMatches = allMatches.filter(m => {
    const key = `${m.name}-${m.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const highConfidenceMatches = uniqueMatches
    .filter(m => m.matchScore >= minimumMatchScore)
    .sort((a, b) => b.matchScore - a.matchScore);

  const topScore = highConfidenceMatches[0]?.matchScore || 0;
  const isMatch = highConfidenceMatches.length > 0;

  const hasPep = highConfidenceMatches.some(m => m.pepType === 'pep' || m.pepType === 'both');
  const hasRca = highConfidenceMatches.some(m => m.pepType === 'rca' || m.pepType === 'both');

  let pepCategory: PepCategory = 'unknown';
  if (isMatch) {
    const hasIntlOrg = highConfidenceMatches.some(m => m.pepCategory === 'international_org');
    const hasForeign = highConfidenceMatches.some(m => m.pepCategory === 'foreign');
    const hasDomestic = highConfidenceMatches.some(m => m.pepCategory === 'domestic');
    pepCategory = hasIntlOrg ? 'international_org' : hasForeign ? 'foreign' : hasDomestic ? 'domestic' : 'unknown';
  }

  return {
    isPep: isMatch && hasPep,
    isRca: isMatch && hasRca,
    pepCategory,
    status: isMatch ? 'potential_match' : 'clear',
    matchScore: topScore,
    matches: highConfidenceMatches,
    screenedName: fullName,
    screenedAt: new Date(),
    warnings,
  };
}

async function checkExactPepMatch(supabase: any, fullName: string): Promise<PepScreeningMatch[]> {
  const normalizedName = normalizeName(fullName);
  const nameParts = normalizedName.split(' ').filter(part => part.length > 1);
  if (nameParts.length === 0) return [];

  const wildcardPattern = `%${nameParts.join('%')}%`;

  const { data, error } = await supabase
    .from('pep_entities')
    .select('*')
    .eq('is_active', true)
    .ilike('caption', wildcardPattern)
    .limit(50);

  if (error) {
    logger.error('PEP exact match query failed:', error);
    return [];
  }

  return (data || []).map((entity: Record<string, unknown>) => {
    const actualScore = calculateMatchScore(fullName, entity.caption as string);
    const isExact = normalizeName(entity.caption as string) === normalizedName;

    return {
      name: entity.caption as string,
      matchScore: isExact ? 1.0 : Math.round(Math.max(actualScore, 0.85) * 100) / 100,
      position: ((entity.positions as string[]) || [])[0] || '',
      country: ((entity.countries as string[]) || [])[0] || '',
      pepType: derivePepType((entity.topics as string[]) || []),
      pepCategory: classifyPepCategory(
        (entity.countries as string[]) || [],
        (entity.positions as string[]) || [],
      ),
      isFormerPep: false,
      source: (entity.source as string) || 'OpenSanctions',
    };
  });
}

async function checkFuzzyPepMatch(
  supabase: any,
  fullName: string,
  dateOfBirth?: string,
): Promise<PepScreeningMatch[]> {
  const normalizedName = normalizeName(fullName);
  const nameParts = normalizedName.split(' ');

  const { data, error } = await supabase
    .from('pep_entities')
    .select('*')
    .eq('is_active', true)
    .textSearch('search_vector', nameParts.join(' | '), {
      type: 'plain',
      config: 'simple',
    })
    .limit(50);

  if (error) {
    logger.error('PEP fuzzy match query failed:', error);
    return [];
  }

  return scoreAndFilter(data || [], normalizedName, dateOfBirth, false);
}

async function checkFormerPeps(
  supabase: any,
  fullName: string,
  dateOfBirth?: string,
): Promise<PepScreeningMatch[]> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - FORMER_PEP_MONTHS);

  const normalizedName = normalizeName(fullName);
  const nameParts = normalizedName.split(' ');

  const { data, error } = await supabase
    .from('pep_entities')
    .select('*')
    .eq('is_active', false)
    .gte('deactivated_at', cutoffDate.toISOString())
    .textSearch('search_vector', nameParts.join(' | '), {
      type: 'plain',
      config: 'simple',
    })
    .limit(20);

  if (error) {
    logger.error('Former PEP check failed:', error);
    return [];
  }

  return scoreAndFilter(data || [], normalizedName, dateOfBirth, true);
}

function scoreAndFilter(
  entities: Record<string, unknown>[],
  normalizedName: string,
  dateOfBirth?: string,
  isFormerPep: boolean = false,
): PepScreeningMatch[] {
  const matches: PepScreeningMatch[] = [];

  for (const entity of entities) {
    let bestScore = calculateMatchScore(normalizedName, entity.caption as string);

    // Check name aliases
    const names = (entity.names as string[]) || [];
    for (const name of names) {
      const aliasScore = calculateMatchScore(normalizedName, name);
      if (aliasScore > bestScore) bestScore = aliasScore;
    }

    // DOB boost
    if (dateOfBirth) {
      const birthDates = (entity.birth_dates as string[]) || [];
      if (birthDates.some(bd => bd === dateOfBirth)) {
        bestScore = Math.min(1.0, bestScore + 0.3);
      }
    }

    const internalThreshold = normalizedName.length < 5 ? 0.55 : 0.45;

    if (bestScore >= internalThreshold) {
      matches.push({
        name: entity.caption as string,
        matchScore: Math.round(bestScore * 100) / 100,
        position: ((entity.positions as string[]) || [])[0] || '',
        country: ((entity.countries as string[]) || [])[0] || '',
        pepType: derivePepType((entity.topics as string[]) || []),
        pepCategory: classifyPepCategory(
          (entity.countries as string[]) || [],
          (entity.positions as string[]) || [],
        ),
        isFormerPep,
        source: (entity.source as string) || 'OpenSanctions',
      });
    }
  }

  return matches;
}

/**
 * Screen a customer by ID — fetches their details and runs PEP screening.
 * Updates the customer's is_pep flag based on results.
 */
export async function screenCustomerPep(customerId: string): Promise<PepScreeningResult> {
  const supabase = getSupabaseClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select('first_name, last_name, date_of_birth, is_pep')
    .eq('id', customerId)
    .single();

  if (error || !customer) {
    throw new Error('Customer not found for PEP screening');
  }

  const result = await pepScreening({
    firstName: customer.first_name,
    lastName: customer.last_name,
    dateOfBirth: customer.date_of_birth,
    customerId,
  });

  // Save screening result
  await supabase.from('audit_logs').insert({
    action_type: 'pep_screening_completed',
    entity_type: 'customer',
    entity_id: customerId,
    description: result.isPep
      ? `PEP match found: ${result.matches[0]?.name} (${result.matches[0]?.position})`
      : `PEP screening clear for ${customer.first_name} ${customer.last_name}`,
    metadata: {
      screened_name: result.screenedName,
      is_pep: result.isPep,
      is_rca: result.isRca,
      pep_category: result.pepCategory,
      match_count: result.matches.length,
      top_score: result.matchScore,
      warnings: result.warnings,
    },
  });

  // Update customer record if PEP status changed
  if (result.isPep && !customer.is_pep) {
    await supabase
      .from('customers')
      .update({
        is_pep: true,
        requires_enhanced_dd: true,
      })
      .eq('id', customerId);

    logger.log(`⚠️ PEP MATCH: Customer ${customerId} — ${result.matches[0]?.name} (${result.matches[0]?.position})`);
  }

  return result;
}
