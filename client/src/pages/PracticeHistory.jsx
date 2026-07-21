import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import api from '../lib/api.js';

export const PracticeHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = [
    { id: 'ALL', label: 'All Subjects' },
    { id: 'APTITUDE', label: 'Aptitude' },
    { id: 'CODING', label: 'Coding' },
    { id: 'VERBAL', label: 'Verbal' },
    { id: 'QUANT', label: 'Quant' },
    { id: 'DSA', label: 'DSA' },
  ];

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/practice/history');
      const data = response.data;
      setHistory(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load practice history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getScoreBadgeStyles = (pct) => {
    if (pct >= 70) return 'text-success bg-green-50 border-green-200';
    if (pct >= 50) return 'text-warning bg-yellow-50 border-yellow-200';
    return 'text-danger bg-red-50 border-red-200';
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return 'text-success bg-green-50 border-green-100';
      case 'HARD':
        return 'text-danger bg-red-50 border-red-100';
      default:
        return 'text-primary bg-orange-50 border-orange-100';
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return mins > 0 ? `${mins}m ${remainingSecs}s` : `${remainingSecs}s`;
  };

  const filteredHistory = activeTab === 'ALL'
    ? history
    : history.filter(item => item.subject === activeTab);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/tests')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-border-default bg-white"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Practice Test History
          </h1>
          <p className="text-xs text-text-secondary">
            Keep track of your AI practice tests, scores, and review logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border-default scrollbar-none gap-2 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 font-semibold text-xs transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-xs text-text-secondary">Loading history logs...</span>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-border-default rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <HelpCircle className="w-10 h-10 text-gray-300 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No Completed Practice Sessions</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xs">
            Start solving AI-generated tests to see your performance log data populate here.
          </p>
          <button
            onClick={() => navigate('/tests/practice')}
            className="mt-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Take a Practice Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-border-default rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Left Column: Metadata */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-text-primary">
                    {item.subject}
                  </span>
                  <span className={`px-2 py-0.5 border text-[9px] font-semibold rounded-full uppercase ${getDifficultyColor(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {formatTime(item.timeTaken || 0)}
                  </span>
                </div>
              </div>

              {/* Right Column: Score & CTA */}
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Score</span>
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-bold mt-1 ${getScoreBadgeStyles(item.scorePercentage)}`}>
                    {item.correctAnswers} / {item.totalQuestions} ({Math.round(item.scorePercentage)}%)
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/tests/practice/${item._id}/results`)}
                  className="flex items-center text-xs font-semibold py-2 px-3 bg-white border border-border-default text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                >
                  View Details
                  <ExternalLink className="w-3 h-3 ml-1.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeHistory;
