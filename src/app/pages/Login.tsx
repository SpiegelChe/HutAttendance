import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Lock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import logo from 'figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png';

// Login page for The Hut Community Centre participation portal.
// On successful login, the router's LoginRoute wrapper detects isAuthenticated
// and navigates to /dashboard — no explicit navigate() call is needed here.
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Detect if we arrived here after a successful password reset.
  const location = useLocation();
  const passwordResetSuccess = (location.state as { passwordReset?: boolean } | null)?.passwordReset === true;

  // Forgot password view state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // AuthContext updates isAuthenticated, which causes LoginRoute to
      // redirect to /dashboard automatically — no explicit navigate needed.
    } else {
      setError(result.error || 'Invalid email or password');
      setLoading(false);
    }
  };

  // Sends a Supabase password-reset email with a redirectTo pointing at the
  // /reset-password page so the user lands on a proper form, not just /login.
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    if (!isSupabaseConfigured) {
      setResetError('Supabase is not configured. Please contact your administrator.');
      setResetLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo,
    });

    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetError('');
    setResetSent(false);
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
            {showForgotPassword ? 'Reset Your Password' : 'Participation Portal Login'}
          </p>
        </div>

        {/* Forgot Password View */}
        {showForgotPassword ? (
          <div>
            {resetSent ? (
              // Success state after email is sent
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="text-green-500" size={64} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
                  <p className="text-lg text-gray-600">
                    A password reset link has been sent to:
                  </p>
                  <p className="text-lg font-semibold text-blue-600 mt-1 break-all">{resetEmail}</p>
                  <p className="text-base text-gray-500 mt-4">
                    Click the link in the email to set a new password. The link expires in 1 hour.
                  </p>
                </div>
                <button
                  onClick={handleBackToLogin}
                  className="w-full py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              // Email entry form
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <p className="text-lg text-gray-600">
                  Enter your email address and we will send you a link to reset your password.
                </p>

                {resetError && (
                  <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl text-lg">
                    {resetError}
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className="block text-xl font-semibold text-gray-900 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-gray-400" size={24} />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter your email"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full py-5 text-xl font-bold text-blue-600 border-2 border-blue-600 rounded-xl shadow-md transition-all hover:scale-105 hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={22} />
                  Back to Login
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success banner shown after arriving from a completed password reset */}
            {passwordResetSuccess && (
              <div className="bg-green-100 border-2 border-green-500 text-green-800 px-6 py-4 rounded-xl text-lg flex items-start gap-3">
                <CheckCircle className="mt-0.5 shrink-0" size={22} />
                <span>Password updated successfully. Please log in with your new password.</span>
              </div>
            )}

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
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="password" className="block text-xl font-semibold text-gray-900">
                  Password
                </label>
                {/* Forgot password link — accessible size for senior users */}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
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
        )}

        {/* Help Text */}
        <p className="text-center text-base text-gray-600 mt-8">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}