import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  UploadCloud,
  FileCheck,
  CheckCircle,
  XCircle,
  FileWarning,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api.js';
import SkeletonCard from '../components/SkeletonCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

export const ResumeAnalyzer = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [latestResume, setLatestResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch resume data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, latestRes] = await Promise.all([
        api.get('/resume/history').then(r => r.data).catch(() => []),
        api.get('/resume/latest').then(r => r.data).catch(() => null),
      ]);
      setHistory(historyRes);
      setLatestResume(latestRes);
    } catch (err) {
      toast.error('Failed to load resume details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Drag Over
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Handle Drop File
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // Handle Click Upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // Upload file API post
  const uploadFile = async (file) => {
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF documents are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File size exceeds the 5MB limit.');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.postForm('/resume/upload', formData);
      const result = response.data;
      toast.success('Resume analyzed successfully!');
      
      // Refresh details
      setLatestResume(result);
      // Append to local history list
      setHistory([result, ...history]);
    } catch (error) {
      toast.error(error.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  // SVG Progress Ring Helper
  const ProgressRing = ({ percentage = 0, label }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = (pct) => {
      if (pct >= 70) return '#22C55E'; // green
      if (pct >= 50) return '#EAB308'; // yellow
      return '#EF4444'; // red
    };

    return (
      <div className="bg-white border border-border-default rounded-xl p-4 shadow-sm flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="text-gray-100"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              strokeWidth="6"
              stroke={getColor(percentage)}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-semibold text-text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
        <span className="text-xs font-semibold text-text-secondary mt-2.5">
          {label}
        </span>
      </div>
    );
  };

  // Quality badge calculations
  const getQualityBadge = (score) => {
    if (score < 60) return { label: 'Weak', color: 'bg-red-50 text-danger border-red-200' };
    if (score < 75) return { label: 'Average', color: 'bg-yellow-50 text-warning border-yellow-200' };
    if (score < 90) return { label: 'Strong', color: 'bg-orange-50 text-primary border-orange-200' };
    return { label: 'Excellent', color: 'bg-green-50 text-success border-green-200' };
  };

  // Setup Checklist variables
  const allSections = [
    'education', 'experience', 'skills', 'projects',
    'summary', 'achievements', 'certifications', 'objective'
  ];
  const detected = latestResume?.detectedSections || [];
  const missing = allSections.filter((section) => !detected.includes(section));

  // Recharts Chart Data
  const chartData = history
    .slice()
    .reverse()
    .map((item) => ({
      date: new Date(item.uploadedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      score: item.overallScore,
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          AI Resume Analyzer
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Upload your resume in PDF format to evaluate its formatting, key sections, and ATS alignment.
        </p>
      </div>

      {/* 1. File Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-white border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-primary bg-orange-50/20' : 'border-border-default hover:border-gray-300'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <h3 className="text-sm font-semibold text-text-primary">Analyzing Resume Content...</h3>
            <p className="text-xs text-text-secondary">Parsing PDF text and calculating ATS metrics</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className={`w-12 h-12 mb-3 transition-colors ${dragOver ? 'text-primary' : 'text-text-secondary'}`} />
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Drag and drop your resume here
            </h3>
            <p className="text-xs text-text-secondary mb-3">or click to browse local files</p>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              PDF only, max 5MB
            </span>
          </div>
        )}
      </div>

      {/* No Data / EmptyState State */}
      {!latestResume ? (
        <EmptyState
          icon={FileWarning}
          title="No Resume Uploaded Yet"
          description="Upload your resume to get instant scores and see matched or missing keywords."
          actionLabel="Upload First Resume"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        /* 2. Score Cards and Analytical Panels */
        <div className="space-y-6">
          
          {/* Header overall stats bar */}
          <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-bold text-text-primary">
                {Math.round(latestResume.overallScore)}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Overall ATS Score</h3>
                <span className="text-xs text-text-secondary flex items-center mt-0.5">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Scanned on {new Date(latestResume.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {/* Status Quality badge */}
            <div
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold uppercase ${
                getQualityBadge(latestResume.overallScore).color
              }`}
            >
              {getQualityBadge(latestResume.overallScore).label}
            </div>
          </div>

          {/* Sub-Score progress rings row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <ProgressRing percentage={latestResume.atsScore} label="ATS Parsing" />
            <ProgressRing percentage={latestResume.keywordScore} label="Keyword Match" />
            <ProgressRing percentage={latestResume.formatScore} label="Format Layout" />
            <ProgressRing percentage={latestResume.impactScore} label="Action Verbs" />
          </div>

          {/* Two-Column Section: Checklist vs Keyword Pills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Sections Checklist */}
            <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
              <h2 className="text-sm font-semibold text-text-primary mb-4 border-b border-border-default pb-3">
                Detected vs Missing Sections
              </h2>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Detected checklist */}
                <div className="space-y-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                    Detected ({detected.length})
                  </span>
                  <div className="space-y-2">
                    {detected.map((sec) => (
                      <div key={sec} className="flex items-center text-xs text-text-primary font-medium capitalize">
                        <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                        {sec}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing checklist */}
                <div className="space-y-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                    Missing ({missing.length})
                  </span>
                  <div className="space-y-2">
                    {missing.length === 0 ? (
                      <p className="text-xs text-text-secondary italic">Perfect! No missing sections.</p>
                    ) : (
                      missing.map((sec) => (
                        <div key={sec} className="flex items-center text-xs text-text-primary font-medium capitalize">
                          <XCircle className="w-4 h-4 text-danger mr-2 flex-shrink-0" />
                          {sec}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Matched vs Missing Keywords */}
            <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
              <h2 className="text-sm font-semibold text-text-primary mb-4 border-b border-border-default pb-3 flex items-center justify-between">
                <span>Placement Keywords Matrix</span>
                <Sparkles className="w-4 h-4 text-primary" />
              </h2>

              <div className="space-y-5 flex-1 overflow-y-auto max-h-[220px] pr-2">
                {/* Matched Keywords */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                    Matched ({latestResume.matchedKeywords.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {latestResume.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] font-medium bg-green-50 text-success border border-green-100 py-1 px-2.5 rounded-full capitalize"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                    Missing ({latestResume.missingKeywords.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {latestResume.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] font-medium bg-red-50 text-danger border border-red-100 py-1 px-2.5 rounded-full capitalize"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Recharts Score History Line Chart */}
          {history.length > 1 && (
            <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-text-primary mb-4">ATS Overall Score History</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#F97316"
                      strokeWidth={2.5}
                      dot={{ fill: '#F97316', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
