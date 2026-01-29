'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface DocumentUpload {
  category: 'primary_photo' | 'secondary';
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
}

const DOCUMENT_TYPES = {
  primary_photo: [
    { value: 'passport', label: 'Australian Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'proof_of_age_card', label: 'Proof of Age Card' },
  ],
  secondary: [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'medicare_card', label: 'Medicare Card' },
    { value: 'bank_statement', label: 'Bank Statement (recent)' },
    { value: 'utility_bill', label: 'Utility Bill (recent)' },
  ],
};

export default function UBODocumentUploadPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoaded } = useUser();

  const ownerId = params.ownerId as string;

  const [owner, setOwner] = useState<any>(null);
  const [primaryDoc, setPrimaryDoc] = useState<DocumentUpload>({
    category: 'primary_photo',
    file: null,
    uploaded: false,
    uploading: false,
  });
  const [secondaryDoc, setSecondaryDoc] = useState<DocumentUpload>({
    category: 'secondary',
    file: null,
    uploaded: false,
    uploading: false,
  });
  const [primaryType, setPrimaryType] = useState('');
  const [secondaryType, setSecondaryType] = useState('');
  const [isCertified, setIsCertified] = useState(false);
  const [certifierName, setCertifierName] = useState('');
  const [certifierType, setCertifierType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load owner details
  useEffect(() => {
    const loadOwner = async () => {
      const res = await fetch(`/api/business/owners/${ownerId}`);
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
      }
    };
    loadOwner();
  }, [ownerId]);

  const handleFileSelect = (
    category: 'primary' | 'secondary',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (category === 'primary') {
      setPrimaryDoc(prev => ({ ...prev, file }));
    } else {
      setSecondaryDoc(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async () => {
    if (!primaryDoc.file || !primaryType) {
      setError('Please upload a primary photo ID document');
      return;
    }

    if (isCertified && (!certifierName || !certifierType)) {
      setError('Please provide certifier details');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload primary document
      const formData = new FormData();
      formData.append('file', primaryDoc.file);
      formData.append('beneficial_owner_id', ownerId);
      formData.append('document_category', 'primary_photo');
      formData.append('document_type', primaryType);
      formData.append('is_certified', String(isCertified));
      if (isCertified) {
        formData.append('certifier_name', certifierName);
        formData.append('certifier_type', certifierType);
      }

      const primaryRes = await fetch(`/api/business/owners/${ownerId}/documents/verify`, {
        method: 'POST',
        body: formData,
      });

      if (!primaryRes.ok) {
        throw new Error('Failed to upload primary document');
      }

      // Upload secondary document if provided
      if (secondaryDoc.file && secondaryType) {
        const secondaryFormData = new FormData();
        secondaryFormData.append('file', secondaryDoc.file);
        secondaryFormData.append('beneficial_owner_id', ownerId);
        secondaryFormData.append('document_category', 'secondary');
        secondaryFormData.append('document_type', secondaryType);
        secondaryFormData.append('is_certified', String(isCertified));
        if (isCertified) {
          secondaryFormData.append('certifier_name', certifierName);
          secondaryFormData.append('certifier_type', certifierType);
        }

        await fetch(`/api/business/owners/${ownerId}/documents/verify`, {
          method: 'POST',
          body: secondaryFormData,
        });
      }

      // Update UBO status to pending review
      await fetch(`/api/business/owners/${ownerId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });

      // Redirect back to onboarding
      router.push('/onboarding/business');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || !owner) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          Document Verification for {owner.first_name} {owner.last_name}
        </h1>
        <p className="text-muted-foreground mb-8">
          Upload certified copies of identification documents for manual verification.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive-foreground">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Primary Photo ID */}
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Primary Photo ID <span className="text-destructive">*</span>
            </h3>

            <select
              value={primaryType}
              onChange={(e) => setPrimaryType(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4"
            >
              <option value="">Select document type...</option>
              {DOCUMENT_TYPES.primary_photo.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <label className="block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect('primary', e)}
                className="hidden"
              />
              {primaryDoc.file ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  {primaryDoc.file.name}
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF or image, max 10MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Secondary Document (Optional) */}
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Secondary Document (Optional)
            </h3>

            <select
              value={secondaryType}
              onChange={(e) => setSecondaryType(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4"
            >
              <option value="">Select document type...</option>
              {DOCUMENT_TYPES.secondary.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <label className="block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect('secondary', e)}
                className="hidden"
              />
              {secondaryDoc.file ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  {secondaryDoc.file.name}
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Click to upload</p>
                </div>
              )}
            </label>
          </div>

          {/* Certification Details */}
          <div className="p-6 bg-card border rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={isCertified}
                onChange={(e) => setIsCertified(e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="font-medium">Documents are certified copies</span>
                <p className="text-sm text-muted-foreground">
                  Check this if your documents have been certified by an authorized person
                  (JP, lawyer, accountant, etc.)
                </p>
              </div>
            </label>

            {isCertified && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block font-medium mb-2">Certifier Name</label>
                  <input
                    type="text"
                    value={certifierName}
                    onChange={(e) => setCertifierName(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    placeholder="Full name of certifier"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Certifier Type</label>
                  <select
                    value={certifierType}
                    onChange={(e) => setCertifierType(e.target.value)}
                    className="w-full border rounded-lg p-3"
                  >
                    <option value="">Select type...</option>
                    <option value="jp">Justice of the Peace</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="accountant">Chartered Accountant</option>
                    <option value="police_officer">Police Officer</option>
                    <option value="doctor">Medical Doctor</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="teacher">Registered Teacher</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !primaryDoc.file || !primaryType}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {submitting ? 'Uploading...' : 'Submit Documents for Review'}
          </button>

          <p className="text-sm text-muted-foreground text-center">
            Documents will be reviewed by our compliance team within 1-2 business days.
          </p>
        </div>
      </div>
    </div>
  );
}