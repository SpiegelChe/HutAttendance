import { Layout } from '../components/Layout';
import { Calendar, CheckCircle, XCircle, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AttendanceRecord {
  id: string;
  programName: string;
  date: string;
  status: 'present' | 'absent';
}

export default function ParticipantRecords() {
  const { user } = useAuth();

  const attendanceRecords: AttendanceRecord[] = [
    { id: '1', programName: 'Yoga for Beginners', date: '2026-03-10', status: 'present' },
    { id: '2', programName: 'Art Workshop', date: '2026-03-08', status: 'present' },
    { id: '3', programName: 'Yoga for Beginners', date: '2026-03-03', status: 'present' },
    { id: '4', programName: 'Book Club Meeting', date: '2026-02-28', status: 'present' },
    { id: '5', programName: 'Art Workshop', date: '2026-02-22', status: 'absent' },
    { id: '6', programName: 'Yoga for Beginners', date: '2026-02-17', status: 'present' },
    { id: '7', programName: 'Book Club Meeting', date: '2026-02-14', status: 'present' },
    { id: '8', programName: 'Yoga for Beginners', date: '2026-02-10', status: 'present' },
  ];

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);

  const currentPrograms = [
    { name: 'Yoga for Beginners', startDate: '2026-02-01', sessions: 12 },
    { name: 'Art Workshop', startDate: '2026-02-08', sessions: 8 },
    { name: 'Book Club Meeting', startDate: '2026-02-14', sessions: 6 },
  ];

  return (
    <Layout title="My Records">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-semibold">Total Sessions</h3>
            </div>
            <p className="text-5xl font-bold">{attendanceRecords.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold">Sessions Attended</h3>
            </div>
            <p className="text-5xl font-bold">{presentCount}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-semibold">Attendance Rate</h3>
            </div>
            <p className="text-5xl font-bold">{attendanceRate}%</p>
          </div>
        </div>

        {/* Current Programs */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Current Programs</h3>
          <div className="space-y-4">
            {currentPrograms.map((program, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
              >
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{program.name}</h4>
                  <p className="text-base text-gray-600">
                    Started: {new Date(program.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{program.sessions}</p>
                  <p className="text-sm text-gray-600">sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-lg font-bold text-gray-900">Date</th>
                  <th className="text-left py-4 px-4 text-lg font-bold text-gray-900">Program</th>
                  <th className="text-center py-4 px-4 text-lg font-bold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 text-base text-gray-700">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-4 px-4 text-base font-semibold text-gray-900">
                      {record.programName}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {record.status === 'present' ? (
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                          <CheckCircle size={20} />
                          <span className="font-semibold">Present</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full">
                          <XCircle size={20} />
                          <span className="font-semibold">Absent</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/20 p-4 rounded-xl">
              <Award size={48} />
            </div>
            <div>
              <h3 className="text-3xl font-bold">Achievements</h3>
              <p className="text-lg text-white/90">Keep up the great work!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-xl font-bold">🎯 Perfect Attendance</p>
              <p className="text-white/90">Attended 5 sessions in a row</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-xl font-bold">⭐ Active Participant</p>
              <p className="text-white/90">Joined 3 different programs</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
