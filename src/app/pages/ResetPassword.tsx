import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import logo from "figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png";

// Password reset page — reached when the user clicks the reset link in their email.
// Supabase embeds an access token and type=recovery in the URL hash; the client
// library processes that hash automatically and fires a PASSWORD_RECOVERY auth event,
// which we listen for here before showing the new-password form.
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // sessionReady becomes true once Supabase fires PASSWORD_RECOVERY, meaning
  // the token has been validated and updateUser() can be called.
  const [sessionReady, setSessionReady] = useState(false);
  // linkExpired becomes true at 3 minutes — matches the Supabase OTP expiry configured below.
  const [linkExpired, setLinkExpired] = useState(false);
  // inactiveWarning appears after 30 seconds to remind the user of the 3-minute window.
  const [inactiveWarning, setInactiveWarning] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Some browsers process the hash before this component mounts.
    // Check for an existing session first so we don't miss the event.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setInactiveWarning(false);
      }
    });

    // After 30 seconds with no recovery session, warn the user about inactivity
    // and remind them the link is only valid for 3 minutes.
    const warningTimer = setTimeout(() => {
      setInactiveWarning(true);
    }, 30000);

    // After 3 minutes (180 s) mark the link as expired — this matches the
    // Supabase OTP expiry setting (see configuration note at bottom of this file).
    const expiredTimer = setTimeout(() => {
      setLinkExpired(true);
    }, 180000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(warningTimer);
      clearTimeout(expiredTimer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error: updateError } =
      await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Password update succeeded.
    // Explicitly sign out the recovery session before returning to login.
    const { error: signOutError } = await supabase.auth.signOut(
      {
        scope: "local",
      },
    );

    if (signOutError) {
      console.error(
        "Failed to clear recovery session:",
        signOutError,
      );
      setError(
        "Your password was updated, but we could not complete the logout. Please return to the login page and sign in again.",
      );
      setLoading(false);
      return;
    }

    // Password has been changed and recovery session has been cleared.
    // Stay on this page — the user must click the button to go to login.
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="The Hut Community Centre Logo"
              className="h-20 md:h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            The Hut Participation Portal
          </p>
        </div>

        {/* Success state — user must click the button to return to login */}
        {success ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Password Reset Successful
              </h2>
              <p className="text-lg text-gray-600">
                Your password has been updated. You can now log in
                with your new password.
              </p>
            </div>
            <button
              onClick={() => navigate("/login", { replace: true, state: { passwordReset: true } })}
              className="w-full py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Go to Login
            </button>
          </div>
        ) : linkExpired ? (
          /* Expired / invalid link state */
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle
                className="text-amber-500"
                size={64}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Link Expired or Invalid
              </h2>
              <p className="text-lg text-gray-600">
                This password reset link has expired or already
                been used. Please request a new one.
              </p>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Back to Login
            </button>
          </div>
        ) : !sessionReady ? (
          /* Waiting for Supabase to process the URL hash token */
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-xl text-gray-600">
              Verifying reset link...
            </p>
            <p className="text-base text-gray-500">
              This may take a moment.
            </p>

            {/* Shown after 30 s of no response — reminds user of the 3-minute window */}
            {inactiveWarning && (
              <div className="bg-amber-50 border-2 border-amber-400 text-amber-800 px-6 py-4 rounded-xl text-left mt-4">
                <p className="text-lg font-semibold mb-1">
                  No activity detected
                </p>
                <p className="text-base">
                  The verification is taking longer than
                  expected. Please note that reset links are
                  only valid for <strong>3 minutes</strong>. If
                  the link has expired, please go back and
                  request a new one.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 w-full py-4 text-lg font-bold text-amber-800 border-2 border-amber-400 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        ) : (
          /* New password form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-lg text-gray-600">
              Enter your new password below. It must be at least
              8 characters long.
            </p>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl text-lg">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xl font-semibold text-gray-900 mb-3"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={24} />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={24} />
                  ) : (
                    <Eye size={24} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xl font-semibold text-gray-900 mb-3"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={24} />
                </div>
                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="w-full pl-14 pr-14 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                  placeholder="Re-enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={24} />
                  ) : (
                    <Eye size={24} />
                  )}
                </button>
              </div>
              {/* Inline match indicator */}
              {confirmPassword.length > 0 && (
                <p
                  className={`mt-2 text-base font-medium ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}
                >
                  {password === confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading
                ? "Updating Password..."
                : "Update Password"}
            </button>
          </form>
        )}

        <p className="text-center text-base text-gray-600 mt-8">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}