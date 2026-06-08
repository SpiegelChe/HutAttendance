// Central routing configuration for the application.
// All pages are protected by default — unauthenticated users are redirected
// to /login before they can access any other route.
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AddParticipant from './pages/AddParticipant';
import AddParticipantMultiStep from './pages/AddParticipantMultiStep';
import SearchParticipant from './pages/SearchParticipant';
import AddToProgram from './pages/AddToProgram';
import ParticipantProfile from './pages/ParticipantProfile';
import EditParticipant from './pages/EditParticipant';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Training from './pages/Training';
import Programs from './pages/Programs';
import Debug from './pages/Debug';

// Root layout that wraps everything with AuthProvider.
// Placing AuthProvider here means every child route can call useAuth()
// regardless of nesting depth.
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Gate component for routes that require a logged-in user.
// Shows a spinner while the auth session is being resolved so the user
// never sees a flash of the login page on a fresh load with a valid session.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated users are sent to login; replace prevents going back to the
  // protected URL with the browser's back button.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Handles the "/" root path — redirects authenticated users to the dashboard
// and unauthenticated users to login.
function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

// Wrapper for the /login route — if the user is already authenticated,
// skip the login page and go straight to the dashboard.
function LoginRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginRoute />,
      },
      {
        path: '/signup',
        element: <SignUp />,
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/volunteer-dashboard',
        element: (
          <ProtectedRoute>
            <VolunteerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/add-participant',
        element: (
          <ProtectedRoute>
            <AddParticipant />
          </ProtectedRoute>
        ),
      },
      {
        path: '/add-participant-multistep',
        element: (
          <ProtectedRoute>
            <AddParticipantMultiStep />
          </ProtectedRoute>
        ),
      },
      {
        path: '/search',
        element: (
          <ProtectedRoute>
            <SearchParticipant />
          </ProtectedRoute>
        ),
      },
      {
        path: '/add-to-program',
        element: (
          <ProtectedRoute>
            <AddToProgram />
          </ProtectedRoute>
        ),
      },
      {
        path: '/participant/:id',
        element: (
          <ProtectedRoute>
            <ParticipantProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/participant/:id/edit',
        element: (
          <ProtectedRoute>
            <EditParticipant />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance',
        element: (
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: '/training',
        element: (
          <ProtectedRoute>
            <Training />
          </ProtectedRoute>
        ),
      },
      {
        path: '/programs',
        element: (
          <ProtectedRoute>
            <Programs />
          </ProtectedRoute>
        ),
      },
      {
        path: '/debug',
        element: (
          <ProtectedRoute>
            <Debug />
          </ProtectedRoute>
        ),
      },
      {
        path: '/',
        element: <RootRedirect />,
      },
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);