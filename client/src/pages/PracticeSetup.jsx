import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Brain,
  Code,
  MessageSquare,
  Binary,
  Cpu,
  Loader2,
} from 'lucide-react';
import api from '../lib/api.js';

export const PracticeSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from TestScores dashboard, preselect the subject
  const initialSubject = location.state?.subject || 'DSA';

  const [subject, setSubject] = useState(initialSubject);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const subjects = [
    { id: 'APTITUDE', name: 'Aptitude', icon: Brain, description: 'Logic & Reasoning' },
    { id: 'CODING', name: 'Coding', icon: Code, description: 'Programming Problems' },
    { id: 'VERBAL', name: 'Verbal', icon: MessageSquare, description: 'English & Grammar' },
    { id: 'QUANT', name: 'Quant', icon: Binary, description: 'Quantitative Ability' },
    { id: 'DSA', name: 'DSA', icon: Cpu, description: 'Structures & Algorithms' },
  ];

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const response = await api.post('/practice/start', {
        subject,
        difficulty,
        questionCount,
      });
      toast.success('Practice test generated successfully!');
      navigate(`/tests/practice/${response.data._id}`);
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTime = () => {
    return questionCount === 5 ? '15 minutes' : '30 minutes';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/tests')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-border-default bg-white"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Start Practice Test
          </h1>
          <p className="text-xs text-text-secondary">
            Configure your AI-generated assessment to test your skill level.
          </p>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm space-y-8">
        
        {/* Subject Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text-primary">
            Select Subject
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {subjects.map((subj) => {
              const IconComponent = subj.icon;
              const isSelected = subject === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => setSubject(subj.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center text-center justify-between transition-all min-h-[120px] ${
                    isSelected
                      ? 'border-primary bg-orange-50/50 ring-1 ring-primary'
                      : 'border-border-default hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-text-secondary'}`} />
                  <div className="mt-2">
                    <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                      {subj.name}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{subj.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text-primary">
            Select Difficulty
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDifficulty('EASY')}
              className={`px-6 py-2 rounded-lg text-xs font-semibold border transition-all ${
                difficulty === 'EASY'
                  ? 'bg-success text-white border-success shadow-sm'
                  : 'text-success border-success hover:bg-success/5'
              }`}
            >
              Easy
            </button>
            <button
              type="button"
              onClick={() => setDifficulty('MEDIUM')}
              className={`px-6 py-2 rounded-lg text-xs font-semibold border transition-all ${
                difficulty === 'MEDIUM'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'text-primary border-primary hover:bg-primary/5'
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => setDifficulty('HARD')}
              className={`px-6 py-2 rounded-lg text-xs font-semibold border transition-all ${
                difficulty === 'HARD'
                  ? 'bg-danger text-white border-danger shadow-sm'
                  : 'text-danger border-danger hover:bg-danger/5'
              }`}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Question Count Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text-primary">
            Number of Questions
          </label>
          <div className="flex gap-3">
            {[5, 10].map((count) => {
              const isSelected = questionCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'border-border-default text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {count} Questions
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview & Start Button */}
        <div className="border-t border-border-default pt-6 space-y-4">
          <div className="bg-muted-bg rounded-lg p-4 text-xs text-text-secondary space-y-1">
            <p>
              📋 You will get <strong className="text-text-primary">{questionCount} {difficulty.toLowerCase()} {subject}</strong> questions.
            </p>
            <p>
              ⏱️ Estimated time to complete: <strong className="text-text-primary">{getEstimatedTime()}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartTest}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating AI Test...
              </>
            ) : (
              'Start Test'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PracticeSetup;
