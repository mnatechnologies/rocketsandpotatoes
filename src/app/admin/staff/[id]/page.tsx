'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {createLogger} from "@/lib/utils/logger";

const logger = createLogger('STAFF_DETAIL_PAGE')
interface TrainingRecord {
  id: string;
  training_type: string;
  training_date: string;
  training_provider?: string;
  topics_covered?: string[];
  duration_hours?: number;
  completion_status: string;
  pass_score?: number;
  certificate_url?: string;
  conducted_by?: string;
  next_training_due?: string;
  notes?: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  position?: string;
  department?: string;
  employment_start_date?: string;
  employment_end_date?: string;
  is_active: boolean;
  requires_aml_training: boolean;
  training_records: TrainingRecord[];
}

export default function StaffDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false);

  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/');
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin && staffId) {
      fetchStaffDetails();
    }
  }, [isAdmin, staffId]);

  const fetchStaffDetails = async () => {
    try {
      const response = await fetch(`/api/admin/staff/${staffId}`);
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
      } else {
        toast.error('Staff member not found');
        router.push('/admin/staff');
      }
    } catch (error) {
      logger.error('Error fetching staff:', error);
      toast.error('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTraining = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, staff_id: staffId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Training record added successfully');
        setShowAddTrainingModal(false);
        fetchStaffDetails();
      } else {
        toast.error(data.error || 'Failed to add training record');
      }
    } catch (error) {
      logger.error('Error adding training:', error);
      toast.error('Failed to add training record');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !staff) {
    return null;
  }

  const getTrainingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial_aml: 'Initial AML/CTF Training',
      annual_refresher: 'Annual Refresher',
      role_specific: 'Role-Specific Training',
      advanced_aml: 'Advanced AML/CTF',
    };
    return labels[type] || type;
  };

  const getTrainingStatus = () => {
    // Check if staff has any completed training
    const hasCompletedTraining = staff.training_records.some(
      t => t.completion_status === 'completed'
    );

    if (!hasCompletedTraining) {
      return { status: 'no_training', label: 'No Training', color: 'red' };
    }

    // Get all active due dates (future dates)
    const activeDueDates = staff.training_records
      .filter(t => t.next_training_due && t.completion_status === 'completed')
      .map(t => ({ date: new Date(t.next_training_due!), record: t }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (activeDueDates.length === 0) {
      // Has training but no future due date set
      return { status: 'compliant', label: 'Training Complete', color: 'green', nextDue: null };
    }

    const nextTraining = activeDueDates[0];
    const today = new Date();

    if (nextTraining.date < today) {
      return { status: 'overdue', label: 'Overdue', color: 'red', nextDue: nextTraining.date };
    }

    return { status: 'compliant', label: 'Compliant', color: 'green', nextDue: nextTraining.date };
  };

  const trainingStatus = getTrainingStatus();

  return (
    <div className="min-h-screen bg-background/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/admin/staff"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-6"
        >
          ← Back to Staff List
        </Link>

        {/* Staff Header */}
        <div className="bg-card rounded-lg shadow-card p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{staff.full_name}</h1>
              <div className="space-y-1">
                <p className="text-muted-foreground">{staff.email}</p>
                {staff.position && <p className="text-muted-foreground">{staff.position}</p>}
                {staff.department && <p className="text-muted-foreground">{staff.department}</p>}
              </div>
            </div>
            <div className="text-right">
              {staff.is_active ? (
                <span className="px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  Active
                </span>
              ) : (
                <span className="px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-muted text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t">
            <div>
              <div className="text-sm text-muted-foreground">Employment Start</div>
              <div className="font-semibold">
                <span className="text-primary">
                  {staff.employment_start_date
                    ? new Date(staff.employment_start_date).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Training Requirement</div>
              <div className="font-semibold">
                {staff.requires_aml_training ? (
                  <span className="text-yellow-600">AML/CTF Required</span>
                ) : (
                  <span className="text-muted-foreground">Not Required</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Training Status</div>
              <div className="font-semibold">
                {staff.requires_aml_training ? (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      trainingStatus.color === 'green'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : trainingStatus.color === 'yellow'
                        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {trainingStatus.label}
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Next Training Due</div>
              <div className="font-semibold">
                {trainingStatus.nextDue ? (
                  <span className={trainingStatus.status === 'overdue' ? 'text-red-600' : 'text-green-600'}>
                    {trainingStatus.nextDue.toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No future training scheduled</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Training Records */}
        <div className="bg-card rounded-lg shadow-card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Training Records</h2>
            <button
              onClick={() => setShowAddTrainingModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
            >
              + Add Training Record
            </button>
          </div>

          {staff.training_records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No training records found.</p>
              <button
                onClick={() => setShowAddTrainingModal(true)}
                className="mt-4 text-primary hover:text-primary/80 font-medium"
              >
                Add first training record
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {staff.training_records.map((record) => (
                <div key={record.id} className="border border-border rounded-lg p-6 hover:shadow-card-hover transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {getTrainingTypeLabel(record.training_type)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Completed: {new Date(record.training_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.completion_status === 'completed'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : record.completion_status === 'in_progress'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {record.completion_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {record.training_provider && (
                      <div>
                        <span className="text-muted-foreground">Provider: </span>
                        <span className="font-medium text-primary">{record.training_provider}</span>
                      </div>
                    )}
                    {record.duration_hours && (
                      <div>
                        <span className="text-muted-foreground">Duration: </span>
                        <span className="font-medium text-primary">{record.duration_hours} hours</span>
                      </div>
                    )}
                    {record.conducted_by && (
                      <div>
                        <span className="text-muted-foreground">Conducted by: </span>
                        <span className="font-medium text-primary">{record.conducted_by}</span>
                      </div>
                    )}
                    {record.pass_score !== null && record.pass_score !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Score: </span>
                        <span className="font-medium text-primary">{record.pass_score}%</span>
                      </div>
                    )}
                    {record.next_training_due && (
                      <div>
                        <span className="text-muted-foreground">Next Due: </span>
                        <span className="font-medium text-primary">
                          {new Date(record.next_training_due).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {record.topics_covered && record.topics_covered.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Topics Covered:</div>
                      <div className="flex flex-wrap gap-2">
                        {record.topics_covered.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                      <span className="text-muted-foreground">Notes: </span>
                      <span>{record.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Training Modal */}
        {showAddTrainingModal && (
          <AddTrainingModal
            onClose={() => setShowAddTrainingModal(false)}
            onSubmit={handleAddTraining}
            staffName={staff.full_name}
          />
        )}
      </div>
    </div>
  );
}

// Add Training Modal Component
function AddTrainingModal({
  onClose,
  onSubmit,
  staffName,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  staffName: string;
}) {
  const [formData, setFormData] = useState({
    training_type: 'initial_aml',
    training_date: new Date().toISOString().split('T')[0],
    training_provider: '',
    topics_covered: '',
    duration_hours: '',
    completion_status: 'completed',
    pass_score: '',
    conducted_by: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submissionData = {
      ...formData,
      topics_covered: formData.topics_covered
        ? formData.topics_covered.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
      pass_score: formData.pass_score ? parseFloat(formData.pass_score) : null,
    };

    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
        <h2 className="text-2xl font-bold mb-2 text-primary">Add Training Record</h2>
        <p className="text-muted-foreground mb-6">For: {staffName}</p>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Training Type *
              </label>
              <select
                required
                value={formData.training_type}
                onChange={(e) => setFormData({ ...formData, training_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              >
                <option value="initial_aml">Initial AML/CTF Training</option>
                <option value="annual_refresher">Annual Refresher</option>
                <option value="role_specific">Role-Specific Training</option>
                <option value="advanced_aml">Advanced AML/CTF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Training Date *
              </label>
              <input
                type="date"
                required
                value={formData.training_date}
                onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Completion Status
              </label>
              <select
                value={formData.completion_status}
                onChange={(e) => setFormData({ ...formData, completion_status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Training Provider
              </label>
              <input
                type="text"
                value={formData.training_provider}
                onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                placeholder="e.g., AUSTRAC eLearning, Internal"
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Conducted By
              </label>
              <input
                type="text"
                value={formData.conducted_by}
                onChange={(e) => setFormData({ ...formData, conducted_by: e.target.value })}
                placeholder="Trainer/Facilitator name"
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Pass Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.pass_score}
                onChange={(e) => setFormData({ ...formData, pass_score: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Topics Covered (comma-separated)
              </label>
              <input
                type="text"
                value={formData.topics_covered}
                onChange={(e) => setFormData({ ...formData, topics_covered: e.target.value })}
                placeholder="e.g., ML/TF risks, Customer identification, SMR reporting"
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md text-foreground/80 hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Add Training Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
