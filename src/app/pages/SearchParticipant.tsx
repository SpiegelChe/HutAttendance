import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, Eye, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Participant, isSupabaseConfigured } from '../../lib/supabase';

interface ParticipantWithEnrollments extends Participant {
  enrollment_count?: number;
}

export default function SearchParticipant() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [participants, setParticipants] = useState<ParticipantWithEnrollments[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;

      // Fetch enrollment counts for each participant
      const participantsWithCounts = await Promise.all(
        (data || []).map(async (participant) => {
          const { count } = await supabase
            .from('program_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('participant_id', participant.id);

          return {
            ...participant,
            enrollment_count: count || 0
          };
        })
      );

      setParticipants(participantsWithCounts);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = useMemo(() => {
    let filtered = participants;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = participants.filter(p =>
        p.first_name.toLowerCase().includes(term) ||
        p.last_name.toLowerCase().includes(term) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.phone && p.phone.includes(term))
      );
    }

    return filtered;
  }, [searchTerm, participants]);

  const activeParticipants = useMemo(() => {
    return filteredParticipants.filter(p => (p.enrollment_count || 0) > 0);
  }, [filteredParticipants]);

  const inactiveParticipants = useMemo(() => {
    return filteredParticipants.filter(p => (p.enrollment_count || 0) === 0);
  }, [filteredParticipants]);

  const handleViewProfile = (participantId: string | undefined) => {
    if (participantId) {
      navigate(`/participant/${participantId}`);
    }
  };

  return (
    <Layout title="Find Participant">
      <div className="max-w-6xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl mb-6 text-lg">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-orange-900 mb-2">Search Instructions</h3>
          <p className="text-base text-orange-800">
            Use the search box below to find participants by name, email, or phone number.
            Click "View Profile" to see detailed information about a participant.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-orange-200">
          <div className="flex items-center gap-4 mb-6 bg-orange-50 p-5 rounded-xl">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Search size={32} className="text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Search for a Participant</h3>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a name, email, or phone number..."
            className="w-full px-6 py-5 text-xl border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-orange-500 focus:border-orange-500 outline-none font-semibold"
          />
        </div>

        {/* Active Participants Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading participants...</p>
          </div>
        ) : (
          <>
            {/* Active Participants Section */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-green-200 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4">
                <h3 className="text-2xl font-bold">Active Participants ({activeParticipants.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <tr>
                      <th className="px-6 py-5 text-left text-lg font-bold">Name</th>
                      <th className="px-6 py-5 text-left text-lg font-bold hidden md:table-cell">Email</th>
                      <th className="px-6 py-5 text-left text-lg font-bold hidden lg:table-cell">Phone</th>
                      <th className="px-6 py-5 text-left text-lg font-bold hidden xl:table-cell">Date of Birth</th>
                      <th className="px-6 py-5 text-left text-lg font-bold hidden xl:table-cell">Registered</th>
                      <th className="px-6 py-5 text-left text-lg font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200">
                    {activeParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                          <Search className="mx-auto mb-4 text-gray-400" size={64} />
                          <p className="text-xl font-semibold">No active participants found</p>
                          <p className="text-lg mt-2">
                            {searchTerm ? 'Try a different search term' : 'No active participants have been registered yet'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      activeParticipants.map((participant, index) => (
                        <tr
                          key={participant.id}
                          className={`${
                            index % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50 hover:bg-orange-50'
                          } transition-colors`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-bold text-gray-900">
                                {participant.first_name} {participant.last_name}
                              </div>
                              <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                                ACTIVE
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-base text-gray-700 hidden md:table-cell">
                            {participant.email || 'N/A'}
                          </td>
                          <td className="px-6 py-5 text-base text-gray-700 font-semibold hidden lg:table-cell">
                            {participant.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-5 text-base text-gray-700 hidden xl:table-cell">
                            {participant.date_of_birth ? new Date(participant.date_of_birth).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-5 text-base text-gray-700 hidden xl:table-cell">
                            {participant.created_at ? new Date(participant.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-5">
                            <button
                              onClick={() => handleViewProfile(participant.id)}
                              className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg"
                            >
                              <Eye size={20} />
                              <span className="hidden sm:inline">View Profile</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inactive Participants Section */}
            {inactiveParticipants.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-gray-300">
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4 flex items-center justify-between hover:from-gray-600 hover:to-gray-700 transition-all"
                >
                  <h3 className="text-2xl font-bold">Inactive Participants ({inactiveParticipants.length})</h3>
                  {showInactive ? <ChevronUp size={32} /> : <ChevronDown size={32} />}
                </button>

                {showInactive && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
                        <tr>
                          <th className="px-6 py-5 text-left text-lg font-bold">Name</th>
                          <th className="px-6 py-5 text-left text-lg font-bold hidden md:table-cell">Email</th>
                          <th className="px-6 py-5 text-left text-lg font-bold hidden lg:table-cell">Phone</th>
                          <th className="px-6 py-5 text-left text-lg font-bold hidden xl:table-cell">Date of Birth</th>
                          <th className="px-6 py-5 text-left text-lg font-bold hidden xl:table-cell">Registered</th>
                          <th className="px-6 py-5 text-left text-lg font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-gray-200">
                        {inactiveParticipants.map((participant, index) => (
                          <tr
                            key={participant.id}
                            className={`${
                              index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100 hover:bg-gray-150'
                            } transition-colors`}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-bold text-gray-700">
                                  {participant.first_name} {participant.last_name}
                                </div>
                                <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                                  INACTIVE
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-base text-gray-600 hidden md:table-cell">
                              {participant.email || 'N/A'}
                            </td>
                            <td className="px-6 py-5 text-base text-gray-600 font-semibold hidden lg:table-cell">
                              {participant.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-5 text-base text-gray-600 hidden xl:table-cell">
                              {participant.date_of_birth ? new Date(participant.date_of_birth).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-5 text-base text-gray-600 hidden xl:table-cell">
                              {participant.created_at ? new Date(participant.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-5">
                              <button
                                onClick={() => handleViewProfile(participant.id)}
                                className="flex items-center gap-2 px-5 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg"
                              >
                                <Eye size={20} />
                                <span className="hidden sm:inline">View Profile</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-8 py-5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft size={24} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}