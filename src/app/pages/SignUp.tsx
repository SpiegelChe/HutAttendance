import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { UserCircle, Lock, Mail, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import logo from 'figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    message: string;
    color: string;
  }>({ score: 0, message: '', color: '' });
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (!password) {
      setPasswordStrength({ score: 0, message: '', color: '' });
      return;
    }

    // Check length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Check for lowercase and uppercase
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

    // Check for numbers
    if (/\d/.test(password)) score++;

    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let message = '';
    let color = '';

    if (score < 2) {
      message = 'Weak password';
      color = 'text-red-600 bg-red-100';
    } else if (score < 4) {
      message = 'Fair password';
      color = 'text-orange-600 bg-orange-100';
    } else if (score < 5) {
      message = 'Good password';
      color = 'text-blue-600 bg-blue-100';
    } else {
      message = 'Strong password';
      color = 'text-green-600 bg-green-100';
    }

    setPasswordStrength({ score, message, color });
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    checkPasswordStrength(password);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Please use a stronger password with uppercase, lowercase, numbers, and special characters.');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please contact the administrator.');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation redirect
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="The Hut Community Centre Logo" className="h-20 md:h-24 w-auto" />
          </div>
          <div className="bg-green-100 border-2 border-green-400 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-800 mb-3">Registration Successful! 🎉</h2>
            <p className="text-lg text-green-700">
              Your account has been created and is pending approval from an administrator.
            </p>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            You will receive an email once your account is approved.
          </p>
          <p className="text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="The Hut Community Centre Logo" className="h-16 md:h-20 w-auto" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-lg text-gray-600">
            Join The Hut Participation Portal
          </p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl text-base">
              {error}
            </div>
          )}

          {/* Full Name Input */}
          <div>
            <label htmlFor="fullName" className="block text-lg font-semibold text-gray-900 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="text-gray-400" size={20} />
              </div>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-lg font-semibold text-gray-900 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-gray-400" size={20} />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-lg font-semibold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-gray-400" size={20} />
              </div>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                placeholder="Create a password"
                required
                disabled={loading}
              />
            </div>
            {passwordStrength.message && (
              <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-semibold ${passwordStrength.color}`}>
                {passwordStrength.message}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-lg font-semibold text-gray-900 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-gray-400" size={20} />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-base text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:text-blue-700 underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}