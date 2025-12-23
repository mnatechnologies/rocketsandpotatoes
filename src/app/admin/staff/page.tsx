'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {createLogger} from "@/lib/utils/logger";

const logger = createLogger('STAFF_PAGE');

interface Staff {
  id: string;
  clerk_user_id: string;
  full_name: string;
  email: string;
  position?: string;
  department?: string;
  employment_start_date?: string;
  employment_end_date?: string;
  is_active: boolean;
  requires_aml_training: boolean;
  created_at: string;
  training_status?: {
    status: 'compliant' | 'overdue' | 'no_training' | 'not_applicable';
    label: string;
    color: string;
  };
  clerkRole?: string | null;
  hasManagementAuthority?: boolean;
  canApproveHighRisk?: boolean;
}

export default function AdminStaffPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/');
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin, showInactive]);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/admin/staff?active=${!showInactive}`);
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
      }
    } catch (error) {
      logger.error('Error fetching staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Staff member added successfully');
        setShowAddModal(false);
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to add staff member');
      }
    } catch (error) {
      logger.error('Error adding staff:', error);
      toast.error('Failed to add staff member');
    }
  };

  const handleDeactivate = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Staff member deactivated');
        fetchStaff();
      } else {
        toast.error('Failed to deactivate staff member');
      }
    } catch (error) {
      logger.error('Error deactivating staff:', error);
      toast.error('Failed to deactivate staff member');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">Staff Management</h1>
            <p className="text-muted-foreground mt-2">
              AML/CTF Training Compliance - Section 3.1
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            + Add Staff Member
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Active Staff</div>
            <div className="text-3xl font-bold text-primary">
              {staff.filter(s => s.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Needs Training</div>
            <div className="text-3xl font-bold text-red-600">
              {staff.filter(s =>
                s.is_active &&
                s.training_status &&
                (s.training_status.status === 'no_training' || s.training_status.status === 'overdue')
              ).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Compliant</div>
            <div className="text-3xl font-bold text-green-600">
              {staff.filter(s =>
                s.is_active &&
                s.training_status &&
                s.training_status.status === 'compliant'
              ).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Staff</div>
            <div className="text-3xl font-bold text-gray-900">
              {staff.length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show inactive staff</span>
            </label>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Authority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AML Training
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No staff members found. Add your first staff member to get started.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Since {new Date(member.employment_start_date || member.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.clerkRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                          member.clerkRole === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.clerkRole || 'No Role'}
                        </div>
                        {member.canApproveHighRisk && (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Can approve high-risk decisions
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.position || '-'}</div>
                      {member.department && (
                        <div className="text-xs text-gray-500">{member.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.requires_aml_training ? (
                        <span className="text-sm text-yellow-600 font-medium">Required</span>
                      ) : (
                        <span className="text-sm text-gray-500">Not Required</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.training_status && (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.training_status.color === 'green'
                              ? 'bg-green-100 text-green-800'
                              : member.training_status.color === 'red'
                              ? 'bg-red-100 text-red-800'
                              : member.training_status.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.training_status.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/staff/${member.id}`)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        View
                      </button>
                      {member.is_active && (
                        <button
                          onClick={() => handleDeactivate(member.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <AddStaffModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddStaff}
          />
        )}
      </div>
    </div>
  );
}

// Add Staff Modal Component
function AddStaffModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [clerkUsers, setClerkUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState({
    clerk_user_id: '',
    full_name: '',
    email: '',
    position: '',
    department: '',
    employment_start_date: new Date().toISOString().split('T')[0],
    requires_aml_training: true,
    role: '',
  });

  useEffect(() => {
    fetchClerkUsers();
  }, []);

  const fetchClerkUsers = async () => {
    try {
      const response = await fetch('/api/admin/clerk-users');
      const data = await response.json();
      if (data.success) {
        setClerkUsers(data.users);
      }
    } catch (error) {
      logger.error('Error fetching Clerk users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);

    const selectedUser = clerkUsers.find(u => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        clerk_user_id: selectedUser.id,
        full_name: selectedUser.fullName,
        email: selectedUser.email,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl text-primary font-bold mb-6 ">Add Staff Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User from Clerk *
            </label>
            {loadingUsers ? (
              <div className="text-sm text-gray-500">Loading users...</div>
            ) : (
              <select
                required
                value={selectedUserId}
                onChange={handleUserSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-primary"
              >
                <option value="">-- Select a user --</option>
                {clerkUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            )}
            {clerkUsers.length === 0 && !loadingUsers && (
              <p className="text-sm text-gray-500 mt-1">
                No available users. All Clerk users already have staff records.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-primary"
              disabled={!selectedUserId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-primary"
              disabled={!selectedUserId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">
              Position
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Start Date
            </label>
            <input
              type="date"
              value={formData.employment_start_date}
              onChange={(e) => setFormData({ ...formData, employment_start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires_training"
              checked={formData.requires_aml_training}
              onChange={(e) => setFormData({ ...formData, requires_aml_training: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="requires_training" className="text-sm text-gray-700">
              Requires AML/CTF Training
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-primary"
            >
              <option value="">Select role...</option>
              <option value="admin">Admin (Full Access)</option>
              <option value="manager">Manager (Management Approvals)</option>
              <option value="staff">Staff (Limited Access)</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Add Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
