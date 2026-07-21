import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, X, Upload, CheckCircle2 } from 'lucide-react';
import api from '../lib/api.js';

export const Onboarding = () => {
  const { profile, updateProfile, updateLocalProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [college, setCollege] = useState('');

  // Form Step 2: Target Companies
  const availableCompanies = [
    'Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys',
    'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Deloitte'
  ];
  const [targetCompanies, setTargetCompanies] = useState([]);

  // Form Step 3: Skills
  const [skills, setSkills] = useState([]); // Array of { name, category, proficiencyLevel }
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('LANGUAGE');
  const [skillLevel, setSkillLevel] = useState('INTERMEDIATE');

  // Form Step 4: Avatar Photo
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Prepopulate values on mount
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setRollNumber(profile.rollNumber || '');
      setBranch(profile.branch || 'CSE');
      setCollege(profile.college || '');
      setTargetCompanies(profile.targetCompanies || []);
    }
  }, [profile]);

  // Step 1 check
  const handleStep1 = (e) => {
    e.preventDefault();
    if (!fullName || !rollNumber || !college) {
      return toast.error('Please fill in all personal info.');
    }
    setStep(2);
  };

  // Step 2 check
  const handleStep2 = () => {
    if (targetCompanies.length === 0) {
      return toast.error('Please select at least 1 target company.');
    }
    setStep(3);
  };

  // Toggle company chip
  const toggleCompany = (company) => {
    if (targetCompanies.includes(company)) {
      setTargetCompanies(targetCompanies.filter((c) => c !== company));
    } else {
      setTargetCompanies([...targetCompanies, company]);
    }
  };

  // Add skill to pending list
  const addSkill = () => {
    if (!skillName.trim()) return;
    // Check for duplicates
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      return toast.error('Skill already added!');
    }
    setSkills([
      ...skills,
      {
        name: skillName.trim(),
        category: skillCategory,
        proficiencyLevel: skillLevel,
      },
    ]);
    setSkillName('');
  };

  // Remove skill from pending list
  const removeSkill = (index) => {
    setSkills(skills.filter((_, idx) => idx !== index));
  };

  // Avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Avatar file size must be under 2MB.');
    }

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      return toast.error('Only JPEG and PNG formats are supported.');
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // On onboarding submit
  const handleCompleteSetup = async () => {
    setSubmitting(true);
    try {
      // 1. Update Profile (includes complete state)
      const updatedProfile = await updateProfile({
        fullName,
        rollNumber,
        branch,
        college,
        targetCompanies,
      });

      // 2. Upload Avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await api.postForm('/profile/avatar', formData);
        
        // Update avatar URL in local Context
        if (avatarRes && avatarRes.avatarUrl) {
          updateLocalProfile({
            ...updatedProfile,
            avatarUrl: avatarRes.avatarUrl,
            profileComplete: true,
          });
        }
      }

      // 3. Seed skills if added
      if (skills.length > 0) {
        for (const skill of skills) {
          await api.post('/skills', skill);
        }
      }

      toast.success('Setup completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Error occurred while saving profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-2xl bg-white border border-border-default rounded-xl shadow-sm p-8 md:p-10">
        
        {/* Step Indicator Header */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-text-secondary font-medium mb-3">
            <span>Step 1: Details</span>
            <span>Step 2: Companies</span>
            <span>Step 3: Skills</span>
            <span>Step 4: Photo</span>
          </div>
          {/* Progress bar line */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          <div className="text-center mt-4">
            <span className="text-sm font-semibold text-primary">Step {step} of 4</span>
          </div>
        </div>

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Personal Details</h2>
              <p className="text-sm text-text-secondary mt-1">Let's verify your academic profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
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
                  College Name
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="SRMIST"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors flex items-center"
              >
                Continue &rarr;
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: TARGET COMPANIES */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Target Companies</h2>
              <p className="text-sm text-text-secondary mt-1">
                Which companies are you targeting? (Select at least 1)
              </p>
            </div>

            {/* Grid of company options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableCompanies.map((company) => {
                const isSelected = targetCompanies.includes(company);
                return (
                  <button
                    key={company}
                    type="button"
                    onClick={() => toggleCompany(company)}
                    className={`py-2.5 px-4 rounded-lg text-sm font-medium border text-center transition-all ${
                      isSelected
                        ? 'bg-orange-50 border-primary text-primary'
                        : 'bg-white border-border-default text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    {company}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-6 border-t border-border-default">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleStep2}
                className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ADD SKILLS */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Add Technical Skills</h2>
              <p className="text-sm text-text-secondary mt-1">
                Add skills to build your gap analysis matrix (optional).
              </p>
            </div>

            {/* Inline Add Skill Block */}
            <div className="bg-gray-50 p-4 border border-border-default rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="React, Java, Python..."
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Level
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addSkill}
                  className="w-full bg-white hover:bg-gray-50 border border-border-default text-text-primary text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1 text-primary" /> Add
                </button>
              </div>
            </div>

            {/* Added Skills List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-text-secondary">Added Skills:</span>
              <div className="flex flex-wrap gap-2">
                {skills.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No skills added yet.</p>
                ) : (
                  skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-primary border border-orange-100"
                    >
                      {skill.name} ({skill.proficiencyLevel.toLowerCase()})
                      <button
                        onClick={() => removeSkill(idx)}
                        className="ml-1.5 text-orange-400 hover:text-primary focus:outline-none"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border-default">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
              >
                &larr; Back
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Continue &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PROFILE PHOTO */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Add a Profile Photo</h2>
              <p className="text-sm text-text-secondary mt-1">
                Upload a professional headshot to complete your setup.
              </p>
            </div>

            {/* Circular dropzone */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="w-36 h-36 rounded-full border-2 border-dashed border-border-default bg-gray-50 flex items-center justify-center overflow-hidden hover:border-primary transition-colors cursor-pointer">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <Upload className="w-7 h-7 text-text-secondary mb-1 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-semibold text-text-secondary group-hover:text-primary transition-colors">
                        Upload
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {avatarPreview && (
                  <button
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-text-secondary mt-3">
                Supported formats: JPEG, PNG. Max 2MB.
              </span>
            </div>

            <div className="flex justify-between pt-6 border-t border-border-default">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
              >
                &larr; Back
              </button>
              <div className="space-x-3 flex items-center">
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={submitting}
                  className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors flex items-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
