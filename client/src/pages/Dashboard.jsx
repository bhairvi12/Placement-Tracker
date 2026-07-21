import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Award,
  Calendar,
  Layers,
  FileCheck,
  PlusCircle,
  FileUp,
  Activity,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';

export const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [latestResume, setLatestResume] = useState(null);
  const [tests, setTests] = useState([]);
  const [certs, setCerts] = useState([]);
  const [activities, setActivities] = useState([]);

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [resumeRes, testsRes, certsRes, activityRes] = await Promise.all([
          api.get('/resume/latest').then(r => r.data).catch(() => null),
          api.get('/tests').then(r => r.data).catch(() => []),
          api.get('/certifications').then(r => r.data).catch(() => []),
          api.get('/activity?limit=5').then(r => r.data).catch(() => []),
        ]);

        setLatestResume(resumeRes);
        setTests(testsRes);
        setCerts(certsRes);
        setActivities(activityRes);
      } catch (err) {
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Greeting based on current hours
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Placement season days countdown
  // Seeded Date: 2025-01-15. Let's make it count down to October 15, 2026.
  const targetDate = new Date('2026-10-15');
  const diffTime = targetDate - new Date();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const getCountdownBadgeClass = (days) => {
    if (days < 30) return 'bg-red-50 text-danger border-red-200';
    if (days < 60) return 'bg-orange-50 text-primary border-orange-200';
    return 'bg-green-50 text-success border-green-200';
  };

  // 1. Calculate Average Test Score
  const avgTestScore =
    tests.length > 0
      ? tests.reduce((sum, t) => sum + t.scorePercentage, 0) / tests.length
      : 0;

  // 2. Calculate Completed Certifications
  const completedCerts = certs.filter((c) => c.status === 'completed').length;

  // 3. Calculate Overall Placement Readiness
  // Formula: Resume (33.3%) + Tests (33.3%) + Certs (33.3%, max 5 certs)
  const resumeWeight = (latestResume?.overallScore || 0) * (1 / 3);
  const testWeight = avgTestScore * (1 / 3);
  const certWeight = Math.min(completedCerts * 20, 100) * (1 / 3);

  const readinessPercent = Math.round(
    resumeWeight + testWeight + certWeight
  );

  // Recharts Pie Data
  const readinessData = [
    { name: 'Completed', value: readinessPercent },
    { name: 'Remaining', value: 100 - readinessPercent },
  ];

  // Activities Helper list
  const getActivityMarker = (actionType) => {
    if (actionType.includes('RESUME')) return { color: 'bg-primary', label: 'Resume' };
    if (actionType.includes('CERTIFICATION')) return { color: 'bg-success', label: 'Cert' };
    return { color: 'bg-gray-400', label: 'Activity' };
  };

  // Timeline Step Status Checks
  const steps = [
    { label: 'Profile', isCompleted: profile?.profileComplete === true },
    {
      label: 'Tests',
      isCompleted: tests.some(
        (t) => t.easySolved > 0 || t.mediumSolved > 0 || t.hardSolved > 0
      ),
    },
    { label: 'Resume', isCompleted: latestResume !== null },
    { label: 'Offers', isCompleted: profile?.isPlaced === true },
  ];

  // Helper to determine current index in timeline
  let currentStepIndex = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].isCompleted) {
      currentStepIndex = i + 1;
    } else {
      break;
    }
  }
  // Clamp step index
  if (currentStepIndex >= steps.length) {
    currentStepIndex = steps.length - 1;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-64 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="md:col-span-2 h-64 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner Card */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {getGreeting()}, {profile?.fullName || 'Student'} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Track your performance, practice key concepts, and prepare for placements.
          </p>
        </div>
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full border text-xs font-semibold self-start md:self-auto ${getCountdownBadgeClass(
            daysRemaining
          )}`}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          {daysRemaining} days until placement season
        </div>
      </div>

      {/* 2. Stats Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Resume Score"
          value={latestResume ? `${latestResume.overallScore}/100` : 'No file'}
          subtitle={latestResume ? 'Latest scan score' : 'Upload resume PDF'}
          icon={FileText}
        />
        <StatCard
          title="Avg Test Score"
          value={`${Math.round(avgTestScore)}%`}
          subtitle="Across all practice modules"
          icon={Award}
        />
        <StatCard
          title="Certifications"
          value={`${completedCerts}/${certs.length}`}
          subtitle="Completed credentials"
          icon={FileCheck}
        />
      </div>

      {/* 3. Donut chart + Activities row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Pie Chart */}
        <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col items-center justify-between min-h-[300px]">
          <h2 className="text-sm font-semibold text-text-primary self-start">
            Placement Readiness
          </h2>

          <div className="relative w-full h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={readinessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#F97316" />
                  <Cell fill="#E2E8F0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Centered label percentage */}
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-text-primary">
                {readinessPercent}%
              </span>
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider mt-0.5">
                Ready
              </span>
            </div>
          </div>

          <p className="text-xs text-text-secondary text-center px-4">
            Readiness computes profile stats, certification counts, test performance, and mock scores.
          </p>
        </div>

        {/* Right: Activity Feed */}
        <div className="md:col-span-2 bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-4 border-b border-border-default pb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity Feed</h2>
            <Activity className="w-4 h-4 text-text-secondary" />
          </div>

          <div className="space-y-4 flex-1">
            {activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-sm text-text-secondary italic">No recent activities logged.</p>
              </div>
            ) : (
              activities.slice(0, 5).map((activity) => {
                const marker = getActivityMarker(activity.actionType);
                return (
                  <div
                    key={activity._id}
                    className="flex items-start space-x-3 text-sm"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${marker.color} mt-1.5 flex-shrink-0`}></div>
                    <div className="flex-1">
                      <p className="text-text-primary font-medium">
                        {activity.description}
                      </p>
                      <span className="text-xs text-text-secondary">
                        {new Date(activity.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Placement Timeline */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-6">Placement Pipeline</h2>
        
        {/* Timeline Grid layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between relative gap-6 sm:gap-2">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.label}
                className="flex-1 flex flex-col items-center text-center relative z-10 w-full sm:w-auto"
              >
                {/* Horizontal connection line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden sm:block absolute top-4 left-[55%] right-[-45%] h-0.5 -z-10 ${
                      step.isCompleted ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  ></div>
                )}

                {/* Ring/Filled Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    step.isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isCurrent
                      ? 'bg-white border-primary text-primary shadow-sm'
                      : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  {step.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    idx + 1
                  )}
                </div>

                <span
                  className={`text-xs font-semibold mt-2.5 ${
                    step.isCompleted
                      ? 'text-primary'
                      : isCurrent
                      ? 'text-text-primary'
                      : 'text-text-secondary'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Quick Actions Row */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Quick Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/resume')}
            className="flex items-center justify-center space-x-2 border border-primary text-primary hover:bg-orange-50 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload Resume</span>
          </button>
          <button
            onClick={() => navigate('/tests')}
            className="flex items-center justify-center space-x-2 border border-primary text-primary hover:bg-orange-50 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Practice Tests</span>
          </button>
          <button
            onClick={() => navigate('/certifications')}
            className="flex items-center justify-center space-x-2 border border-primary text-primary hover:bg-orange-50 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Certification</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
