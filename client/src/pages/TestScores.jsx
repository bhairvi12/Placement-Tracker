import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Layers,
  CheckCircle,
  PlusCircle,
  TrendingUp,
  BrainCircuit,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api.js';
import SkeletonCard from '../components/SkeletonCard.jsx';

export const TestScores = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [benchmark, setBenchmark] = useState({ classAverage: [], topTen: [] });
  
  // History tracking state
  const [selectedHistorySubject, setSelectedHistorySubject] = useState('DSA');
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch initial scores & benchmarks
  const fetchData = async () => {
    try {
      setLoading(true);
      const [scoresRes, benchmarkRes] = await Promise.all([
        api.get('/tests').then(r => r.data).catch(() => []),
        api.get('/tests/benchmark').then(r => r.data).catch(() => ({ classAverage: [], topTen: [] })),
      ]);

      setScores(scoresRes);
      setBenchmark(benchmarkRes);
    } catch (err) {
      toast.error('Failed to load practice test details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific subject history for line chart
  const fetchSubjectHistory = async (subj) => {
    setLoadingHistory(true);
    try {
      const response = await api.get(`/practice/history/${subj}`);
      const historyRes = response.data;
      // Map dates cleanly for Recharts
      const formattedHistory = historyRes.map((item) => ({
        date: new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        score: item.scorePercentage,
      }));
      setHistoryData(formattedHistory);
    } catch (err) {
      // Quiet swallow or show minimal error
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch history whenever dropdown selection changes
  useEffect(() => {
    if (selectedHistorySubject) {
      fetchSubjectHistory(selectedHistorySubject);
    }
  }, [selectedHistorySubject]);

  // Navigate to Practice Setup
  const handlePracticeRedirect = (subject) => {
    navigate('/tests/practice', { state: { subject } });
  };

  // SVG circular progress ring
  const CircularProgress = ({ percentage = 0 }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            className="text-gray-100"
            strokeWidth="5"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            strokeWidth="5"
            stroke="#F97316"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-bold text-text-primary">
          {Math.round(percentage)}%
        </span>
      </div>
    );
  };

  // 1. Radar Chart Data Setup
  const radarData = scores.map((s) => ({
    subject: s.subject,
    score: s.scorePercentage,
  }));

  // 2. Grouped Benchmark Bar Chart Data Setup
  const barChartData = ['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'].map((subject) => {
    const myScore = scores.find((s) => s.subject === subject)?.scorePercentage || 0;
    const classAvg =
      benchmark.classAverage?.find((b) => b.subject === subject)?.averageScore || 0;
    const topAvg = benchmark.topTen?.find((b) => b.subject === subject)?.averageScore || 0;

    return {
      subject,
      You: Math.round(myScore),
      'Class Average': Math.round(classAvg),
      'Top 10%': Math.round(topAvg),
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Practice Test Scores
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Solve curriculum modules to sharpen your Aptitude, Coding, and DSA skills.
        </p>
      </div>

      {/* 1. Subject Cards Row (5 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {scores.map((score) => (
          <div
            key={score.subject}
            className="bg-white border border-border-default rounded-xl p-5 shadow-sm flex flex-col justify-between items-center text-center min-h-[250px]"
          >
            {/* Subject Label */}
            <span className="text-sm font-semibold text-text-primary tracking-tight">
              {score.subject}
            </span>

            {/* SVG Progress Ring */}
            <div className="my-3">
              <CircularProgress percentage={score.scorePercentage} />
            </div>

            {/* Difficulty solved metrics */}
            <div className="w-full text-xs space-y-1 text-left border-t border-gray-50 pt-2.5 mb-3 flex flex-col items-center">
              <div className="flex justify-between w-2/3">
                <span className="text-text-secondary">Easy</span>
                <span className="text-success font-semibold">{score.easySolved}</span>
              </div>
              <div className="flex justify-between w-2/3">
                <span className="text-text-secondary">Medium</span>
                <span className="text-primary font-semibold">{score.mediumSolved}</span>
              </div>
              <div className="flex justify-between w-2/3">
                <span className="text-text-secondary">Hard</span>
                <span className="text-danger font-semibold">{score.hardSolved}</span>
              </div>
            </div>

            {/* Practice CTA button */}
            <button
              onClick={() => handlePracticeRedirect(score.subject)}
              className="w-full text-xs font-semibold py-1.5 px-3 border border-primary text-primary hover:bg-orange-50 rounded-lg transition-colors flex items-center justify-center"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Start Practice Test
            </button>
          </div>
        ))}
      </div>

      {/* 2. Visual Charts Section: Radar and Benchmark Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Radar Chart */}
        <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col items-center justify-between min-h-[340px]">
          <h2 className="text-sm font-semibold text-text-primary self-start mb-4">
            Aptitude & Skill Shapes Matrix
          </h2>

          <div className="w-full h-64 flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#F1F5F9" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#64748B', fontSize: 9 }}
                  />
                  <Radar
                    name="Student Profile"
                    dataKey="score"
                    stroke="#F97316"
                    fill="#F97316"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-text-secondary italic">No score data to populate radar map.</p>
            )}
          </div>
        </div>

        {/* Right: Bar Chart Benchmarks */}
        <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[340px]">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            College Benchmark Comparisons
          </h2>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="subject"
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
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="You" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Class Average" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Top 10%" fill="#FED7AA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Performance Timeline History (Dropdown select + Line Chart) */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-border-default pb-3.5">
          <h2 className="text-sm font-semibold text-text-primary flex items-center">
            <TrendingUp className="w-4 h-4 text-primary mr-1.5" />
            Performance Progress over Time
          </h2>
          {/* Subject Dropdown */}
          <select
            value={selectedHistorySubject}
            onChange={(e) => setSelectedHistorySubject(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white cursor-pointer"
          >
            <option value="DSA">DSA</option>
            <option value="CODING">CODING</option>
            <option value="APTITUDE">APTITUDE</option>
            <option value="VERBAL">VERBAL</option>
            <option value="QUANT">QUANT</option>
          </select>
        </div>

        {/* History Line chart area */}
        <div className="w-full h-64 relative flex items-center justify-center">
          {loadingHistory ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-xs text-text-secondary">Loading history...</span>
            </div>
          ) : historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <HelpCircle className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-text-secondary italic">
                Solve practice tests to view progress snapshots for {selectedHistorySubject}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestScores;
