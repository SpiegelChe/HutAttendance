import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserCircle, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout showSidebar={false}>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-xl md:text-2xl text-gray-600">
            What would you like to do today?
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Edit Profile */}
          <button
            onClick={() => navigate('/participant/profile')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <UserCircle size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">My Profile</h3>
            <p className="text-lg md:text-xl text-blue-100">
              View and edit your personal information
            </p>
          </button>

          {/* Register for Events */}
          <button
            onClick={() => navigate('/participant/events')}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-green-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <Calendar size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Register for Events</h3>
            <p className="text-lg md:text-xl text-green-100">
              Browse and sign up for programs and activities
            </p>
          </button>

          {/* Personal Records */}
          <button
            onClick={() => navigate('/participant/records')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-purple-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <FileText size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">My Records</h3>
            <p className="text-lg md:text-xl text-purple-100">
              View your attendance and participation history
            </p>
          </button>
        </div>

        {/* Quick Info Section */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <h4 className="text-lg font-semibold text-gray-600 mb-2">Participant ID</h4>
            <p className="text-3xl font-bold text-gray-900">{user?.id || 'P001'}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <h4 className="text-lg font-semibold text-gray-600 mb-2">Active Programs</h4>
            <p className="text-3xl font-bold text-green-600">3</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <h4 className="text-lg font-semibold text-gray-600 mb-2">Attendance Rate</h4>
            <p className="text-3xl font-bold text-blue-600">95%</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
