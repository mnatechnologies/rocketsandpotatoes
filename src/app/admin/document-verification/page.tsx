'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCertifierLabel, CERTIFICATION_REQUIREMENTS } from '@/lib/compliance/authorized-certifiers';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('DOCU_VERF_PAGE')
interface CustomerDocument {
  id: string;
  customer_id: string;
  document_category: string;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_at: string;
  review_status: string;
  is_certified: boolean;
  certifier_name: string | null;
  certifier_type: string | null;
  certifier_registration_number: string | null;
  certification_date: string | null;
  certification_statement: string | null;
  certification_validated: boolean;
  certification_validated_by: string | null;
  certification_validated_at: string | null;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    verification_status: string;
  };
}

export default function DocumentVerificationPage() {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/document-verification?status=${filter}`);

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    documentId: string,
    decision: 'approved' | 'rejected',
    notes: string,
    rejectionReason?: string,
    certificationValidated?: boolean
  ) => {
    try {
      const response = await fetch('/api/admin/document-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          decision,
          notes,
          rejectionReason,
          certificationValidated
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document status');
      }

      alert(`Document ${decision} successfully`);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to update document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading documents...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document Verification</h1>
          <p className="text-muted-foreground">
            Review and verify customer-uploaded identity documents
          </p>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground border border-border'
              }`}
            >
              Pending ({documents.filter(d => d.review_status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground border border-border'
              }`}
            >
              All Documents
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
            ✓ No documents {filter === 'pending' ? 'pending review' : 'found'}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <DocumentReviewCard
                key={doc.id}
                document={doc}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
    </div>
  );
}

function DocumentReviewCard({
                              document,
                              onReview
                            }: {
  document: CustomerDocument;
  onReview: (id: string, decision: 'approved' | 'rejected', notes: string, rejectionReason?: string, certificationValidated?: boolean) => void;
}) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [certificationValidated, setCertificationValidated] = useState(false);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!notes.trim()) {
      alert('Please add review notes');
      return;
    }

    // If document is certified but admin hasn't validated certification
    if (document.is_certified && !certificationValidated && decision === 'approved') {
      const confirm = window.confirm(
        'You have not verified the certification requirements. Documents should only be approved if certification is properly validated. Continue anyway?'
      );
      if (!confirm) return;
    }

    if (decision === 'rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    await onReview(document.id, decision, notes, rejectionReason, certificationValidated);
    setProcessing(false);
  };

  const loadDocumentImage = async () => {
    if (imageUrl || loadingImage) return;

    setLoadingImage(true);
    try {
      const response = await fetch(`/api/admin/document-verification/view?documentId=${document.id}`);
      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.url);
      }
    } catch (error) {
      logger.error('Failed to load document image:', error);
    } finally {
      setLoadingImage(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const isImage = document.mime_type?.startsWith('image/');

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-card-foreground">
              {document.customer.first_name} {document.customer.last_name}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[document.review_status as keyof typeof statusColors] || 'bg-muted'}`}>
              {document.review_status.toUpperCase()}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{document.customer.email}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            <p><strong>Document Type:</strong> {document.document_type}</p>
            <p><strong>Category:</strong> {document.document_category}</p>
            <p><strong>File:</strong> {document.file_name} ({(document.file_size / 1024).toFixed(1)} KB)</p>
            <p><strong>Uploaded:</strong> {new Date(document.uploaded_at).toLocaleString()}</p>
          </div>

          {/* Certification Badge */}
          {document.is_certified ? (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Certified Document
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              NOT Certified
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setShowDetails(!showDetails);
            if (!showDetails && isImage) loadDocumentImage();
          }}
          className="text-primary hover:text-primary/80 font-medium"
        >
          {showDetails ? '▲ Hide' : '▼ Review'}
        </button>
      </div>

      {showDetails && (
        <div className="border-t pt-4 mt-4 space-y-6">
          {/* Certification Details */}
          {document.is_certified && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-blue-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Certification Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Certifier Name:</span>
                  <p className="text-blue-900">{document.certifier_name}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Certifier Type:</span>
                  <p className="text-blue-900">{getCertifierLabel(document.certifier_type || '')}</p>
                </div>
                {document.certifier_registration_number && (
                  <div>
                    <span className="font-medium text-blue-800">Registration Number:</span>
                    <p className="text-blue-900">{document.certifier_registration_number}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-blue-800">Certification Date:</span>
                  <p className="text-blue-900">{document.certification_date ? new Date(document.certification_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2 text-sm">Certification Validation Checklist:</h5>
                <div className="space-y-1">
                  {CERTIFICATION_REQUIREMENTS.map((requirement, idx) => (
                    <label key={idx} className="flex items-start text-xs text-blue-800">
                      <input
                        type="checkbox"
                        className="mt-0.5 mr-2"
                      />
                      <span>{requirement}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-3 italic">
                  ⚠️ Admin: Check the document image to verify all certification requirements are present
                </p>
              </div>

              {/* Certification Validation Checkbox */}
              {document.review_status === 'pending' && (
                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certificationValidated}
                      onChange={(e) => setCertificationValidated(e.target.checked)}
                      className="mt-1 mr-3 h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-sm text-gray-900">
                        ✓ I have verified all certification requirements are present on the document
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Check this after verifying the document image shows all required certification elements
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Show validation status if already validated */}
              {document.certification_validated && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 text-xs">
                  <p className="text-green-800 font-semibold">
                    ✓ Certification validated
                    {document.certification_validated_at &&
                      ` on ${new Date(document.certification_validated_at).toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {!document.is_certified && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-yellow-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                ⚠️ Document NOT Certified
              </h4>
              <p className="text-sm text-yellow-800">
                This document was uploaded without certification. According to AUSTRAC requirements (Section 6.1),
                all manually uploaded documents should be certified by an authorized certifier.
              </p>
              <p className="text-sm text-yellow-800 mt-2 font-medium">
                Consider rejecting and requesting a properly certified copy.
              </p>
            </div>
          )}

          {/* Document Preview */}
          {isImage && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-card-foreground">Document Preview:</h4>
              {loadingImage ? (
                <div className="bg-muted rounded p-8 text-center text-muted-foreground">Loading image...</div>
              ) : imageUrl ? (
                <div className="relative w-full max-w-2xl border border-border rounded overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt="Document preview"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="bg-muted rounded p-4 text-center text-muted-foreground">
                  Unable to load preview
                </div>
              )}
            </div>
          )}

          {document.review_status === 'pending' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">Review Notes *</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-border bg-input text-foreground rounded p-2 h-24"
                  placeholder="Add your review notes here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">Rejection Reason (if rejecting)</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-border bg-input text-foreground rounded p-2"
                >
                  <option value="">Select reason...</option>
                  <option value="not_certified">Not Certified (AUSTRAC Requirement 6.1)</option>
                  <option value="invalid_certification">Invalid or Incomplete Certification</option>
                  <option value="poor_quality">Poor Quality / Unreadable</option>
                  <option value="expired">Document Expired</option>
                  <option value="wrong_type">Wrong Document Type</option>
                  <option value="incomplete">Incomplete Information</option>
                  <option value="fraudulent">Suspected Fraudulent Document</option>
                  <option value="other">Other (specify in notes)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision('approved')}
                  disabled={processing}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleDecision('rejected')}
                  disabled={processing}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          )}

          {document.review_status !== 'pending' && (
            <div className="bg-muted rounded p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Status:</strong> {document.review_status}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}