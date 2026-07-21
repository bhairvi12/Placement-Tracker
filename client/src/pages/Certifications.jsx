import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  Award,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  X,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import api from '../lib/api.js';
import SkeletonCard from '../components/SkeletonCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

export const Certifications = () => {
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null); // null if adding
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('planned');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedDate, setCompletedDate] = useState('');

  // Dropdown states
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Fetch certifications
  const fetchCerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/certifications');
      const data = response.data;
      setCerts(data);
    } catch (err) {
      toast.error('Failed to load certifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  // Handle clicking outside action menu to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAddModal = () => {
    setEditingCert(null);
    setName('');
    setPlatform('');
    setStatus('planned');
    setProgressPercent(0);
    setCompletedDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (cert) => {
    setEditingCert(cert);
    setName(cert.name);
    setPlatform(cert.platform || '');
    setStatus(cert.status);
    setProgressPercent(cert.progressPercent || 0);
    setCompletedDate(
      cert.completedDate
        ? new Date(cert.completedDate).toISOString().split('T')[0]
        : ''
    );
    setIsModalOpen(true);
    setActiveMenuId(null); // close dropdown menu
  };

  // Submit Handler (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !platform) {
      return toast.error('Name and Platform are required.');
    }

    setSubmitting(true);
    const payload = {
      name,
      platform,
      status,
      progressPercent: status === 'in_progress' ? progressPercent : status === 'completed' ? 100 : 0,
      completedDate: status === 'completed' ? completedDate || new Date() : null,
    };

    try {
      if (editingCert) {
        // Edit Cert
        const response = await api.put(`/certifications/${editingCert._id}`, payload);
        const updated = response.data;
        setCerts(certs.map((c) => (c._id === editingCert._id ? updated : c)));
        toast.success('Certification updated!');
      } else {
        // Add new Cert
        const response = await api.post('/certifications', payload);
        const created = response.data;
        setCerts([created, ...certs]);
        toast.success('Certification added!');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return;

    try {
      await api.delete(`/certifications/${id}`);
      setCerts(certs.filter((c) => c._id !== id));
      toast.success('Certification deleted!');
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Filtering data in JS
  const filteredCerts = certs.filter((cert) => {
    if (activeFilter === 'All') return true;
    return cert.status.toLowerCase() === activeFilter.toLowerCase().replace(' ', '_');
  });

  const getStatusBadge = (stat) => {
    if (stat === 'completed') {
      return 'bg-green-50 text-success border-green-200';
    }
    if (stat === 'in_progress') {
      return 'bg-orange-50 text-primary border-orange-200';
    }
    return 'bg-gray-50 text-text-secondary border-gray-200';
  };

  const getStatusLabel = (stat) => {
    if (stat === 'completed') return 'Completed';
    if (stat === 'in_progress') return 'In Progress';
    return 'Planned';
  };

  const filters = ['All', 'Completed', 'In Progress', 'Planned'];

  const recommendedCerts = [
    {
      name: 'AWS Certified Solutions Architect',
      platform: 'Amazon Web Services',
      difficulty: 'Hard',
    },
    {
      name: 'Google Cloud Professional Engineer',
      platform: 'Google Cloud',
      difficulty: 'Hard',
    },
    {
      name: 'Meta Front-End Developer Certificate',
      platform: 'Coursera',
      difficulty: 'Medium',
    },
    {
      name: 'MongoDB Certified Developer Associate',
      platform: 'MongoDB Academy',
      difficulty: 'Medium',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header and Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Certifications Tracker
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your credentials and view professional recommendations.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Certification
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex border-b border-border-default space-x-6">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeFilter === filter
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* 3. Certifications Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredCerts.length === 0 ? (
        <EmptyState
          icon={Award}
          title={`No ${activeFilter !== 'All' ? activeFilter.toLowerCase() + ' ' : ''}certifications added`}
          description="Log certifications to showcase your verified skill credentials to placement cells."
          actionLabel="Log Certification"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCerts.map((cert) => (
            <div
              key={cert._id}
              className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[180px] relative"
            >
              {/* Action Dropdown Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() =>
                    setActiveMenuId(activeMenuId === cert._id ? null : cert._id)
                  }
                  className="p-1 rounded-md text-text-secondary hover:bg-gray-50 focus:outline-none"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {activeMenuId === cert._id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-1 w-28 bg-white border border-border-default rounded-lg shadow-md py-1 z-20"
                  >
                    <button
                      onClick={() => openEditModal(cert)}
                      className="w-full flex items-center px-3 py-1.5 text-xs text-text-primary hover:bg-gray-50 text-left transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2 text-text-secondary" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cert._id)}
                      className="w-full flex items-center px-3 py-1.5 text-xs text-danger hover:bg-red-50 text-left transition-colors font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Top platforms & status line */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {cert.platform || 'Platform'}
                </span>
                <span
                  className={`text-[9px] font-semibold border py-0.5 px-2 rounded-full uppercase ${getStatusBadge(
                    cert.status
                  )}`}
                >
                  {getStatusLabel(cert.status)}
                </span>
              </div>

              {/* Middle core labels */}
              <div className="flex-1 mb-4">
                <h3 className="text-sm font-semibold text-text-primary leading-snug">
                  {cert.name}
                </h3>
              </div>

              {/* Bottom status indicator layout */}
              <div className="border-t border-gray-50 pt-3">
                {cert.status === 'completed' ? (
                  <span className="flex items-center text-xs text-success font-semibold">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Completed on{' '}
                    {cert.completedDate
                      ? new Date(cert.completedDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                ) : cert.status === 'in_progress' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>In Progress</span>
                      <span>{cert.progressPercent || 0}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${cert.progressPercent || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <span className="flex items-center text-xs text-text-secondary font-medium">
                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                    Planned Course
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. recommended Certifications Panel */}
      <div className="border-t border-border-default pt-8">
        <h2 className="text-base font-semibold text-text-primary flex items-center mb-6">
          <BookOpen className="w-4.5 h-4.5 text-primary mr-2" />
          Recommended Core Certifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedCerts.map((rec) => (
            <div
              key={rec.name}
              className="bg-white border border-border-default rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[150px]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {rec.platform}
                  </span>
                  <span
                    className={`text-[9px] font-semibold border py-0.5 px-2 rounded-full uppercase ${
                      rec.difficulty === 'Hard'
                        ? 'bg-red-50 text-danger border-red-200'
                        : 'bg-orange-50 text-primary border-orange-200'
                    }`}
                  >
                    {rec.difficulty}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-text-primary leading-normal">
                  {rec.name}
                </h4>
              </div>

              <button
                type="button"
                onClick={() =>
                  toast.success('Course redirection is disabled in mock.')
                }
                className="mt-4 w-full text-xs font-medium py-1.5 px-2 border border-gray-200 hover:border-primary hover:text-primary rounded-lg text-text-secondary flex items-center justify-center transition-colors"
              >
                <span>View Course</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-border-default rounded-xl shadow-lg w-full max-w-md p-6 relative animate-fadeIn">
            {/* Modal Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-text-primary mb-4">
              {editingCert ? 'Edit Certification' : 'Add Certification'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Certification Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="AWS Solutions Architect..."
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="AWS, Udemy, Coursera..."
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="planned">Planned</option>
                </select>
              </div>

              {/* Progress Slider (Only if In Progress) */}
              {status === 'in_progress' && (
                <div className="space-y-1 animate-fadeIn">
                  <div className="flex justify-between text-xs text-text-secondary font-medium">
                    <span>Progress Percent</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}

              {/* Completed Date Picker (Only if Completed) */}
              {status === 'completed' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-5 rounded-lg transition-colors flex items-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    editingCert ? 'Save Changes' : 'Add Certification'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certifications;
