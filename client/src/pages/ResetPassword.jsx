import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation errors
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validatePassword = (pass) => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!/[0-9]/.test(pass)) {
      return 'Password must contain at least one number.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    setApiError('');
    setSuccessMsg('');

    // Validation checks
    const passValidation = validatePassword(password);
    if (passValidation) {
      setPasswordError(passValidation);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });

      // Clear any existing JWT tokens in context & localStorage
      logout();

      setSuccessMsg('Password reset successfully! Redirecting to login...');
      toast.success('Password reset successfully!');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      let customError = error.message || 'Reset token is invalid or has expired.';
      if (customError.includes('Reset token is invalid')) {
        customError = 'This reset link is invalid. Please request a new one.';
      } else if (customError.includes('Reset token has expired')) {
        customError = 'This reset link has expired. Please request a new password reset.';
      }
      setApiError(customError);
      toast.error(customError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <div className="w-full max-w-[400px] bg-white border border-border-default rounded-xl shadow-sm p-8 md:p-10 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl mb-2 text-primary border border-orange-100">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Reset your password</h1>
          <p className="text-xs text-text-secondary mt-1">Enter your new password below</p>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-success text-xs font-semibold p-3.5 rounded-lg space-y-1">
            <p>Password reset successfully!</p>
            <p className="text-[10px] font-normal text-green-700">Redirecting to login...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[10px] text-danger font-medium leading-normal">
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmError && (
              <p className="text-[10px] text-danger font-medium leading-normal">
                {confirmError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-danger text-xs font-semibold p-3.5 rounded-lg">
            {apiError}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
