import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ClipboardCheck, Check, Calendar } from 'lucide-react';
import { supabase, Program } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface EnrolledParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsForSelectedDate, setProgramsForSelectedDate] = useState<Program[]>([]);
  const [programParticipants, setProgramParticipants] = useState<EnrolledParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  // Get day of week for a given date (0-6, where 0 is Sunday)
  const getDayOfWeek = (dateString: string) => {
    const selectedDate = new Date(dateString + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[selectedDate.getDay()];
  };

  // Get today's day of week (0-6, where 0 is Sunday)
  const getTodayDayOfWeek = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[today.getDay()];
  };

  // Format today's date nicely
  const getFormattedDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return today.toLocaleDateString('en-AU', options);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramParticipants(selectedProgram);
    } else {
      setProgramParticipants([]);
    }
  }, [selectedProgram]);

  // Update programs list when date changes
  useEffect(() => {
    if (programs.length > 0) {
      filterProgramsByDate(date);
    }
  }, [date, programs]);

  const filterProgramsByDate = (selectedDate: string) => {
    const dayOfWeek = getDayOfWeek(selectedDate);
    const filteredPrograms = programs.filter(program =>
      program.days && program.days.includes(dayOfWeek)
    );
    setProgramsForSelectedDate(filteredPrograms);
  };

  const fetchPrograms = async () => {
    try {
      let programsData: Program[] = [];

      // For staff role, only fetch programs they are assigned to
      if (user?.role === 'staff') {
        // Get the current user's ID from Supabase
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // First, get the program IDs this staff member is assigned to
          const { data: assignments, error: assignError } = await supabase
            .from('program_staff')
            .select('program_id')
            .eq('user_id', authUser.id);

          if (assignError) throw assignError;

          const assignedProgramIds = assignments?.map(a => a.program_id) || [];

          if (assignedProgramIds.length > 0) {
            // Fetch only the programs this staff is assigned to
            const { data, error } = await supabase
              .from('programs')
              .select('*')
              .in('id', assignedProgramIds)
              .order('name', { ascending: true });

            if (error) throw error;
            programsData = data || [];
          }
          // If no assignments, programsData remains empty
        }
      } else {
        // For manager and admin, fetch all programs
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        programsData = data || [];
      }

      setPrograms(programsData);
      // Filter programs based on the selected date
      const dayOfWeek = getDayOfWeek(date);
      const filteredPrograms = programsData.filter(program =>
        program.days && program.days.includes(dayOfWeek)
      );
      setProgramsForSelectedDate(filteredPrograms);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchProgramParticipants = async (programId: string) => {
    setLoading(true);
    try {
      // Fetch participants enrolled in this program
      const { data, error } = await supabase
        .from('program_enrollments')
        .select(`
          participant_id,
          participants (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('program_id', programId);

      if (error) throw error;

      // Transform the data to a flat structure
      const participants = data
        ?.map((enrollment: any) => enrollment.participants)
        .filter(Boolean) || [];

      setProgramParticipants(participants);
    } catch (err) {
      console.error('Error fetching program participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = (participantId: string) => {
    setAttendance(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }));
  };

  const handleSubmit = async () => {
    try {
      // Save attendance record for ALL participants in the program
      const attendanceRecords = programParticipants.map((participant) => ({
        program_id: selectedProgram,
        participant_id: participant.id,
        date: date,
        status: attendance[participant.id] ? 'present' : 'absent'
      }));

      if (attendanceRecords.length === 0) {
        alert('No participants to mark attendance for.');
        return;
      }

      // Insert attendance records
      const { error } = await supabase
        .from('attendance_records')
        .insert(attendanceRecords);

      if (error) throw error;

      console.log('Attendance submitted successfully');
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance. Please try again.');
    }
  };

  const selectedProgramName = programs.find(p => p.id === selectedProgram)?.name;

  if (showSuccess) {
    return (
      <Layout title="Mark Attendance">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-4 border-green-400 rounded-2xl p-12 md:p-16 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
              <Check size={48} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Success!
            </h3>
            <p className="text-xl text-green-700 font-semibold">
              Attendance has been recorded
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mark Attendance">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-4 border-blue-200">
          <div className="flex items-center gap-4 mb-8 bg-blue-50 p-5 rounded-xl">
            <div className="p-3 bg-blue-600 rounded-lg">
              <ClipboardCheck size={32} className="text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Record Attendance
            </h3>
          </div>

          {/* Today's Date Display */}
          <div className="mb-8 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Calendar size={32} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold opacity-90">Today's Date</div>
                <div className="text-2xl md:text-3xl font-bold">
                  {getFormattedDate()}
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection - Moved up so it updates the programs list */}
          <div className="mb-8 bg-gray-50 p-6 rounded-xl">
            <div>
              <label htmlFor="date" className="block text-lg font-bold text-gray-700 mb-3">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedProgram(''); // Reset selected program when date changes
                  setAttendance({});
                }}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
              />
            </div>
          </div>

          {programsForSelectedDate.length === 0 && (
            <div className="mb-8 bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-6 text-center">
              <p className="text-xl font-bold text-yellow-900 mb-2">
                No Programs Scheduled for {getDayOfWeek(date)}
              </p>
              <p className="text-base text-yellow-700 font-semibold">
                There are no programs to mark attendance for this date
              </p>
            </div>
          )}

          {/* Program Selection - Programs for Selected Date */}
          {programsForSelectedDate.length > 0 && (
            <div className="mb-8 bg-gray-50 p-6 rounded-xl">
              <div>
                <label htmlFor="program" className="block text-lg font-bold text-gray-700 mb-3">
                  Select Program *
                </label>
                <select
                  id="program"
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setAttendance({});
                  }}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
                >
                  <option value="">Choose a program...</option>
                  {programsForSelectedDate.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} • {program.start_time}-{program.end_time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Attendance List */}
          {selectedProgram && (
            <>
              <div className="mb-6 bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedProgramName}
                </h4>
                <p className="text-lg text-gray-700 font-semibold">
                  {programParticipants.length} Participant{programParticipants.length !== 1 ? 's' : ''}
                </p>
                <p className="text-base text-gray-600 mt-2">
                  ✓ Check the box for each person who attended
                </p>
              </div>

              {programParticipants.length === 0 ? (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-12 text-center">
                  <p className="text-xl text-gray-600 font-semibold">
                    No participants enrolled in this program
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {programParticipants.map((participant) => (
                    <label
                      key={participant.id}
                      className="flex items-center gap-5 p-5 border-4 border-gray-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={attendance[participant.id] || false}
                        onChange={() => handleToggleAttendance(participant.id)}
                        className="w-8 h-8 text-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-xl font-bold text-gray-900">
                          {participant.first_name} {participant.last_name}
                        </div>
                        <div className="text-base text-gray-600 mt-1">
                          {participant.email} • {participant.phone}
                        </div>
                      </div>
                      {attendance[participant.id] && (
                        <div className="px-5 py-2 bg-green-600 text-white text-lg font-bold rounded-full shadow-lg">
                          Present ✓
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Summary */}
              {programParticipants.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-8 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">
                      Attendance Summary:
                    </span>
                    <span className="text-3xl font-bold">
                      {Object.values(attendance).filter(Boolean).length} / {programParticipants.length} Present
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={programParticipants.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 px-6 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Save Attendance
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="sm:w-auto px-8 py-5 border-4 border-gray-400 text-gray-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {!selectedProgram && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-12 text-center">
              <ClipboardCheck size={64} className="text-gray-400 mx-auto mb-6" />
              <p className="text-xl text-gray-600 font-semibold">
                Please select a program above to begin
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}