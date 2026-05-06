import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, UserPlus, UserCheck, Search, BarChart3, GraduationCap, FolderOpen } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user can access a feature based on their role
  const canAccess = (feature: string) => {
    // Everyone can access Mark Attendance and Staff Training
    if (feature === 'attendance' || feature === 'training') {
      return true;
    }
    
    // Manager and Admin can access Register Participant and Add to Program
    if (feature === 'add-participant' || feature === 'add-to-program') {
      return user?.role === 'manager' || user?.role === 'admin';
    }
    
    // Only Admin can access Search, Programs, and Reports
    if (feature === 'search' || feature === 'programs' || feature === 'reports') {
      return user?.role === 'admin';
    }
    
    return false;
  };

  return (
    <Layout showSidebar={false}>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Welcome to The Hut</h2>
          <p className="text-xl md:text-2xl text-gray-600">
            Choose an option below to get started
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Mark Attendance */}
          <button
            onClick={() => navigate('/attendance')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 text-left group"
          >
            <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <ClipboardCheck size={48} className="md:w-14 md:h-14" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Mark Attendance</h3>
            <p className="text-lg md:text-xl text-blue-100">
              Record participant attendance for programs and activities
            </p>
          </button>

          {/* Add New Participant - Manager and Admin Only */}
          {canAccess('add-participant') && (
            <button
              onClick={() => navigate('/add-participant-multistep')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-green-300 hover:scale-105 transition-all duration-300 text-left group"
            >
              <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                <UserPlus size={48} className="md:w-14 md:h-14" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-3">Add New Participant</h3>
              <p className="text-lg md:text-xl text-green-100">
                Register a new participant to the system
              </p>
            </button>
          )}

          {/* Add to Program - Manager and Admin Only */}
          {canAccess('add-to-program') && (
            <button
              onClick={() => navigate('/add-to-program')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-purple-300 hover:scale-105 transition-all duration-300 text-left group"
            >
              <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                <UserCheck size={48} className="md:w-14 md:h-14" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-3">Add to Program</h3>
              <p className="text-lg md:text-xl text-purple-100">
                Enroll existing participants in programs
              </p>
            </button>
          )}

          {/* Search Participant - Admin Only */}
          {canAccess('search') && (
            <button
              onClick={() => navigate('/search')}
              className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-orange-300 hover:scale-105 transition-all duration-300 text-left group"
            >
              <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                <Search size={48} className="md:w-14 md:h-14" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-3">Find Participant</h3>
              <p className="text-lg md:text-xl text-orange-100">
                Search and view participant information
              </p>
            </button>
          )}

          {/* Reports - Admin Only */}
          {canAccess('reports') && (
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
          )}

          {/* Manage Programs - Admin Only */}
          {canAccess('programs') && (
            <button
              onClick={() => navigate('/programs')}
              className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-amber-300 hover:scale-105 transition-all duration-300 text-left group"
            >
              <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                <FolderOpen size={48} className="md:w-14 md:h-14" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-3">Manage Programs</h3>
              <p className="text-lg md:text-xl text-amber-100">
                View, edit, and assign staff to programs
              </p>
            </button>
          )}

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

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform">
            <div className="text-lg font-semibold mb-2">Total Participants</div>
            <div className="text-5xl font-bold">5</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform">
            <div className="text-lg font-semibold mb-2">Active Programs</div>
            <div className="text-5xl font-bold">5</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform">
            <div className="text-lg font-semibold mb-2">Today's Sessions</div>
            <div className="text-5xl font-bold">3</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}