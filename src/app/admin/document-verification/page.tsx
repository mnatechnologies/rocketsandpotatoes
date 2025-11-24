'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
    rejectionReason?: string
  ) => {
    try {
      const response = await fetch('/api/admin/document-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          decision,
          notes,
          rejectionReason
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
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
    </div>
  );
}

function DocumentReviewCard({
                              document,
                              onReview
                            }: {
  document: CustomerDocument;
  onReview: (id: string, decision: 'approved' | 'rejected', notes: string, rejectionReason?: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!notes.trim()) {
      alert('Please add review notes');
      return;
    }
    if (decision === 'rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    await onReview(document.id, decision, notes, rejectionReason);
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
      console.error('Failed to load document image:', error);
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
        <div className="border-t pt-4 mt-4">
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