import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, UserCheck, Plus } from 'lucide-react';
import { supabase, Participant, Program, isSupabaseConfigured } from '../../lib/supabase';

export default function AddToProgram() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParticipants();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedParticipant) {
      fetchAvailablePrograms(selectedParticipant);
    } else {
      setAvailablePrograms(programs);
    }
  }, [selectedParticipant, programs]);

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
      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchAvailablePrograms = async (participantId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // Fetch all enrollments for this participant
      const { data: enrollments, error } = await supabase
        .from('program_enrollments')
        .select('program_id')
        .eq('participant_id', participantId);

      if (error) throw error;

      // Get list of program IDs the participant is already enrolled in
      const enrolledProgramIds = (enrollments || []).map(e => e.program_id);

      // Filter programs to show only those NOT enrolled
      const filtered = programs.filter(p => !enrolledProgramIds.includes(p.id));
      setAvailablePrograms(filtered);
    } catch (err) {
      console.error('Error fetching available programs:', err);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;

    const term = searchTerm.toLowerCase();
    return participants.filter(p =>
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term))
    );
  }, [searchTerm, participants]);

  const handleAddToProgram = async () => {
    if (!selectedParticipant || !selectedProgram) {
      alert('Please select both a participant and a program');
      return;
    }

    try {
      const { error } = await supabase
        .from('program_enrollments')
        .insert([
          {
            participant_id: selectedParticipant,
            program_id: selectedProgram
          }
        ]);

      if (error) {
        // Check if it's a duplicate enrollment error
        if (error.code === '23505') {
          alert('This participant is already enrolled in this program');
          return;
        }
        throw error;
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setSelectedParticipant(null);
        setSelectedProgram('');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding participant to program:', err);
      alert('Failed to add participant to program: ' + err.message);
    }
  };

  const selectedParticipantData = participants.find(p => p.id === selectedParticipant);

  return (
    <Layout title="Add Participant to Program">
      <div className="max-w-6xl mx-auto">
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
                <UserCheck size={48} className="text-white" strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Success!
              </h3>
              <p className="text-xl text-gray-600 font-semibold">Participant added to program</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl mb-6 text-lg">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Instructions</h3>
          <ol className="text-base text-blue-800 space-y-2 list-decimal list-inside">
            <li>Search for a participant using the search box below</li>
            <li>Click on a participant to select them</li>
            <li>Choose a program from the dropdown</li>
            <li>Click "Add to Program" to enroll them</li>
          </ol>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={28} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-20 pr-6 py-6 text-xl border-4 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white font-semibold"
            />
          </div>
        </div>

        {/* Selected Participant & Program Selection */}
        {selectedParticipant && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 mb-8 border-2 border-purple-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Selected Participant</h3>
            <div className="bg-white rounded-xl p-6 mb-6">
              <p className="text-xl font-bold text-gray-900">
                {selectedParticipantData?.first_name} {selectedParticipantData?.last_name}
              </p>
              <p className="text-lg text-gray-600">{selectedParticipantData?.email}</p>
              <p className="text-lg text-gray-600">{selectedParticipantData?.phone}</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xl font-bold text-gray-900">
                Select Program
              </label>
              {availablePrograms.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold text-yellow-800">
                    This participant is already enrolled in all available programs.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-6 py-5 text-xl border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white font-semibold"
                >
                  <option value="">Choose a program...</option>
                  {availablePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} - {program.days?.join(', ')} at {program.start_time}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAddToProgram}
                  disabled={!selectedProgram || availablePrograms.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Plus size={28} />
                    Add to Program
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedParticipant(null);
                    setSelectedProgram('');
                  }}
                  className="px-8 py-5 border-4 border-gray-300 text-gray-700 font-bold text-xl rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading participants...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="bg-gray-100 rounded-2xl p-12 text-center">
            <Search className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No participants found</h3>
            <p className="text-lg text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No participants have been registered yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-5 text-left text-lg font-bold">Name</th>
                  <th className="px-6 py-5 text-left text-lg font-bold hidden md:table-cell">Email</th>
                  <th className="px-6 py-5 text-left text-lg font-bold hidden lg:table-cell">Phone</th>
                  <th className="px-6 py-5 text-left text-lg font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipants.map((participant, index) => (
                  <tr
                    key={participant.id}
                    className={`${
                      selectedParticipant === participant.id
                        ? 'bg-purple-100 border-l-4 border-purple-600'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <td className="px-6 py-5 text-lg font-semibold text-gray-900">
                      {participant.first_name} {participant.last_name}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-600 hidden md:table-cell">
                      {participant.email || 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-600 hidden lg:table-cell">
                      {participant.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => setSelectedParticipant(participant.id || null)}
                        className={`px-6 py-3 rounded-xl font-bold text-base transition-all ${
                          selectedParticipant === participant.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {selectedParticipant === participant.id ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
