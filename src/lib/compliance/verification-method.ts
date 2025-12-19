// Multi-document verification flow

type VerificationMethod =
  | 'stripe_identity'      // Passport or driver's license
  | 'manual_document'      // Birth cert, Medicare, etc.
  | 'electronic_dvs'       // DVS check via GreenID
  | 'alternative';         // Referee, expired ID, etc.

interface DocumentRequirement {
  category: 'primary_photo' | 'primary_non_photo' | 'secondary' | 'alternative';
  acceptedTypes: string[];
  minimumRequired: number;
}

// Define verification requirements
// const VERIFICATION_REQUIREMENTS: Record<string, DocumentRequirement[]> = {
//   // Standard flow - Stripe Identity
//   stripe_identity: [
//     {
//       category: 'primary_photo',
//       acceptedTypes: ['passport', 'drivers_license'],
//       minimumRequired: 1,
//     },
//   ],
//
//   // Manual verification - Birth certificate
//   birth_certificate: [
//     {
//       category: 'primary_non_photo',
//       acceptedTypes: ['birth_certificate', 'citizenship_certificate'],
//       minimumRequired: 1,
//     },
//     {
//       category: 'secondary',
//       acceptedTypes: ['medicare_card', 'bank_statement', 'utility_bill'],
//       minimumRequired: 2, // Need 2 secondary documents
//     },
//   ],
//
//   // Alternative methods
//   alternative: [
//     {
//       category: 'alternative',
//       acceptedTypes: ['referee_statement', 'expired_id', 'government_letter'],
//       minimumRequired: 1,
//     },
//     {
//       category: 'secondary',
//       acceptedTypes: ['medicare_card', 'bank_statement', 'utility_bill'],
//       minimumRequired: 2,
//     },
//   ],
// };