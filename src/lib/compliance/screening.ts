// DON'T ASK ME NOTHING BOUT THIS FILE. 

import { createClient } from "@supabase/supabase-js";
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SCREENING_FUNCTIONALITY')

interface ScreeningResult {
  isMatch: boolean;
  matches: Array<{
    name: string;
    matchScore: number;
    source: string;
    referenceNumber: string;
    dateOfBirth?: string;
    nationality?: string;
  }>;
  screenedAt: Date;
  screenedName: string;
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


export async function sanctionsScreening(
  firstName: string,
  lastName: string,
  dateOfBirth?: string
) : Promise<ScreeningResult>  {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const fullName = `${firstName} ${lastName}`.trim()
  logger.log(`Screening: ${fullName}`)

  const exactMatches = await checkExactMatch(supabase, fullName)

  const fuzzyMatches = await checkFuzzyMatch(supabase, fullName, dateOfBirth)

  const allMatches = [...exactMatches, ...fuzzyMatches]
  const uniqueMatches = deduplicateMatches(allMatches)
  const highConfidenceMatches = uniqueMatches.filter(m => m.matchScore >= 0.7);

  logger.log(`Found ${highConfidenceMatches.length} potential matches`);

  return {
    isMatch: highConfidenceMatches.length > 0,
    matches: highConfidenceMatches,
    screenedAt: new Date(),
    screenedName: fullName,
  };

}

async function checkExactMatch(supabase: any, fullName: string) {
  const normalisedName = normalizeName(fullName);

  // Use separate parameterized queries to prevent filter injection
  const { data: nameMatches, error: nameError } = await supabase
    .from('sanctioned_entities')
    .select('*')
    .ilike('full_name', `%${normalisedName}%`);

  const { data: aliasMatches, error: aliasError } = await supabase
    .from('sanctioned_entities')
    .select('*')
    .contains('aliases', [normalisedName]);

  const error = nameError || aliasError;
  // Combine and deduplicate by id
  const combined = [...(nameMatches || []), ...(aliasMatches || [])];
  const seen = new Set<string>();
  const data = combined.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  if (error) {
    logger.error('Exact match error: ', error)
  }

  return (data || []).map((entity: any)=> ({
    name: entity.full_name,
    matchScore: 1.0,
    source: entity.source,
    reference_number: entity.reference_number,
    dateOfBirth: entity.date_of_birth,
    nationality: entity.nationality
  }))
}

// jacking this shit yo

async function checkFuzzyMatch(
  supabase: any,
  fullName: string,
  dateOfBirth?: string
) {
  const normalizedName = normalizeName(fullName);
  const nameParts = normalizedName.split(' ');

  // Search for entries with similar names
  const { data, error } = await supabase
    .from('sanctioned_entities')
    .select('*')
    .textSearch('full_name', nameParts.join(' | '), {
      type: 'websearch',
      config: 'english',
    })
    .limit(50);

  if (error) {
    logger.error('Fuzzy match error:', error);
    return [];
  }

  const matches = [];

  for (const entity of data || []) {
    const score = calculateMatchScore(normalizedName, entity.full_name);

    // Boost score if DOB matches
    let finalScore = score;
    if (dateOfBirth && entity.date_of_birth) {
      if (dateOfBirth === entity.date_of_birth) {
        finalScore = Math.min(1.0, score + 0.3);
      }
    }

    // Check aliases too
    if (entity.aliases && Array.isArray(entity.aliases)) {
      for (const alias of entity.aliases) {
        const aliasScore = calculateMatchScore(normalizedName, alias);
        if (aliasScore > finalScore) {
          finalScore = aliasScore;
        }
      }
    }

    if (finalScore >= 0.6) { // Threshold for fuzzy matches
      matches.push({
        name: entity.full_name,
        matchScore: finalScore,
        source: entity.source,
        referenceNumber: entity.reference_number,
        dateOfBirth: entity.date_of_birth,
        nationality: entity.nationality,
      });
    }
  }

  return matches;
}

function calculateMatchScore(str1: string, str2: string): number {
  const normalized1 = normalizeName(str1);
  const normalized2 = normalizeName(str2);

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  // Convert distance to similarity score (0-1)
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Remove duplicate matches
 */
function deduplicateMatches(matches: any[]): any[] {
  const seen = new Set<string>();
  return matches.filter(match => {
    const key = `${match.referenceNumber}-${match.name}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function screenCustomer(customerId: string): Promise<ScreeningResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Get customer details
  const { data: customer, error } = await supabase
    .from('customers')
    .select('first_name, last_name, date_of_birth')
    .eq('id', customerId)
    .single();

  if (error || !customer) {
    throw new Error('Customer not found');
  }

  // Perform screening
  const result = await sanctionsScreening(
    customer.first_name,
    customer.last_name,
    customer.date_of_birth
  );

  // Save screening result
  await supabase.from('sanctions_screenings').insert({
    customer_id: customerId,
    screened_name: `${customer.first_name} ${customer.last_name}`,
    screening_service: 'DFAT',
    is_match: result.isMatch,
    match_score: result.matches[0]?.matchScore || 0,
    matched_entities: result.matches,
    status: result.isMatch ? 'potential_match' : 'clear',
    screened_at: new Date().toISOString(),
  });

  // Update customer record
  await supabase
    .from('customers')
    .update({
      is_sanctioned: result.isMatch,
    })
    .eq('id', customerId);

  return result;
}

/**
 * Re-screen all active customers against sanctions list
 * Used by weekly cron job for ongoing monitoring
 */
export interface RescreeningResult {
  totalCustomers: number;
  screened: number;
  newMatches: number;
  errors: number;
  matchedCustomerIds: string[];
}

export async function rescreenAllCustomers(): Promise<RescreeningResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const result: RescreeningResult = {
    totalCustomers: 0,
    screened: 0,
    newMatches: 0,
    errors: 0,
    matchedCustomerIds: [],
  };

  // Get all customers who are not already flagged as sanctioned
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, date_of_birth, is_sanctioned')
    .eq('is_sanctioned', false);

  if (error) {
    logger.error('Failed to fetch customers for re-screening:', error);
    throw new Error('Failed to fetch customers');
  }

  result.totalCustomers = customers?.length || 0;
  logger.log(`Re-screening ${result.totalCustomers} customers...`);

  for (const customer of customers || []) {
    try {
      const screeningResult = await sanctionsScreening(
        customer.first_name,
        customer.last_name,
        customer.date_of_birth
      );

      // Save screening result
      await supabase.from('sanctions_screenings').insert({
        customer_id: customer.id,
        screened_name: `${customer.first_name} ${customer.last_name}`,
        screening_service: 'DFAT',
        is_match: screeningResult.isMatch,
        match_score: screeningResult.matches[0]?.matchScore || 0,
        matched_entities: screeningResult.matches,
        status: screeningResult.isMatch ? 'potential_match' : 'clear',
        screened_at: new Date().toISOString(),
        screening_type: 'periodic_rescreen',
      });

      result.screened++;

      // If new match found
      if (screeningResult.isMatch) {
        result.newMatches++;
        result.matchedCustomerIds.push(customer.id);

        // Update customer as sanctioned
        await supabase
          .from('customers')
          .update({ is_sanctioned: true })
          .eq('id', customer.id);

        logger.log(`⚠️ NEW MATCH: Customer ${customer.id} - ${customer.first_name} ${customer.last_name}`);
      }
    } catch (err) {
      logger.error(`Error screening customer ${customer.id}:`, err);
      result.errors++;
    }
  }

  logger.log(`Re-screening complete: ${result.screened} screened, ${result.newMatches} new matches, ${result.errors} errors`);
  return result;
}