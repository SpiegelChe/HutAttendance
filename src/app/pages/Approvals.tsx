import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Check, X, Clock, Mail, User, UserCircle } from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: 'staff' | 'manager' | 'admin';
  created_at: string;
  approved: boolean;
}

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pending users:', fetchError);
        setError('Failed to load pending approvals');
      } else {
        setPendingUsers(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }

    setProcessingId(userId);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Error approving user:', updateError);
        setError('Failed to approve user');
      } else {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        setError('');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }

    if (!confirm('Are you sure you want to deny this user? This will delete their account.')) {
      return;
    }

    setProcessingId(userId);
    try {
      // Delete the user's profile (the auth trigger will handle cleanup)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Error denying user:', deleteError);
        setError('Failed to deny user');
      } else {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        setError('');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Pending Approvals
          </h1>
          <p className="text-xl text-gray-600">
            Review and approve new user registrations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl mb-6 text-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading pending approvals...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          /* No Pending Users */
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-12 text-center">
            <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-green-600" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">All Caught Up!</h2>
            <p className="text-xl text-gray-600">
              There are no pending user approvals at this time.
            </p>
          </div>
        ) : (
          /* Pending Users List */
          <div className="space-y-6">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 md:p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCircle className="text-white" size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {user.full_name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Mail size={18} />
                          <span className="text-lg">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold ${
                              user.role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : user.role === 'manager'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <User size={16} />
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                          <span className="flex items-center gap-2 text-gray-500 text-base">
                            <Clock size={16} />
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role Description */}
                    <div className="bg-gray-50 rounded-xl p-4 mt-4">
                      <p className="text-base text-gray-700">
                        {user.role === 'admin' ? (
                          <>
                            <strong>Admin Access:</strong> Full access to all features including user management,
                            program creation/editing, participant registration, and attendance tracking.
                          </>
                        ) : user.role === 'manager' ? (
                          <>
                            <strong>Manager Access:</strong> Can register participants and add them to programs.
                            Cannot manage programs or change user roles.
                          </>
                        ) : (
                          <>
                            <strong>Staff Access:</strong> Limited access to mark attendance for assigned programs
                            and view training materials only.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-3 md:w-48">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingId === user.id}
                      className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-green-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      <Check size={20} />
                      {processingId === user.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleDeny(user.id)}
                      disabled={processingId === user.id}
                      className="flex-1 md:flex-none bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      <X size={20} />
                      {processingId === user.id ? 'Processing...' : 'Deny'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">ℹ️ Approval Guidelines</h3>
          <ul className="text-base text-blue-800 space-y-1 list-disc list-inside">
            <li>Verify the user's identity before approving</li>
            <li>Ensure the requested role matches their actual position</li>
            <li>Denied users will have their accounts permanently deleted</li>
            <li>Approved users will receive email confirmation</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
