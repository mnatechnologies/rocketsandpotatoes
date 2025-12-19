/**
 * Authorized Certifiers List
 * Based on AUSTRAC requirements for document certification
 * Reference: https://www.austrac.gov.au/business/core-guidance/customer-identification-and-verification/certifying-documents
 */

export interface AuthorizedCertifier {
  value: string;
  label: string;
  description: string;
  requiresRegistration: boolean;
}

export const AUTHORIZED_CERTIFIERS: AuthorizedCertifier[] = [
  // Medical Professionals
  {
    value: 'doctor',
    label: 'Medical Practitioner (Doctor)',
    description: 'Registered medical practitioner',
    requiresRegistration: true,
  },
  {
    value: 'dentist',
    label: 'Dentist',
    description: 'Registered dentist',
    requiresRegistration: true,
  },
  {
    value: 'pharmacist',
    label: 'Pharmacist',
    description: 'Registered pharmacist',
    requiresRegistration: true,
  },
  {
    value: 'nurse',
    label: 'Registered Nurse',
    description: 'Registered nurse with 5+ years continuous registration',
    requiresRegistration: true,
  },

  // Legal Professionals
  {
    value: 'lawyer',
    label: 'Lawyer/Solicitor',
    description: 'Practicing lawyer or solicitor',
    requiresRegistration: true,
  },
  {
    value: 'jp',
    label: 'Justice of the Peace (JP)',
    description: 'Registered Justice of the Peace',
    requiresRegistration: true,
  },
  {
    value: 'notary_public',
    label: 'Notary Public',
    description: 'Registered notary public',
    requiresRegistration: true,
  },

  // Financial Professionals
  {
    value: 'accountant',
    label: 'Chartered Accountant (CA/CPA)',
    description: 'Member of CPA Australia, Chartered Accountants ANZ, or IPA',
    requiresRegistration: true,
  },
  {
    value: 'financial_advisor',
    label: 'Finance Company Officer',
    description: 'Officer with 5+ years continuous service',
    requiresRegistration: false,
  },

  // Government Officials
  {
    value: 'police_officer',
    label: 'Police Officer',
    description: 'Serving police officer (Sergeant or above)',
    requiresRegistration: true,
  },
  {
    value: 'public_servant',
    label: 'Commonwealth/State Public Servant',
    description: 'Public servant employed on ongoing basis, APS Level 4+',
    requiresRegistration: false,
  },
  {
    value: 'court_officer',
    label: 'Court Registrar or Deputy Registrar',
    description: 'Registrar or deputy registrar of a court',
    requiresRegistration: false,
  },

  // Education Professionals
  {
    value: 'teacher',
    label: 'Teacher (Registered)',
    description: 'Currently registered teacher',
    requiresRegistration: true,
  },

  // Other Professionals
  {
    value: 'engineer',
    label: 'Engineer (Professional)',
    description: 'Professional engineer registered with Engineers Australia',
    requiresRegistration: true,
  },
  {
    value: 'minister',
    label: 'Minister of Religion',
    description: 'Registered minister of religion',
    requiresRegistration: true,
  },
  {
    value: 'chiropractor',
    label: 'Chiropractor',
    description: 'Registered chiropractor',
    requiresRegistration: true,
  },
  {
    value: 'veterinarian',
    label: 'Veterinarian',
    description: 'Registered veterinary surgeon',
    requiresRegistration: true,
  },
  {
    value: 'psychologist',
    label: 'Psychologist',
    description: 'Registered psychologist',
    requiresRegistration: true,
  },
];

/**
 * Certification requirements that must be present on certified documents
 */
export const CERTIFICATION_REQUIREMENTS = [
  'Certifier has sighted the original document',
  'Certifier has compared the copy to the original',
  'Statement "This is a true copy of the original document"',
  'Certifier\'s full name clearly written',
  'Certifier\'s qualification/title',
  'Certifier\'s registration number (if applicable)',
  'Certifier\'s signature',
  'Date of certification',
  'Certifier\'s contact details (address or phone)',
];

/**
 * Standard certification statement template
 */
export const CERTIFICATION_STATEMENT_TEMPLATE = `I certify that this is a true copy of the original document, which I have sighted.

Certifier Name: [Full Name]
Qualification: [e.g., Justice of the Peace, Medical Practitioner]
Registration Number: [if applicable]
Signature: _______________
Date: [DD/MM/YYYY]
Contact: [Address or Phone]`;

/**
 * Validate if a certifier type requires registration number
 */
export function requiresRegistrationNumber(certifierType: string): boolean {
  const certifier = AUTHORIZED_CERTIFIERS.find(c => c.value === certifierType);
  return certifier?.requiresRegistration ?? false;
}

/**
 * Get certifier label by v1alue
 */
export function getCertifierLabel(certifierType: string): string {
  const certifier = AUTHORIZED_CERTIFIERS.find(c => c.value === certifierType);
  return certifier?.label ?? certifierType;
}
