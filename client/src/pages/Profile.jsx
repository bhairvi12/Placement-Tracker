import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import {
  User,
  Upload,
  Calendar,
  Lock,
  Plus,
  X,
  LogOut,
  Loader2,
  Trash,
} from 'lucide-react';
import api from '../lib/api.js';

export const Profile = () => {
  const { user, profile, logout, updateProfile, updateLocalProfile } = useAuth();
  const navigate = useNavigate();

  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile Form states
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [college, setCollege] = useState('');

  // Target Companies state
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState('');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fileInputRef = useRef(null);

  // Prepopulate form values on mount / profile load
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setRollNumber(profile.rollNumber || '');
      setBranch(profile.branch || 'CSE');
      setCollege(profile.college || '');
      setTargetCompanies(profile.targetCompanies || []);
    }
  }, [profile]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!fullName || !rollNumber || !college) {
      return toast.error('All details are required.');
    }

    setSavingDetails(true);
    try {
      await updateProfile({
        fullName,
        rollNumber,
        branch,
        college,
        targetCompanies, // preserve current companies list
      });
      toast.success('Profile details saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to update details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // Avatar Photo Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Avatar must be under 2MB.');
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.postForm('/profile/avatar', formData);
      const data = response.data;
      toast.success('Profile avatar updated!');
      // Update local context
      updateLocalProfile({
        ...profile,
        avatarUrl: data.avatarUrl,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Add Company Chip (Auto Saves)
  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.trim()) return;

    const trimmed = newCompany.trim();
    if (targetCompanies.includes(trimmed)) {
      return toast.error('Company is already in your targets.');
    }

    const updatedCompanies = [...targetCompanies, trimmed];
    setTargetCompanies(updatedCompanies);
    setNewCompany('');

    try {
      const response = await api.put('/profile', {
        fullName,
        rollNumber,
        branch,
        college,
        targetCompanies: updatedCompanies,
      });
      const updated = response.data;
      updateLocalProfile(updated);
      toast.success(`Target added: ${trimmed}`);
    } catch (err) {
      toast.error('Failed to auto-save target company.');
    }
  };

  // Remove Company Chip (Auto Saves)
  const handleRemoveCompany = async (company) => {
    const updatedCompanies = targetCompanies.filter((c) => c !== company);
    setTargetCompanies(updatedCompanies);

    try {
      const response = await api.put('/profile', {
        fullName,
        rollNumber,
        branch,
        college,
        targetCompanies: updatedCompanies,
      });
      const updated = response.data;
      updateLocalProfile(updated);
      toast.success(`Target removed: ${company}`);
    } catch (err) {
      toast.error('Failed to auto-save target company.');
    }
  };

  // Mock Password update handler
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return toast.error('All password fields are required.');
    }

    if (newPassword !== confirmNewPassword) {
      return toast.error('New passwords do not match.');
    }

    setUpdatingPassword(true);
    // Simulate API request timeout
    setTimeout(() => {
      setUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated successfully!');
    }, 1000);
  };

  const handleSignOut = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const memberDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : 'October 2024';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          My Account Profile
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your personal details, target recruiter list, and security.
        </p>
      </div>

      {/* 1. Profile Header Card */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
        {/* Avatar Circle Container */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-primary text-white text-3xl font-bold flex items-center justify-center border-2 border-white shadow-md overflow-hidden relative">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(profile?.fullName)
            )}

            {/* Upload Spinner overlay */}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Photo Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 bg-white border border-border-default text-text-primary rounded-full p-2 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <h2 className="text-lg font-semibold text-text-primary mt-4">
          {profile?.fullName || 'Jane Doe'}
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          {profile?.branch || 'CSE'} &bull; {profile?.college || 'SRMIST'}
        </p>
        <span className="text-[10px] text-text-secondary font-medium mt-3 flex items-center bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
          Member since {memberDate}
        </span>
      </div>

      {/* 2. Personal Info Form */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-5 border-b border-border-default pb-3 flex items-center">
          <User className="w-4 h-4 text-primary mr-1.5" /> Academic Information
        </h3>

        <form onSubmit={handleUpdateDetails} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Roll Number
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                College
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingDetails}
              className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-5 rounded-lg transition-colors flex items-center justify-center"
            >
              {savingDetails ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Target Companies Manager */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Target Companies</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Add or remove target companies (updates automatically).
          </p>
        </div>

        {/* Chips wrapper */}
        <div className="flex flex-wrap gap-2 py-1">
          {targetCompanies.length === 0 ? (
            <p className="text-xs text-text-secondary italic">No target companies added yet.</p>
          ) : (
            targetCompanies.map((company) => (
              <span
                key={company}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-primary border border-orange-100"
              >
                {company}
                <button
                  type="button"
                  onClick={() => handleRemoveCompany(company)}
                  className="ml-1.5 hover:opacity-75 focus:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Inline Add Company */}
        <form onSubmit={handleAddCompany} className="flex max-w-sm space-x-2">
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="e.g. Google, Microsoft"
            className="flex-1 px-3 py-1.5 border border-border-default rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </button>
        </form>
      </div>

      {/* 4. Security Change Password */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-5 border-b border-border-default pb-3 flex items-center">
          <Lock className="w-4 h-4 text-primary mr-1.5" /> Update Security Password
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-5 rounded-lg transition-colors flex items-center justify-center"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 5. Danger Zone Card */}
      <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-danger mb-1.5">Danger Zone</h3>
        <p className="text-xs text-text-secondary mb-4">
          Perform administrative sign outs or structural modifications.
        </p>

        <button
          onClick={handleSignOut}
          className="border border-danger text-danger hover:bg-red-50 py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out of PrepTracker
        </button>
      </div>
    </div>
  );
};

export default Profile;
