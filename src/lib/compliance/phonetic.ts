/**
 * Phonetic matching utilities for AML/CTF name screening.
 * Adapted from IntelliCompli compliance platform.
 *
 * Provides Double Metaphone encoding and Jaro-Winkler similarity
 * for matching transliterated names (Muhammad/Mohamed/Mohamad, etc.)
 */

/**
 * Double Metaphone phonetic encoding algorithm.
 * Returns [primary, secondary] codes for a word.
 */
export function doubleMetaphone(word: string): [string, string] {
  if (!word || word.length === 0) return ['', ''];

  const input = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (input.length === 0) return ['', ''];

  let primary = '';
  let secondary = '';
  let pos = 0;
  const maxLen = 6;

  if (['GN', 'KN', 'PN', 'AE', 'WR'].some(prefix => input.startsWith(prefix))) {
    pos = 1;
  }

  if (input[0] === 'X') {
    primary += 'S';
    secondary += 'S';
    pos = 1;
  }

  while (pos < input.length && (primary.length < maxLen || secondary.length < maxLen)) {
    const ch = input[pos];
    const next = pos + 1 < input.length ? input[pos + 1] : '';
    const prev = pos > 0 ? input[pos - 1] : '';

    switch (ch) {
      case 'A': case 'E': case 'I': case 'O': case 'U':
        if (pos === 0) { primary += 'A'; secondary += 'A'; }
        pos++;
        break;

      case 'B':
        primary += 'P'; secondary += 'P';
        pos += (next === 'B') ? 2 : 1;
        break;

      case 'C':
        if (next === 'H') {
          primary += 'X'; secondary += 'X'; pos += 2;
        } else if (['I', 'E', 'Y'].includes(next)) {
          primary += 'S'; secondary += 'S'; pos += 1;
        } else {
          primary += 'K'; secondary += 'K';
          pos += (next === 'C' && !['I', 'E'].includes(input[pos + 2] || '')) ? 2 : 1;
        }
        break;

      case 'D':
        if (next === 'G' && ['I', 'E', 'Y'].includes(input[pos + 2] || '')) {
          primary += 'J'; secondary += 'J'; pos += 2;
        } else {
          primary += 'T'; secondary += 'T';
          pos += (next === 'D') ? 2 : 1;
        }
        break;

      case 'F':
        primary += 'F'; secondary += 'F';
        pos += (next === 'F') ? 2 : 1;
        break;

      case 'G':
        if (next === 'H') {
          if (pos > 0 && !isVowel(prev)) {
            primary += 'K'; secondary += 'K';
          } else if (pos === 0) {
            primary += 'K'; secondary += 'K';
          }
          pos += 2;
        } else if (next === 'N') {
          pos += 2;
        } else if (['I', 'E', 'Y'].includes(next)) {
          primary += 'J'; secondary += 'K'; pos += 1;
        } else {
          primary += 'K'; secondary += 'K';
          pos += (next === 'G') ? 2 : 1;
        }
        break;

      case 'H':
        if (isVowel(next) && (pos === 0 || !isVowel(prev))) {
          primary += 'H'; secondary += 'H';
        }
        pos++;
        break;

      case 'J':
        primary += 'J'; secondary += 'H';
        pos += (next === 'J') ? 2 : 1;
        break;

      case 'K':
        primary += 'K'; secondary += 'K';
        pos += (next === 'K') ? 2 : 1;
        break;

      case 'L':
        primary += 'L'; secondary += 'L';
        pos += (next === 'L') ? 2 : 1;
        break;

      case 'M':
        primary += 'M'; secondary += 'M';
        pos += (next === 'M') ? 2 : 1;
        break;

      case 'N':
        primary += 'N'; secondary += 'N';
        pos += (next === 'N') ? 2 : 1;
        break;

      case 'P':
        if (next === 'H') {
          primary += 'F'; secondary += 'F'; pos += 2;
        } else {
          primary += 'P'; secondary += 'P';
          pos += (next === 'P') ? 2 : 1;
        }
        break;

      case 'Q':
        primary += 'K'; secondary += 'K';
        pos += (next === 'Q') ? 2 : 1;
        break;

      case 'R':
        primary += 'R'; secondary += 'R';
        pos += (next === 'R') ? 2 : 1;
        break;

      case 'S':
        if (next === 'H') {
          primary += 'X'; secondary += 'X'; pos += 2;
        } else if (next === 'C' && input[pos + 2] === 'H') {
          primary += 'X'; secondary += 'X'; pos += 3;
        } else if (['I', 'E', 'Y'].includes(next) && input[pos + 2] === 'A') {
          primary += 'X'; secondary += 'S'; pos += 2;
        } else {
          primary += 'S'; secondary += 'S';
          pos += (next === 'S' || next === 'Z') ? 2 : 1;
        }
        break;

      case 'T':
        if (next === 'H') {
          primary += '0'; secondary += 'T'; pos += 2;
        } else if (next === 'I' && ['O', 'A'].includes(input[pos + 2] || '')) {
          primary += 'X'; secondary += 'X'; pos += 2;
        } else {
          primary += 'T'; secondary += 'T';
          pos += (next === 'T') ? 2 : 1;
        }
        break;

      case 'V':
        primary += 'F'; secondary += 'F';
        pos += (next === 'V') ? 2 : 1;
        break;

      case 'W': case 'Y':
        if (isVowel(next)) { primary += ch; secondary += ch; }
        pos++;
        break;

      case 'X':
        primary += 'KS'; secondary += 'KS';
        pos += (next === 'X') ? 2 : 1;
        break;

      case 'Z':
        primary += 'S'; secondary += 'S';
        pos += (next === 'Z') ? 2 : 1;
        break;

      default:
        pos++;
        break;
    }
  }

  return [primary.slice(0, maxLen), secondary.slice(0, maxLen)];
}

