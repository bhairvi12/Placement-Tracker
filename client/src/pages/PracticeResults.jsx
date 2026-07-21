import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ListTodo,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import api from '../lib/api.js';

export const PracticeResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const fetchSessionResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/practice/${sessionId}`);
      const data = response.data;
      
      if (data.status !== 'COMPLETED') {
        toast.warning('This practice session is not completed yet.');
        navigate(`/tests/practice/${sessionId}`);
        return;
      }

      setSession(data);
      
      // Auto-expand wrong questions for review
      const initialExpanded = {};
      data.questions.forEach((q, idx) => {
        if (!q.isCorrect) {
          initialExpanded[idx] = true;
        }
      });
      setExpandedQuestions(initialExpanded);
    } catch (err) {
      toast.error(err.message || 'Failed to load practice results.');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionResults();
  }, [sessionId]);

  const toggleExpand = (idx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs text-text-secondary">Loading AI evaluation results...</p>
      </div>
    );
  }

  const {
    subject,
    difficulty,
    timeTaken,
    correctAnswers,
    totalQuestions,
    scorePercentage,
    overallFeedback,
    strongTopics = [],
    weakTopics = [],
    recommendations = [],
    questions = [],
  } = session;

  const getScoreColor = (pct) => {
    if (pct >= 70) return { text: 'text-success', bg: 'bg-green-50', border: 'border-green-200', circle: '#22C55E' };
    if (pct >= 50) return { text: 'text-warning', bg: 'bg-yellow-50', border: 'border-yellow-200', circle: '#EAB308' };
    return { text: 'text-danger', bg: 'bg-red-50', border: 'border-red-200', circle: '#EF4444' };
  };

  const colors = getScoreColor(scorePercentage);

  // Format time taken
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  // SVG Circular progress ring
  const CircularScore = ({ correct, total, percent }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative w-36 h-36 flex flex-col items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="text-gray-100"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            strokeWidth="10"
            stroke={colors.circle}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-text-primary leading-none">
            {correct} <span className="text-sm font-semibold text-text-secondary">/ {total}</span>
          </span>
          <span className={`text-sm font-bold mt-1 ${colors.text}`}>
            {Math.round(percent)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/tests')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-border-default bg-white"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
              Test Results
            </h1>
            <p className="text-xs text-text-secondary">
              Review your AI-assessed performance metrics and explanations.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Score Hero Section */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-stretch gap-8">
        
        {/* Left Circle Score */}
        <div className="flex flex-col items-center justify-center bg-gray-50/50 rounded-xl p-6 border border-border-default min-w-[200px]">
          <CircularScore correct={correctAnswers} total={totalQuestions} percent={scorePercentage} />
          
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            <span className="px-2 py-0.5 bg-white border border-border-default text-text-secondary text-[10px] font-bold rounded-full uppercase">
              {subject}
            </span>
            <span className="px-2 py-0.5 bg-white border border-border-default text-text-secondary text-[10px] font-bold rounded-full uppercase">
              {difficulty}
            </span>
            <span className="px-2 py-0.5 bg-white border border-border-default text-text-secondary text-[10px] font-bold rounded-full">
              ⏱️ {formatTime(timeTaken)}
            </span>
          </div>
        </div>

        {/* Right Feedback Column */}
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div>
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Gemini AI Overall Feedback
            </h2>
            <p className="text-sm text-text-primary mt-2 leading-relaxed bg-orange-50/20 border border-orange-100 p-4 rounded-xl">
              {overallFeedback || "Great job completing the practice test! Check your specific question summaries below to identify key topics for review."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Performance Breakdown Section */}
      {(strongTopics.length > 0 || weakTopics.length > 0 || recommendations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topics & Skills map */}
          <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center">
              <BookOpen className="w-4 h-4 text-primary mr-1.5" />
              Topic Strengths & Weaknesses
            </h3>
            
            <div className="space-y-4">
              {/* Strong Topics */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary tracking-wider uppercase">
                  Strong Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {strongTopics.length > 0 ? (
                    strongTopics.map((topic, i) => (
                      <span key={i} className="px-2.5 py-1 bg-green-50 border border-green-200 text-success text-[10px] font-semibold rounded-full uppercase">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-secondary italic">None identified</span>
                  )}
                </div>
              </div>

              {/* Weak Topics */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary tracking-wider uppercase">
                  Topics to Review
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {weakTopics.length > 0 ? (
                    weakTopics.map((topic, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-50 border border-red-200 text-danger text-[10px] font-semibold rounded-full uppercase">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-secondary italic">None identified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center">
              <ListTodo className="w-4 h-4 text-primary mr-1.5" />
              AI Recommendations
            </h3>

            <ul className="text-xs text-text-secondary space-y-2.5 leading-relaxed">
              {recommendations.length > 0 ? (
                recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-primary font-bold mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))
              ) : (
                <li className="italic">Review correct answer explanations below to build foundational understanding.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 3. Question by Question Review */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Question by Question Review
        </h3>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = !!expandedQuestions[idx];
            const cardBorder = q.isCorrect ? 'border-green-200' : 'border-red-200';
            const cardBg = q.isCorrect ? 'bg-white' : 'bg-white';
            
            return (
              <div
                key={q.questionId}
                className={`border rounded-xl shadow-sm overflow-hidden transition-all ${cardBorder} ${cardBg}`}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(idx)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {q.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">
                          Question {idx + 1}
                        </span>
                        {q.topic && (
                          <span className="px-2 py-0.5 bg-muted-bg text-text-secondary text-[8px] font-semibold rounded-full uppercase">
                            {q.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-text-primary mt-1 line-clamp-2 sm:line-clamp-none">
                        {q.question}
                      </p>
                    </div>
                  </div>
                  
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0 mt-1" />
                  )}
                </button>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-50 space-y-4 bg-gray-50/30">
                    {/* Full question text in expanded view */}
                    <div className="text-xs text-text-primary font-medium whitespace-pre-wrap leading-relaxed">
                      {q.question}
                    </div>

                    {/* Answers Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Your Answer */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Your Answer</span>
                        <div className={`p-3 rounded-lg border text-xs font-semibold ${
                          q.isCorrect
                            ? 'bg-green-50/50 border-green-200 text-success'
                            : 'bg-red-50/50 border-red-200 text-danger'
                        }`}>
                          {q.userAnswer ? q.userAnswer : <span className="italic font-normal">Not Answered</span>}
                        </div>
                      </div>

                      {/* Correct Answer */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Correct Answer</span>
                        <div className="p-3 rounded-lg border bg-green-50/50 border-green-200 text-success text-xs font-semibold">
                          {q.correctAnswer}
                        </div>
                      </div>
                    </div>

                    {/* AI Explanation */}
                    {q.aiFeedback && (
                      <div className="space-y-1 bg-white border border-border-default rounded-lg p-4">
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Gemini AI Explanation</span>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          {q.aiFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border-default">
        <button
          onClick={() => navigate('/tests/practice', { state: { subject } })}
          className="flex items-center text-xs font-semibold py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Try Another {subject} Test
        </button>

        <button
          onClick={() => navigate('/tests')}
          className="flex items-center text-xs font-semibold py-2.5 px-4 bg-white border border-border-default text-text-secondary hover:text-text-primary rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>

        <button
          onClick={() => navigate('/tests/history')}
          className="flex items-center text-xs font-semibold py-2.5 px-4 bg-white border border-border-default text-text-secondary hover:text-text-primary rounded-lg transition-colors ml-auto"
        >
          View Practice History
        </button>
      </div>
    </div>
  );
};

export default PracticeResults;
