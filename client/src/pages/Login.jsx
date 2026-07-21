import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import api from '../lib/api.js';

export const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Navigation states: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  // Role selection: 'student' | 'admin'
  const [activeTab, setActiveTab] = useState('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [hasError, setHasError] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [college, setCollege] = useState('');

  const triggerError = (msg) => {
    setError(msg);
    setHasError(true);
    // Remove shake animation class after 500ms
    setTimeout(() => setHasError(false), 500);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return triggerError('Email and Password are required.');
    }

    setLoading(true);
    setError('');

    try {
      const { profile } = await login(email, password, activeTab);
      toast.success('Logged in successfully!');
      
      // Admin bypasses student onboarding
      const isComplete = profile ? (profile.data ? profile.data.profileComplete : profile.profileComplete) : false;
      if (activeTab === 'admin') {
        navigate('/admin');
      } else if (!profile || isComplete === false) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      triggerError(err.message || 'Login failed. Please verify credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !rollNumber || !email || !password || !confirmPassword || !college) {
      return triggerError('All fields are required.');
    }

    if (password !== confirmPassword) {
      return triggerError('Passwords do not match.');
    }

    setLoading(true);

    try {
      await register({
        email,
        password,
        fullName,
        rollNumber,
        branch,
        college,
      });
      toast.success('Account created successfully!');
      // Navigate to onboarding for setup
      navigate('/onboarding');
    } catch (err) {
      triggerError(err.message || 'Registration failed.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return triggerError('Email is required.');
    }

    setLoading(true);
    setError('');
    setForgotSuccess(false);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email sent!');
      setForgotSuccess(true);
    } catch (err) {
      triggerError(err.message || 'Could not initiate password reset.');
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (newMode) => {
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setRollNumber('');
    setCollege('');
    setForgotSuccess(false);
    setMode(newMode);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4 py-12"
      style={{
        backgroundImage: 'radial-gradient(#E2E8F0 1.2px, transparent 1.2px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div
        className={`w-full max-w-[440px] bg-white border border-border-default rounded-xl shadow-sm p-8 md:p-10 ${
          hasError ? 'animate-shake' : ''
        }`}
      >
        {/* Top Header Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl mb-2">
            🎯
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">PrepTracker</h1>
          <p className="text-sm text-text-secondary mt-1">Track your placement journey</p>
        </div>

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotSubmit} className="space-y-5 animate-fadeIn">
            <button
              type="button"
              onClick={() => toggleMode('login')}
              className="flex items-center text-xs text-text-secondary hover:text-text-primary transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </button>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Reset Password</h2>
              <p className="text-xs text-text-secondary mt-1">
                Enter your registered email and we will send a password reset link.
              </p>
            </div>
            
            {forgotSuccess ? (
              <div className="bg-green-50 border border-green-200 text-success text-xs font-semibold p-4 rounded-lg space-y-1">
                <p>Reset link sent! Check your email.</p>
                <p className="text-[10px] font-normal text-green-700">The link expires in 15 minutes.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="name@college.edu"
                      required
                    />
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                  </div>
                </div>

                {error && <p className="text-xs text-danger font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Send Reset Link
                </button>
              </>
            )}
          </form>
        ) : (
          /* LOGIN OR REGISTER TABS */
          <>
            {/* User Role Selection Tabs (Only visible when logging in) */}
            {mode === 'login' && (
              <div className="flex border-b border-border-default mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('student');
                    setError('');
                  }}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-colors text-center border-b-2 ${
                    activeTab === 'student'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setError('');
                  }}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-colors text-center border-b-2 ${
                    activeTab === 'admin'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Administrator
                </button>
              </div>
            )}

            {/* STUDENT REGISTER FORM */}
            {mode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="RA201100..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      College
                    </label>
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="SRMIST"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="riya@preptracker.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-danger font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </button>

                <p className="text-xs text-center text-text-secondary mt-3">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('login')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            ) : (
              /* LOGIN FORM (STUDENT OR ADMIN) */
              <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder={
                        activeTab === 'admin'
                          ? 'admin@preptracker.com'
                          : 'riya@preptracker.com'
                      }
                      required
                    />
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-text-secondary">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleMode('forgot')}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-danger font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {activeTab === 'admin' ? 'Sign In as Admin' : 'Sign In'}
                </button>

                {activeTab === 'student' && (
                  <p className="text-xs text-center text-text-secondary mt-3">
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => toggleMode('register')}
                      className="text-primary font-semibold hover:underline"
                    >
                      Create account
                    </button>
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