function isVowel(ch: string): boolean {
  return 'AEIOU'.includes(ch);
}

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchWindow = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 0);
  const s1Matches = new Array<boolean>(s1.length).fill(false);
  const s2Matches = new Array<boolean>(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Jaro-Winkler similarity. Boosts score for common prefixes.
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2);
  let prefixLen = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefixLen++;
    else break;
  }
  return jaro + prefixLen * 0.1 * (1 - jaro);
}

/**
 * Phonetic match score between two names.
 * Returns 0-1 score based on Double Metaphone word-by-word comparison.
 */
export function phoneticMatch(name1: string, name2: string): number {
  const words1 = name1.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const words2 = name2.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);

  if (words1.length === 0 || words2.length === 0) return 0;

  let totalScore = 0;
  let matchCount = 0;

  for (const w1 of words1) {
    const [p1, s1] = doubleMetaphone(w1);
    let bestMatch = 0;

    for (const w2 of words2) {
      const [p2, s2] = doubleMetaphone(w2);
      if (p1 && p2 && p1 === p2) bestMatch = Math.max(bestMatch, 1.0);
      else if (p1 && s2 && p1 === s2) bestMatch = Math.max(bestMatch, 0.9);
      else if (s1 && p2 && s1 === p2) bestMatch = Math.max(bestMatch, 0.9);
      else if (s1 && s2 && s1 === s2) bestMatch = Math.max(bestMatch, 0.8);
    }

    totalScore += bestMatch;
    if (bestMatch > 0) matchCount++;
  }

  const coverage = matchCount / Math.max(words1.length, words2.length);
  const avgScore = words1.length > 0 ? totalScore / words1.length : 0;
  return coverage * avgScore;
}

/**
 * Common transliteration variants for names frequently seen on sanctions lists.
 */
export const NAME_VARIANTS: Record<string, string[]> = {
  'muhammad': ['mohammed', 'mohammad', 'muhammed', 'mohamed'],
  'mohammed': ['muhammad', 'mohammad', 'muhammed', 'mohamed'],
  'ahmad': ['ahmed', 'achmed'],
  'ahmed': ['ahmad', 'achmed'],
  'ali': ['aly'],
  'hussein': ['husain', 'husein', 'hussain'],
  'abdel': ['abdul', 'abd'],
  'abdul': ['abdel', 'abd'],
  'alexander': ['aleksandr', 'aleksander'],
  'vladimir': ['volodymyr', 'wladimir'],
  'sergei': ['sergey', 'serge'],
  'dmitri': ['dmitry', 'dimitri'],
  'yusuf': ['youssef', 'yousef', 'joseph'],
  'ibrahim': ['abraham', 'ebrahim'],
  'chen': ['chan'],
  'lee': ['li'],
  'wang': ['wong'],
  'zhang': ['chang'],
};

export function expandNameVariants(name: string): string[] {
  const parts = name.toLowerCase().split(/\s+/);
  const variants = [name.toLowerCase()];

  for (let i = 0; i < parts.length; i++) {
    const partVariants = NAME_VARIANTS[parts[i]];
    if (partVariants) {
      for (const variant of partVariants) {
        const newParts = [...parts];
        newParts[i] = variant;
        variants.push(newParts.join(' '));
      }
    }
  }

  return variants;
}
