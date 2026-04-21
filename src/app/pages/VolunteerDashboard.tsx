import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ClipboardCheck, BarChart3, GraduationCap } from 'lucide-react';

export default function VolunteerDashboard() {
  const navigate = useNavigate();

  return (
    <Layout title="Volunteer Dashboard" showSidebar={false}>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Welcome, Volunteer!</h2>
          <p className="text-xl md:text-2xl text-orange-100">
            Thank you for your service. Use the options below to get started.
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10">
          {/* Mark Attendance */}
          <button
            onClick={() => navigate('/attendance')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-orange-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <ClipboardCheck size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Mark Attendance</h3>
            <p className="text-lg md:text-xl text-orange-100">
              Record participant attendance for programs and events
            </p>
          </button>

          {/* View Reports */}
          <button
            onClick={() => navigate('/reports')}
            className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-teal-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <BarChart3 size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">View Reports</h3>
            <p className="text-lg md:text-xl text-teal-100">
              Generate analytics and export data
            </p>
          </button>

          {/* Staff Training */}
          <button
            onClick={() => navigate('/training')}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-indigo-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <GraduationCap size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Staff Training</h3>
            <p className="text-lg md:text-xl text-indigo-100">
              Learn how to use the portal effectively
            </p>
          </button>
        </div>

        {/* Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-4 border-orange-200 dark:border-orange-800 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Volunteer Responsibilities</h3>
          <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold">•</span>
              <span><strong>Mark Attendance:</strong> Record which participants attended programs and activities</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-teal-600 font-bold">•</span>
              <span><strong>View Reports:</strong> Access attendance records and program analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Staff Training:</strong> Review training materials and portal instructions</span>
            </li>
          </ul>
        </div>

        {/* Support Message */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border-2 border-orange-300 dark:border-orange-700">
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
            Need help? Contact a staff member or administrator for assistance.
          </p>
        </div>
      </div>
    </Layout>
  );
}