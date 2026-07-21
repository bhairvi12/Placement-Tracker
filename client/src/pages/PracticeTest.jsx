import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import api from '../lib/api.js';

export const PracticeTest = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores { [questionId]: optionText }
  const [timeTaken, setTimeTaken] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerRef = useRef(null);

  // 1. Fetch practice session
  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/practice/${sessionId}`);
      const data = response.data;
      
      // If session is already completed, redirect to results
      if (data.status === 'COMPLETED') {
        toast.info('This practice session has already been completed.');
        navigate(`/tests/practice/${sessionId}/results`);
        return;
      }

      setSession(data);

      // Load saved answers from localStorage if present
      const saved = localStorage.getItem(`practice_answers_${sessionId}`);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch (e) {
          // Reset if corrupted
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load practice test.');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // 2. Timer counting up
  useEffect(() => {
    if (session && session.status !== 'COMPLETED') {
      timerRef.current = setInterval(() => {
        setTimeTaken((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  // 3. Auto-save answers to localStorage
  const saveAnswers = (newAnswers) => {
    setAnswers(newAnswers);
    localStorage.setItem(`practice_answers_${sessionId}`, JSON.stringify(newAnswers));
  };

  // 4. Select answer handler
  const handleSelectOption = (questionId, option) => {
    const updated = { ...answers, [questionId]: option };
    saveAnswers(updated);
  };

  // 5. Prevent going back during test (warn user)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress on this practice test will be lost.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 6. Submit handler
  const handleSubmitTest = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    
    // Prepare answers payload
    const answersPayload = session.questions.map((q) => ({
      questionId: q.questionId,
      userAnswer: answers[q.questionId] || '',
    }));

    try {
      await api.post(`/practice/${sessionId}/submit`, {
        answers: answersPayload,
        timeTaken,
      });

      // Clear local storage on success
      localStorage.removeItem(`practice_answers_${sessionId}`);
      toast.success('Practice test submitted successfully!');
      
      // Stop beforeunload warning by resetting or just navigating
      navigate(`/tests/practice/${sessionId}/results`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs text-text-secondary">Loading your practice test questions...</p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-text-primary">Evaluating answers using Gemini AI...</h2>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Please do not refresh the page or navigate away. AI is grading your questions and generating customized feedback.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIndex];
  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(answers).length;

  // Format timer
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar Info & Progress */}
      <div className="bg-white border border-border-default rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {session.subject}
            </span>
            <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded-full uppercase ${getDifficultyColor(session.difficulty)}`}>
              {session.difficulty}
            </span>
          </div>

          {/* Timer Display */}
          <div className="flex items-center space-x-1.5 text-sm font-bold text-text-primary bg-muted-bg px-3 py-1 rounded-lg border border-border-default">
            <span>⏱️</span>
            <span>{formatTime(timeTaken)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Progress: Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Question Display Card */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm space-y-6">
        {/* Topic Pill */}
        {currentQuestion.topic && (
          <span className="inline-block px-2.5 py-0.5 bg-muted-bg text-text-secondary text-[10px] font-semibold rounded-full">
            Topic: {currentQuestion.topic}
          </span>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wide">
            Question {currentIndex + 1}
          </h2>
          <p className="text-base font-semibold text-text-primary whitespace-pre-wrap leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        {/* 4 options cards */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((opt, i) => {
            const label = String.fromCharCode(65 + i); // A, B, C, D
            const isSelected = answers[currentQuestion.questionId] === opt;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectOption(currentQuestion.questionId, opt)}
                className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  isSelected
                    ? 'border-primary bg-orange-50/50 ring-1 ring-primary'
                    : 'border-border-default hover:border-gray-300 hover:bg-gray-50/30'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-primary text-white' : 'bg-muted-bg text-text-secondary'
                }`}>
                  {label}
                </span>
                <span className="text-xs text-text-primary font-medium flex-1 pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Question Dots Selector */}
        <div className="flex justify-center items-center space-x-2 border-t border-gray-50 pt-4">
          {session.questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = !!answers[q.questionId];
            return (
              <button
                key={q.questionId}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'ring-2 ring-primary ring-offset-2 bg-primary scale-110'
                    : isAnswered
                    ? 'bg-primary'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title={`Go to Question ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons Row */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center text-xs font-bold text-text-secondary hover:text-text-primary bg-white border border-border-default px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            className="flex items-center text-xs font-bold text-primary hover:text-primary-hover bg-white border border-primary px-5 py-2.5 rounded-lg transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center text-xs font-bold text-white bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Submit Test
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowSubmitModal(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-xs"
          />
          <div className="relative bg-white border border-border-default rounded-xl p-6 shadow-2xl max-w-sm w-full space-y-4 z-10 animate-fadeIn">
            <div className="flex items-center space-x-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-text-primary">Submit Practice Test</h3>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed">
              You have answered <strong className="text-text-primary">{answeredCount} of {totalQuestions}</strong> questions. Are you sure you want to finish and submit for AI evaluation?
            </p>

            <div className="flex space-x-3 border-t border-gray-50 pt-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 text-center text-text-secondary hover:text-text-primary text-xs font-semibold py-2 px-3 border border-border-default rounded-lg transition-colors bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTest}
                className="flex-1 text-center text-white bg-primary hover:bg-primary-hover text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-sm"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeTest;
