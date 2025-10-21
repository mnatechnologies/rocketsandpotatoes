'use client';

import { useState } from 'react';

const DOCUMENT_OPTIONS = {
  primary_photo: [
    { value: 'passport', label: 'Passport', description: 'Australian or foreign passport' },
    { value: 'drivers_license', label: "Driver's License", description: 'Australian license (front & back)' },
    { value: 'proof_of_age_card', label: 'Proof of Age Card', description: 'State/territory issued' },
  ],
  primary_non_photo: [
    { value: 'birth_certificate', label: 'Birth Certificate', description: 'Australian or foreign' },
    { value: 'citizenship_certificate', label: 'Citizenship Certificate', description: 'Australian citizenship' },
    { value: 'pension_card', label: 'Pension/Concession Card', description: 'Government issued' },
  ],
  secondary: [
    { value: 'medicare_card', label: 'Medicare Card', description: 'Current Australian Medicare card' },
    { value: 'bank_statement', label: 'Bank Statement', description: 'Less than 12 months old' },
    { value: 'utility_bill', label: 'Utility Bill', description: 'Electricity, gas, water, phone (< 3 months)' },
    { value: 'council_rates', label: 'Council Rates Notice', description: 'Recent rates notice' },
  ],
};

interface Props {
  customerId: string;
}

export function DocumentUploadFlow({ customerId  }: Props) {
  const [verificationMethod, setVerificationMethod] = useState<'auto' | 'manual'>('auto');
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const handleMethodSelection = (method: 'auto' | 'manual') => {
    setVerificationMethod(method);
  };

  const handleDocumentTypeSelect = (category: string, docType: string) => {
    setSelectedDocuments([...selectedDocuments, { category, docType }]);
  };

  const handleFileUpload = async (docType: string, category: string, file: File) => {
    setUploadedFiles({ ...uploadedFiles, [docType]: file });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('customerId', customerId);
    formData.append('documentType', docType);
    formData.append('documentCategory', category);

    try {
      const response = await fetch('/api/kyc/upload-document', {
        method: 'POST',
        body: formData,
      } as RequestInit);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });
      alert('Failed to upload document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Submit for manual review
    await fetch('/api/kyc/manual-ver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        verificationMethod: 'manual_document',
        documents: selectedDocuments.map(doc => ({
          category: doc.category,
          type: doc.docType,
          uploaded: !!uploadedFiles[doc.docType],
        })),
      }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Identity Verification</h2>

      {/* Method selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => handleMethodSelection('auto')}
          className={`p-6 border-2 rounded-lg ${
            verificationMethod === 'auto'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300'
          }`}
        >
          <h3 className="font-bold mb-2">Quick Verification</h3>
          <p className="text-sm text-gray-600">
            Use passport or driver's license (2 minutes)
          </p>
        </button>

        <button
          onClick={() => handleMethodSelection('manual')}
          className={`p-6 border-2 rounded-lg ${
            verificationMethod === 'manual'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300'
          }`}
        >
          <h3 className="font-bold mb-2">Alternative Documents</h3>
          <p className="text-sm text-gray-600">
            Use birth certificate, Medicare card, etc. (1-2 days review)
          </p>
        </button>
      </div>

      {verificationMethod === 'auto' && (
        <div className="space-y-4">
          <p className="text-gray-700 mb-4">
            We'll use Stripe Identity to verify your passport or driver's license automatically.
          </p>
          <button
            onClick={() => {/* Stripe Identity flow */}}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Start Quick Verification
          </button>
        </div>
      )}

      {verificationMethod === 'manual' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              📋 Manual verification typically takes 1-2 business days
            </p>
          </div>

          {/* Primary document selection */}
          <div>
            <h3 className="font-semibold mb-3">Step 1: Choose Primary ID</h3>
            <p className="text-sm text-gray-600 mb-3">Select ONE option:</p>

            <div className="space-y-2">
              <div className="font-medium text-sm text-gray-700 mb-2">
                Option A: Photographic ID
              </div>
              {DOCUMENT_OPTIONS.primary_photo.map(doc => (
                <label key={doc.value} className="flex items-start p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="primary_id"
                    value={doc.value}
                    onChange={() => handleDocumentTypeSelect('primary_photo', doc.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{doc.label}</div>
                    <div className="text-sm text-gray-600">{doc.description}</div>
                  </div>
                </label>
              ))}

              <div className="font-medium text-sm text-gray-700 mb-2 mt-4">
                Option B: Non-Photographic ID (requires 2 additional documents)
              </div>
              {DOCUMENT_OPTIONS.primary_non_photo.map(doc => (
                <label key={doc.value} className="flex items-start p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="primary_id"
                    value={doc.value}
                    onChange={() => handleDocumentTypeSelect('primary_non_photo', doc.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{doc.label}</div>
                    <div className="text-sm text-gray-600">{doc.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Secondary documents (if birth cert selected) */}
          {selectedDocuments.some(d => d.category === 'primary_non_photo') && (
            <div>
              <h3 className="font-semibold mb-3">Step 2: Add Supporting Documents</h3>
              <p className="text-sm text-gray-600 mb-3">Select TWO options:</p>

              <div className="space-y-2">
                {DOCUMENT_OPTIONS.secondary.map(doc => (
                  <label key={doc.value} className="flex items-start p-3 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={doc.value}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleDocumentTypeSelect('secondary', doc.value);
                        }
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium">{doc.label}</div>
                      <div className="text-sm text-gray-600">{doc.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* File uploads */}
          {selectedDocuments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Step 3: Upload Documents</h3>
              <div className="space-y-4">
                {selectedDocuments.map((doc, idx) => (
                  <div key={idx} className="border rounded p-4">
                    <label className="block font-medium mb-2">
                      {doc.docType.replace(/_/g, ' ').toUpperCase()}
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.docType, doc.category, file);
                      }}
                      className="block w-full"
                    />
                    {uploadedFiles[doc.docType] && (
                      <p className="text-sm text-green-600 mt-2">✓ Uploaded</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDocuments.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(uploadedFiles).length < selectedDocuments.length}
              className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
            >
              Submit for Review
            </button>
          )}
        </div>
      )}

      {/* Help section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Need help?</h4>
        <p className="text-sm text-gray-600 mb-2">
          Don't have standard ID? We can accept:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li>• Recently expired documents (up to 2 years)</li>
          <li>• Foreign identity documents with translation</li>
          <li>• Referee statements in special cases</li>
        </ul>
        <button className="text-sm text-blue-600 mt-2 underline">
          Contact support for alternative options
        </button>
      </div>
    </div>
  );
}