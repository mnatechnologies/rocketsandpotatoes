'use client';

import { useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import { AUTHORIZED_CERTIFIERS, CERTIFICATION_STATEMENT_TEMPLATE, requiresRegistrationNumber } from '@/lib/compliance/authorized-certifiers';

const logger = createLogger('DOCUMENT_UPLOAD');

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
  onStripeVerify?: () => void;
  onBackToSelection?: () => void;
}

export function DocumentUploadFlow({ customerId, onStripeVerify, onBackToSelection }: Props) {
  const [verificationMethod, setVerificationMethod] = useState<'auto' | 'manual'>('auto');
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadResults, setUploadResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Certification state for each document
  const [certificationData, setCertificationData] = useState<Record<string, {
    isCertified: boolean;
    certifierName: string;
    certifierType: string;
    certifierRegistration: string;
    certificationDate: string;
  }>>({});

  const [showCertificationInfo, setShowCertificationInfo] = useState(false);

  const handleMethodSelection = (method: 'auto' | 'manual') => {
    setVerificationMethod(method);
  };

  const handleDocumentTypeSelect = (category: string, docType: string) => {
    setSelectedDocuments(prev => {
      if (category === 'primary_photo' || category === 'primary_non_photo') {
        const withoutPrimary = prev.filter(
          doc => doc.category !== 'primary_photo' && doc.category !== 'primary_non_photo'
        );
        return [...withoutPrimary, { category, docType }];
      }
      // For secondary documents (checkboxes), check if already exists
      const exists = prev.some(doc => doc.docType === docType);
      if (exists) {
        return prev; // Already selected, don't add duplicate
      }

      // Add secondary document
      return [...prev, { category, docType }];
    });
  };

  const handleFileUpload = async (docType: string, category: string, file: File) => {
    // Mark as uploading
    setUploadingFiles(prev => ({ ...prev, [docType]: true }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('customerId', customerId);
    formData.append('documentType', docType);
    formData.append('documentCategory', category);

    // Add certification data if document is certified
    const certData = certificationData[docType];
    if (certData?.isCertified) {
      formData.append('isCertified', 'true');
      formData.append('certifierName', certData.certifierName);
      formData.append('certifierType', certData.certifierType);
      formData.append('certifierRegistration', certData.certifierRegistration);
      formData.append('certificationDate', certData.certificationDate);
    } else {
      formData.append('isCertified', 'false');
    }

    try {
      const response = await fetch('/api/kyc/upload-document', {
        method: 'POST',
        body: formData,
      } as RequestInit);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      logger.log('Upload successful:', result);

      // Store the uploaded file
      setUploadedFiles(prev => ({ ...prev, [docType]: file }));

      // Store success message
      setUploadResults(prev => ({
        ...prev,
        [docType]: {
          success: true,
          message: result.message || 'Document uploaded successfully!'
        }
      }));

    } catch (error) {
      logger.error('Upload error:', error);

      // Store error message
      setUploadResults(prev => ({
        ...prev,
        [docType]: {
          success: false,
          message: 'Failed to upload document. Please try again.'
        }
      }));

    } finally {
      // Remove uploading state
      setUploadingFiles(prev => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });
    }
  };

  const handleRemoveDocument = (docType: string) => {

    setSelectedDocuments(prev => prev.filter(doc => doc.docType !== docType));

    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });

    setUploadResults(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });


    setUploadingFiles(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
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
              ? 'border-primary bg-primary/10'
              : 'border-border'
          }`}
        >
          <h3 className="font-bold mb-2">Quick Verification</h3>
          <p className="text-sm text-muted-foreground">
            Use passport or driver&#39;s license (2 minutes)
          </p>
        </button>

        <button
          onClick={() => handleMethodSelection('manual')}
          className={`p-6 border-2 rounded-lg ${
            verificationMethod === 'manual'
              ? 'border-primary bg-primary/10'
              : 'border-border'
          }`}
        >
          <h3 className="font-bold mb-2">Alternative Documents</h3>
          <p className="text-sm text-muted-foreground">
            Use birth certificate, Medicare card, etc. (1-2 days review)
          </p>
        </button>
      </div>

      {verificationMethod === 'auto' && (
        <div className="space-y-4">
          <p className="text-foreground/80 mb-4">
            We&#39;ll use Stripe Identity to verify your passport or driver&#39;s license automatically.
          </p>
          <button
            onClick={onStripeVerify}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90"
          >
            Start Quick Verification
          </button>
        </div>
      )}

      {verificationMethod === 'manual' && (
        <div className="space-y-6">
          {/* Important Notice */}
          <div className="bg-blue-500/10 border-2 border-blue-500/30 p-5 rounded-lg">
            <h3 className="font-bold text-primary dark:text-blue-400 mb-3 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Important: Document Certification Required
            </h3>
            <div className="space-y-2 text-sm text-primary dark:text-blue-400">
              <p className="font-semibold">All documents MUST be certified copies of the original.</p>
              <p>A certified copy is a document that has been verified as a true copy of the original by an authorized person.</p>

              <div className="mt-3 bg-card/50 p-3 rounded border border-blue-500/20">
                <p className="font-semibold mb-2">How to get your documents certified:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Make a photocopy or scan of your original document</li>
                  <li>Take both the original and copy to an authorized certifier (see list below)</li>
                  <li>The certifier will compare them and certify the copy is accurate</li>
                  <li>Upload the certified copy here and enter the certifier&apos;s details</li>
                </ol>
              </div>

              <button
                onClick={() => setShowCertificationInfo(!showCertificationInfo)}
                className="mt-2 text-primary dark:text-blue-400 underline font-medium hover:text-blue-500"
              >
                {showCertificationInfo ? '▼ Hide' : '▶'} Who can certify my documents?
              </button>

              {showCertificationInfo && (
                <div className="mt-3 bg-card p-4 rounded-lg border border-blue-500/20">
                  <p className="font-semibold mb-2">Authorized Certifiers in Australia:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {AUTHORIZED_CERTIFIERS.map(cert => (
                      <li key={cert.value} className="flex items-start">
                        <span className="mr-2">•</span>
                        <div>
                          <span className="font-medium">{cert.label}</span>
                          <p className="text-primary dark:text-blue-400">{cert.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                    <p className="font-semibold mb-1">What the certifier must write on the copy:</p>
                    <pre className="whitespace-pre-wrap font-mono text-xs bg-card p-2 rounded-lg border border-border">
{CERTIFICATION_STATEMENT_TEMPLATE}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              📋 Manual verification typically takes 1-2 business days
            </p>
          </div>

          {/* Primary document selection */}
          <div>
            <h3 className="font-semibold mb-3">Step 1: Choose Primary ID</h3>
            <p className="text-sm text-muted-foreground mb-3">Select ONE option:</p>

            <div className="space-y-2">
              <div className="font-medium text-sm text-foreground/80 mb-2">
                Option A: Photographic ID
              </div>
              {DOCUMENT_OPTIONS.primary_photo.map(doc => (
                <label key={doc.value} className="flex items-start p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <input
                    type="radio"
                    name="primary_id"
                    value={doc.value}
                    onChange={() => handleDocumentTypeSelect('primary_photo', doc.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{doc.label}</div>
                    <div className="text-sm text-muted-foreground">{doc.description}</div>
                  </div>
                </label>
              ))}

              <div className="font-medium text-sm text-foreground/80 mb-2 mt-4">
                Option B: Non-Photographic ID (requires 2 additional documents)
              </div>
              {DOCUMENT_OPTIONS.primary_non_photo.map(doc => (
                <label key={doc.value} className="flex items-start p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <input
                    type="radio"
                    name="primary_id"
                    value={doc.value}
                    onChange={() => handleDocumentTypeSelect('primary_non_photo', doc.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{doc.label}</div>
                    <div className="text-sm text-muted-foreground">{doc.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Secondary documents (if birth cert selected) */}
          {selectedDocuments.some(d => d.category === 'primary_non_photo') && (
            <div>
              <h3 className="font-semibold mb-3">Step 2: Add Supporting Documents</h3>
              <p className="text-sm text-muted-foreground mb-3">Select TWO options:</p>

              <div className="space-y-2">
                {DOCUMENT_OPTIONS.secondary.map(doc => (
                  <label key={doc.value} className="flex items-start p-3 border rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={doc.value}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleDocumentTypeSelect('secondary', doc.value);
                        } else {
                          // Remove from selection when unchecked
                          setSelectedDocuments(prev =>
                            prev.filter(d => d.docType !== doc.value)
                          );
                        }
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium">{doc.label}</div>
                      <div className="text-sm text-muted-foreground">{doc.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* File uploads */}
          {/* File uploads */}
          {selectedDocuments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Step 3: Upload Documents</h3>
              <div className="space-y-4">
                {selectedDocuments.map((doc, idx) => (
                  <div key={idx} className="border rounded p-4 relative">
                    {/* Close button */}
                    <button
                      onClick={() => handleRemoveDocument(doc.docType)}
                      className="absolute top-2 right-2 text-muted-foreground/60 hover:text-red-600 transition-colors"
                      title="Remove this document"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <label className="block font-medium mb-3 pr-8">
                      {doc.docType.replace(/_/g, ' ').toUpperCase()}
                    </label>

                    {/* Certification Fields */}
                    <div className="bg-muted/50 p-4 rounded border border-border mb-4 space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`certified-${doc.docType}`}
                          checked={certificationData[doc.docType]?.isCertified || false}
                          onChange={(e) => {
                            setCertificationData(prev => ({
                              ...prev,
                              [doc.docType]: {
                                ...prev[doc.docType],
                                isCertified: e.target.checked,
                                certifierName: prev[doc.docType]?.certifierName || '',
                                certifierType: prev[doc.docType]?.certifierType || '',
                                certifierRegistration: prev[doc.docType]?.certifierRegistration || '',
                                certificationDate: prev[doc.docType]?.certificationDate || '',
                              }
                            }));
                          }}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor={`certified-${doc.docType}`} className="font-semibold text-sm">
                          ✓ This document has been certified by an authorized certifier
                        </label>
                      </div>

                      {certificationData[doc.docType]?.isCertified && (
                        <div className="space-y-3 pl-6 border-l-2 border-blue-300">
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Certifier&apos;s Full Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., Dr. Jane Smith"
                              value={certificationData[doc.docType]?.certifierName || ''}
                              onChange={(e) => {
                                setCertificationData(prev => ({
                                  ...prev,
                                  [doc.docType]: {
                                    ...prev[doc.docType],
                                    isCertified: true,
                                    certifierName: e.target.value,
                                    certifierType: prev[doc.docType]?.certifierType || '',
                                    certifierRegistration: prev[doc.docType]?.certifierRegistration || '',
                                    certificationDate: prev[doc.docType]?.certificationDate || '',
                                  }
                                }));
                              }}
                              className="w-full p-2 border rounded text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Certifier Type <span className="text-red-600">*</span>
                            </label>
                            <select
                              required
                              value={certificationData[doc.docType]?.certifierType || ''}
                              onChange={(e) => {
                                setCertificationData(prev => ({
                                  ...prev,
                                  [doc.docType]: {
                                    ...prev[doc.docType],
                                    isCertified: true,
                                    certifierName: prev[doc.docType]?.certifierName || '',
                                    certifierType: e.target.value,
                                    certifierRegistration: prev[doc.docType]?.certifierRegistration || '',
                                    certificationDate: prev[doc.docType]?.certificationDate || '',
                                  }
                                }));
                              }}
                              className="w-full p-2 border rounded text-sm"
                            >
                              <option value="">Select certifier type...</option>
                              {AUTHORIZED_CERTIFIERS.map(cert => (
                                <option key={cert.value} value={cert.value}>
                                  {cert.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {certificationData[doc.docType]?.certifierType &&
                            requiresRegistrationNumber(certificationData[doc.docType].certifierType) && (
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Registration Number <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g., MED12345"
                                value={certificationData[doc.docType]?.certifierRegistration || ''}
                                onChange={(e) => {
                                  setCertificationData(prev => ({
                                    ...prev,
                                    [doc.docType]: {
                                      ...prev[doc.docType],
                                      isCertified: true,
                                      certifierName: prev[doc.docType]?.certifierName || '',
                                      certifierType: prev[doc.docType]?.certifierType || '',
                                      certifierRegistration: e.target.value,
                                      certificationDate: prev[doc.docType]?.certificationDate || '',
                                    }
                                  }));
                                }}
                                className="w-full p-2 border rounded text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Professional registration number (check on the certification stamp)
                              </p>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Certification Date <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              max={new Date().toISOString().split('T')[0]}
                              value={certificationData[doc.docType]?.certificationDate || ''}
                              onChange={(e) => {
                                setCertificationData(prev => ({
                                  ...prev,
                                  [doc.docType]: {
                                    ...prev[doc.docType],
                                    isCertified: true,
                                    certifierName: prev[doc.docType]?.certifierName || '',
                                    certifierType: prev[doc.docType]?.certifierType || '',
                                    certifierRegistration: prev[doc.docType]?.certifierRegistration || '',
                                    certificationDate: e.target.value,
                                  }
                                }));
                              }}
                              className="w-full p-2 border rounded text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate certification if checked
                          const certData = certificationData[doc.docType];
                          if (certData?.isCertified) {
                            if (!certData.certifierName || !certData.certifierType || !certData.certificationDate) {
                              alert('Please complete all certification fields before uploading.');
                              e.target.value = '';
                              return;
                            }
                            if (requiresRegistrationNumber(certData.certifierType) && !certData.certifierRegistration) {
                              alert('Please provide the certifier\'s registration number.');
                              e.target.value = '';
                              return;
                            }
                          }
                          handleFileUpload(doc.docType, doc.category, file);
                        }
                      }}
                      disabled={uploadingFiles[doc.docType]}
                      className="block w-full bg-muted rounded-lg text-foreground p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* Upload progress indicator */}
                    {uploadingFiles[doc.docType] && (
                      <div className="mt-2 flex items-center text-primary">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}

                    {/* Success message */}
                    {uploadResults[doc.docType]?.success && (
                      <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Upload Successful!</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {uploadedFiles[doc.docType]?.name} ({(uploadedFiles[doc.docType]?.size / 1024).toFixed(1)} KB)
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {uploadResults[doc.docType]?.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {uploadResults[doc.docType] && !uploadResults[doc.docType].success && (
                      <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Upload Failed</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {uploadResults[doc.docType]?.message}
                            </p>
                            <button
                              onClick={() => {
                                // Clear error and allow retry
                                setUploadResults(prev => {
                                  const updated = { ...prev };
                                  delete updated[doc.docType];
                                  return updated;
                                });
                              }}
                              className="text-xs text-red-600 underline mt-1 hover:text-destructive"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help section */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold mb-2">Need help?</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Don&#39;t have standard ID? We can accept:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
          <li>• Foreign identity documents with translation</li>
          <li>• Referee statements in special cases</li>
        </ul>
        <button className="text-sm text-primary mt-2 underline">
          Contact support for alternative options
        </button>
      </div>
    </div>
  );
}