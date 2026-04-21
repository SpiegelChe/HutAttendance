import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Lock } from 'lucide-react';
import logo from 'figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Navigation will be handled by the auth context and routing
      // The user object will be available and routes will redirect accordingly
    } else {
      setError(result.error || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="The Hut Community Centre Logo" className="h-20 md:h-24 w-auto" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome to The Hut
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            Participation Portal Login
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl text-lg">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-xl font-semibold text-gray-900 mb-3">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserCircle className="text-gray-400" size={24} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xl font-semibold text-gray-900 mb-3">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-gray-400" size={24} />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Sign Up Button */}
          <Link
            to="/signup"
            className="block w-full py-5 text-xl font-bold text-center text-blue-600 border-2 border-blue-600 rounded-xl shadow-md transition-all hover:scale-105 hover:bg-blue-50"
          >
            Sign Up
          </Link>
        </form>

        {/* Help Text */}
        <p className="text-center text-base text-gray-600 mt-8">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}