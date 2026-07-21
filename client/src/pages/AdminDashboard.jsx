import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users,
  Award,
  Shield,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Calendar,
  Building2,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedCount: 0,
    placedPercentage: 0,
    averageReadiness: 0,
    branchAverages: {},
    totalCompaniesVisited: 0,
    placementSeasonDate: '2026',
  });
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Student Table Management States
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Query Filters
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [sort, setSort] = useState('readiness');
  const [order, setOrder] = useState('desc');

  // Placement season setting form
  const [seasonDate, setSeasonDate] = useState('');
  const [savingSeason, setSavingSeason] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch stats and leaderboard
  const fetchDashboardStats = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        api.get('/admin/stats').then(r => r.data),
        api.get('/admin/leaderboard').then(r => r.data),
      ]);
      setStats(statsRes);
      setSeasonDate(statsRes.placementSeasonDate || '');
      setLeaderboard(leaderboardRes);
    } catch (err) {
      toast.error('Failed to load admin stats summaries.');
    }
  };

  // Fetch paginated & filtered students list
  const fetchStudentsList = async (page = 1) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort,
        order,
      });
      if (search) queryParams.append('search', search);
      if (branch) queryParams.append('branch', branch);

      const response = await api.get(`/admin/students?${queryParams.toString()}`);
      const res = response.data;
      setStudents(res.students);
      setTotalCount(res.totalCount);
      setCurrentPage(res.currentPage);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error('Failed to fetch students list.');
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardStats(), fetchStudentsList(1)]);
      setLoading(false);
    };
    init();
  }, []);

  // Fetch whenever filters change
  useEffect(() => {
    if (!loading) {
      fetchStudentsList(1);
    }
  }, [search, branch, sort, order]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchStudentsList(newPage);
    }
  };

  // Toggle placement status
  const handleTogglePlacement = async (profileId, currentPlaced) => {
    let placedCompany = null;

    if (!currentPlaced) {
      const company = prompt('Enter the placed company name:');
      if (company === null) return; // user cancelled prompt
      if (!company.trim()) {
        return toast.error('Placed company name is required.');
      }
      placedCompany = company.trim();
    }

    setTogglingId(profileId);
    try {
      const response = await api.put(`/admin/students/${profileId}/placement`, {
        isPlaced: !currentPlaced,
        placedCompany,
      });
      const updatedProfile = response.data;

      toast.success(
        `Placement status updated for ${updatedProfile.fullName}!`
      );

      // Re-fetch everything to keep metrics in sync
      await Promise.all([fetchDashboardStats(), fetchStudentsList(currentPage)]);
    } catch (err) {
      toast.error(err.message || 'Failed to update placement.');
    } finally {
      setTogglingId(null);
    }
  };

  // Save season date setting
  const handleSaveSeason = async (e) => {
    e.preventDefault();
    if (!seasonDate.trim()) return;

    setSavingSeason(true);
    try {
      const response = await api.put('/admin/settings', {
        placementSeasonDate: seasonDate.trim(),
      });
      const updated = response.data;
      setStats({ ...stats, placementSeasonDate: updated.placementSeasonDate });
      toast.success('Placement season start date saved!');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSavingSeason(false);
    }
  };

  // Protected download of CSV
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      
      const response = await fetch(`${apiUrl}/admin/export/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Network response not ok.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_readiness_report_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV report.');
    }
  };

  // Recharts Horizontal Bar chart data for branch averages
  const branchChartData = Object.keys(stats.branchAverages).map((branchKey) => ({
    branch: branchKey,
    Readiness: stats.branchAverages[branchKey],
  }));

  const getRankBadge = (rank) => {
    if (rank === 1) return '🏆 Gold';
    if (rank === 2) return '🥈 Silver';
    if (rank === 3) return '🥉 Bronze';
    return `#${rank}`;
  };

  // SVG ring gauge for readiness score
  const CircularProgress = ({ percentage = 0 }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            className="text-gray-100"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            strokeWidth="3.5"
            stroke="#F97316"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[9px] font-bold text-text-primary">
          {Math.round(percentage)}%
        </span>
      </div>
    );
  };

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
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight flex items-center">
            <Shield className="w-6 h-6 text-primary mr-2" /> Placement Officer Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Analyze campus metrics, export student readiness profiles, and edit settings.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center self-start sm:self-auto"
        >
          <Download className="w-4 h-4 mr-1.5" /> Export CSV Report
        </button>
      </div>

      {/* 1. Stats KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Registered"
          value={stats.totalStudents}
          subtitle="Enrolled students"
          icon={Users}
        />
        <StatCard
          title="Placed Students"
          value={`${stats.placedCount} / ${stats.totalStudents}`}
          subtitle={`${Math.round(stats.placedPercentage)}% success rate`}
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Readiness"
          value={`${Math.round(stats.averageReadiness)}%`}
          subtitle="Cumulative score shape"
          icon={Award}
        />
        <StatCard
          title="Companies Visited"
          value={stats.totalCompaniesVisited}
          subtitle="Recruiting logs"
          icon={Building2}
        />
      </div>

      {/* 2. Top Performers Carousel */}
      {leaderboard.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Top 5 Campus Performers</h2>
          {/* Horizontal scroll grid */}
          <div className="flex space-x-6 overflow-x-auto pb-4 pt-1">
            {leaderboard.slice(0, 5).map((student) => (
              <div
                key={student.rank}
                className="bg-white border border-border-default rounded-xl p-5 shadow-sm min-w-[220px] flex flex-col justify-between items-center text-center flex-shrink-0"
              >
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {getRankBadge(student.rank)}
                </span>
                
                <h4 className="text-sm font-semibold text-text-primary mt-2">
                  {student.name}
                </h4>
                <span className="text-[10px] text-text-secondary mt-0.5">{student.branch}</span>

                <div className="my-3">
                  <CircularProgress percentage={student.readiness} />
                </div>

                <span
                  className={`text-[9px] font-bold border py-0.5 px-2 rounded-full uppercase ${
                    student.isPlaced
                      ? 'bg-green-50 text-success border-green-200'
                      : 'bg-gray-50 text-text-secondary border-gray-200'
                  }`}
                >
                  {student.isPlaced ? 'Placed' : 'Seeking'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Department averages horizontal bar chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Departmental Average Placement Readiness %
          </h2>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={branchChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="branch"
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
                <Bar dataKey="Readiness" fill="#F97316" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Placement season Settings card */}
        <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center mb-1">
              <Calendar className="w-4.5 h-4.5 text-primary mr-1.5" /> Placement Season
            </h3>
            <p className="text-xs text-text-secondary">
              Update the current recruitment season start date or year.
            </p>
          </div>

          <form onSubmit={handleSaveSeason} className="space-y-4 my-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Season Label / Target Date
              </label>
              <input
                type="text"
                value={seasonDate}
                onChange={(e) => setSeasonDate(e.target.value)}
                placeholder="e.g. 2026-10-15"
                className="w-full px-3.5 py-2 border border-border-default rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={savingSeason}
              className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {savingSeason ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                'Save Season settings'
              )}
            </button>
          </form>

          <p className="text-[10px] text-text-secondary italic">
            This setting controls the days remaining countdown banner displayed on student dashboards.
          </p>
        </div>
      </div>

      {/* 4. Campus Students Leaderboard Table */}
      <div className="bg-white border border-border-default rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-text-primary">Campus Candidates Ledger</h2>
          
          {/* Query Filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name..."
                className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-secondary" />
            </div>

            {/* Branch Filter */}
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="border border-border-default py-1.5 px-3 rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-');
                setSort(s);
                setOrder(o);
              }}
              className="border border-border-default py-1.5 px-3 rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="readiness-desc">Readiness (High)</option>
              <option value="readiness-asc">Readiness (Low)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={FileSpreadsheet}
              title="No Candidates Found"
              description="Verify your search string or select a different department branch filter."
            />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-border-default text-text-secondary font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Rank</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Roll No</th>
                  <th className="py-3 px-6">Branch</th>
                  <th className="py-3 px-6">Resume Score</th>
                  <th className="py-3 px-6">Avg Test</th>
                  <th className="py-3 px-6">Certs</th>
                  <th className="py-3 px-6">Readiness</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student, idx) => {
                  const rank = (currentPage - 1) * 10 + idx + 1;
                  return (
                    <tr
                      key={student.profile._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-6 font-semibold text-text-secondary">
                        {rank}
                      </td>
                      <td className="py-3 px-6 font-semibold text-text-primary whitespace-nowrap">
                        {student.profile.fullName}
                      </td>
                      <td className="py-3 px-6 text-text-secondary font-medium whitespace-nowrap">
                        {student.profile.rollNumber}
                      </td>
                      <td className="py-3 px-6 text-text-secondary font-medium">
                        {student.profile.branch}
                      </td>
                      <td className="py-3 px-6 font-semibold text-text-primary">
                        {student.stats.resumeScore}/100
                      </td>
                      <td className="py-3 px-6 font-semibold text-text-primary">
                        {Math.round(student.stats.avgTest)}%
                      </td>
                      <td className="py-3 px-6 text-text-secondary font-semibold">
                        {student.stats.certCount}
                      </td>
                      <td className="py-3 px-6">
                        <span className="font-bold text-primary">
                          {Math.round(student.stats.readiness)}%
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2.5 py-0.5 border text-[10px] font-semibold rounded-full uppercase whitespace-nowrap ${
                            student.profile.isPlaced
                              ? 'bg-green-50 text-success border-green-200'
                              : 'bg-gray-50 text-text-secondary border-gray-200'
                          }`}
                        >
                          {student.profile.isPlaced
                            ? `Placed at ${student.profile.placedCompany}`
                            : 'Seeking'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() =>
                            handleTogglePlacement(
                              student.profile._id,
                              student.profile.isPlaced
                            )
                          }
                          disabled={togglingId === student.profile._id}
                          className="text-text-secondary hover:text-primary transition-colors focus:outline-none disabled:opacity-50"
                        >
                          {togglingId === student.profile._id ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                          ) : student.profile.isPlaced ? (
                            <ToggleRight className="w-6 h-6 text-success mx-auto" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-text-secondary mx-auto" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border-default flex items-center justify-between text-xs bg-gray-50">
            <span className="text-text-secondary font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
              {totalCount} students total)
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="py-1 px-3 border border-border-default rounded-md bg-white hover:bg-gray-50 font-semibold disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="py-1 px-3 border border-border-default rounded-md bg-white hover:bg-gray-50 font-semibold disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
