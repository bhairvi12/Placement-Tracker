import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X,
  Gauge,
  Cpu,
} from 'lucide-react';
import api from '../lib/api.js';
import SkeletonCard from '../components/SkeletonCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

export const SkillsMap = () => {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [gapAnalysis, setGapAnalysis] = useState([]);

  // Form states per category
  const [newSkillName, setNewSkillName] = useState({
    LANGUAGE: '',
    FRAMEWORK: '',
    TOOL: '',
    CS_FUNDAMENTAL: '',
  });

  const [newSkillLevel, setNewSkillLevel] = useState({
    LANGUAGE: 'INTERMEDIATE',
    FRAMEWORK: 'INTERMEDIATE',
    TOOL: 'INTERMEDIATE',
    CS_FUNDAMENTAL: 'INTERMEDIATE',
  });

  const [submittingCategory, setSubmittingCategory] = useState({
    LANGUAGE: false,
    FRAMEWORK: false,
    TOOL: false,
    CS_FUNDAMENTAL: false,
  });

  // Fetch initial skills & gap analysis
  const fetchSkillsData = async () => {
    try {
      setLoading(true);
      const [skillsRes, gapRes] = await Promise.all([
        api.get('/skills').then(r => r.data).catch(() => []),
        api.get('/skills/gap-analysis').then(r => r.data).catch(() => []),
      ]);

      setSkills(skillsRes);
      setGapAnalysis(gapRes);
    } catch (err) {
      toast.error('Failed to load skills profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillsData();
  }, []);

  // Delete skill handler
  const handleDeleteSkill = async (id, name) => {
    try {
      await api.delete(`/skills/${id}`);
      toast.success(`Removed skill ${name}`);
      
      // Update local skills state and re-calculate gap analysis
      setSkills(skills.filter((s) => s._id !== id));
      const response = await api.get('/skills/gap-analysis');
      const gapRes = response.data;
      setGapAnalysis(gapRes);
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  // Add skill handler
  const handleAddSkill = async (category) => {
    const name = newSkillName[category];
    const proficiencyLevel = newSkillLevel[category];

    if (!name.trim()) return;

    // Check duplicate
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return toast.error('Skill already exists!');
    }

    setSubmittingCategory({ ...submittingCategory, [category]: true });

    try {
      const response = await api.post('/skills', {
        name: name.trim(),
        category,
        proficiencyLevel,
      });
      const created = response.data;

      toast.success(`Added skill ${created.name}!`);

      // Reset form input
      setNewSkillName({ ...newSkillName, [category]: '' });
      setNewSkillLevel({ ...newSkillLevel, [category]: 'INTERMEDIATE' });

      // Update skills state and re-fetch gap analysis
      setSkills([created, ...skills]);
      const gapResponse = await api.get('/skills/gap-analysis');
      const gapRes = gapResponse.data;
      setGapAnalysis(gapRes);
    } catch (err) {
      toast.error(err.message || 'Failed to add skill');
    } finally {
      setSubmittingCategory({ ...submittingCategory, [category]: false });
    }
  };

  // Calculate percentage of Advanced skills per category
  const getCategoryProgress = (category) => {
    const categorySkills = skills.filter((s) => s.category === category);
    const total = categorySkills.length;
    if (total === 0) return 0;

    const advancedCount = categorySkills.filter(
      (s) => s.proficiencyLevel === 'ADVANCED'
    ).length;
    return Math.round((advancedCount / total) * 100);
  };

  const getPillStyle = (level) => {
    if (level === 'ADVANCED') {
      return 'bg-primary text-white border border-primary';
    }
    if (level === 'INTERMEDIATE') {
      return 'border border-primary text-primary bg-orange-50/20';
    }
    return 'bg-gray-100 text-text-secondary border border-gray-200';
  };

  const getGapBorderColor = (pct) => {
    if (pct >= 70) return 'border-l-success';
    if (pct >= 40) return 'border-l-primary';
    return 'border-l-danger';
  };

  const categories = [
    { key: 'LANGUAGE', label: 'Languages' },
    { key: 'FRAMEWORK', label: 'Frameworks' },
    { key: 'TOOL', label: 'Tools' },
    { key: 'CS_FUNDAMENTAL', label: 'CS Fundamentals' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          My Skills Map
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Catalog your programming competencies and benchmark them against recruiter requirements.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* 1. Category skills grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => {
              const categorySkills = skills.filter((s) => s.category === cat.key);
              const progressVal = getCategoryProgress(cat.key);

              return (
                <div
                  key={cat.key}
                  className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]"
                >
                  {/* Category Header */}
                  <div>
                    <div className="flex items-center justify-between border-b border-border-default pb-3.5 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {cat.label}
                        </span>
                        <span className="bg-orange-50 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                          {categorySkills.length}
                        </span>
                      </div>
                      
                      {/* Advanced progress indicator */}
                      <span className="text-xs text-text-secondary font-medium">
                        Advanced: {progressVal}%
                      </span>
                    </div>

                    {/* Skill Pills List */}
                    <div className="flex flex-wrap gap-2 min-h-[80px]">
                      {categorySkills.length === 0 ? (
                        <p className="text-xs text-text-secondary italic">
                          No {cat.label.toLowerCase()} added yet.
                        </p>
                      ) : (
                        categorySkills.map((skill) => (
                          <span
                            key={skill._id}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPillStyle(
                              skill.proficiencyLevel
                            )}`}
                          >
                            {skill.name}
                            <button
                              onClick={() => handleDeleteSkill(skill._id, skill.name)}
                              className="ml-1.5 hover:opacity-75 focus:outline-none"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Inline Add Skill form at bottom */}
                  <div className="border-t border-gray-50 pt-4 mt-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newSkillName[cat.key]}
                        onChange={(e) =>
                          setNewSkillName({ ...newSkillName, [cat.key]: e.target.value })
                        }
                        placeholder={`Add ${cat.label.toLowerCase().slice(0, -1)}...`}
                        className="flex-1 px-3 py-1.5 border border-border-default rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      />
                      <select
                        value={newSkillLevel[cat.key]}
                        onChange={(e) =>
                          setNewSkillLevel({ ...newSkillLevel, [cat.key]: e.target.value })
                        }
                        className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                      <button
                        onClick={() => handleAddSkill(cat.key)}
                        disabled={submittingCategory[cat.key]}
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-bold p-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Overall category progress stats */}
          <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Advanced Level Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((cat) => {
                const pct = getCategoryProgress(cat.key);
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-text-secondary">
                      <span>{cat.label}</span>
                      <span>{pct}%</span>
                    </div>
                    {/* Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Target Company Skill Gap Analysis */}
          {gapAnalysis.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-text-primary flex items-center">
                <Cpu className="w-4 h-4 text-primary mr-1.5" />
                Target Company Skill Gap Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gapAnalysis.map((item) => (
                  <div
                    key={item.company}
                    className={`bg-white border-y border-r border-l-4 rounded-r-xl rounded-l-md p-6 shadow-sm flex flex-col justify-between min-h-[220px] ${getGapBorderColor(
                      item.matchPercent
                    )}`}
                  >
                    <div>
                      {/* Company Name & Percentage */}
                      <div className="flex justify-between items-start border-b border-border-default pb-3.5 mb-4">
                        <span className="text-sm font-semibold text-text-primary">
                          {item.company}
                        </span>
                        <span
                          className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${
                            item.matchPercent >= 70
                              ? 'bg-green-50 text-success border-green-200'
                              : item.matchPercent >= 40
                              ? 'bg-orange-50 text-primary border-orange-200'
                              : 'bg-red-50 text-danger border-red-200'
                          }`}
                        >
                          {item.matchPercent}% Match
                        </span>
                      </div>

                      {/* Pill grids */}
                      <div className="space-y-3">
                        {/* Matched skills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-success mr-1.5">
                            Matched:
                          </span>
                          {item.matched.length === 0 ? (
                            <span className="text-xs text-text-secondary italic">None</span>
                          ) : (
                            item.matched.map((s) => (
                              <span
                                key={s}
                                className="text-[9px] font-medium bg-green-50 text-success border border-green-100 px-2 py-0.5 rounded-full capitalize"
                              >
                                {s}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Missing skills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-danger mr-1.5">
                            Missing:
                          </span>
                          {item.missing.length === 0 ? (
                            <span className="text-xs text-text-secondary italic">None</span>
                          ) : (
                            item.missing.map((s) => (
                              <span
                                key={s}
                                className="text-[9px] font-medium bg-red-50 text-danger border border-red-100 px-2 py-0.5 rounded-full capitalize"
                              >
                                {s}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SkillsMap;
