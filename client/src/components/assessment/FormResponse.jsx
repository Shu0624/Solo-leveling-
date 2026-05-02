import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FormResponse = ({ formId, onBack }) => {
  const { api } = useAuth();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await api.get(`/assessment/form/${formId}/detail`);
        setForm(res.data);
        if (res.data.alreadySubmitted) setSubmitted(true);
        // Initialize answers
        setAnswers((res.data.questions || []).map((_, i) => ({
          questionIndex: i,
          selectedOptions: [],
          textAnswer: '',
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [formId, api]);

  const updateAnswer = (qIdx, field, value) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], [field]: value };
      return updated;
    });
  };

  const toggleOption = (qIdx, optIdx, type) => {
    setAnswers(prev => {
      const updated = [...prev];
      const current = updated[qIdx].selectedOptions || [];
      if (type === 'mcq') {
        updated[qIdx] = { ...updated[qIdx], selectedOptions: [optIdx] };
      } else {
        // checkbox: toggle
        if (current.includes(optIdx)) {
          updated[qIdx] = { ...updated[qIdx], selectedOptions: current.filter(i => i !== optIdx) };
        } else {
          updated[qIdx] = { ...updated[qIdx], selectedOptions: [...current, optIdx] };
        }
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/assessment/form/${formId}/respond`, { answers });
      setSubmitted(true);
      setScore(res.data.totalScore);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!form) {
    return <div className="text-center py-12 text-muted-foreground">Form not found.</div>;
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-morphism rounded-3xl p-12 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-success" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Response Submitted!</h2>
        {score != null && (
          <p className="text-lg text-primary font-bold mb-4">Your Score: {score} points</p>
        )}
        <p className="text-muted-foreground mb-6">Thank you for completing this form.</p>
        <button onClick={onBack} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
          Back to Forms
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Form Header */}
      <div className="glass-morphism rounded-2xl p-6 border-l-4 border-primary">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">{form.title}</h2>
        {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
        {form.deadline && (
          <p className="text-xs text-warning font-bold mt-2">
            Deadline: {new Date(form.deadline).toLocaleString()}
          </p>
        )}
        {form.googleFormUrl && (
          <a href={form.googleFormUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-2 hover:underline">
            <ExternalLink size={12} /> Also available as Google Form
          </a>
        )}
      </div>

      {/* Questions */}
      {(form.questions || []).map((q, qIdx) => (
        <motion.div
          key={qIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qIdx * 0.05 }}
          className="glass-morphism rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md mt-1">Q{qIdx + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {q.text}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </p>
              {q.points > 0 && <span className="text-[10px] text-muted-foreground font-bold">{q.points} point{q.points > 1 ? 's' : ''}</span>}
            </div>
          </div>

          {/* MCQ / Checkbox Options */}
          {['mcq', 'checkbox'].includes(q.type) && (
            <div className="space-y-2 pl-8">
              {(q.options || []).map((opt, oIdx) => {
                const isSelected = (answers[qIdx]?.selectedOptions || []).includes(oIdx);
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => toggleOption(qIdx, oIdx, q.type)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border/40 bg-background/50 text-foreground hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                        q.type === 'mcq' ? 'rounded-full' : 'rounded-md'
                      } border-2 ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-border/50'
                      }`}>
                        {isSelected && <span className="text-xs">✓</span>}
                      </div>
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer */}
          {q.type === 'short' && (
            <div className="pl-8">
              <input
                value={answers[qIdx]?.textAnswer || ''}
                onChange={e => updateAnswer(qIdx, 'textAnswer', e.target.value)}
                placeholder="Your answer..."
                className="w-full px-4 py-3 bg-secondary/20 border border-border/30 rounded-xl text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}

          {/* Paragraph */}
          {q.type === 'paragraph' && (
            <div className="pl-8">
              <textarea
                value={answers[qIdx]?.textAnswer || ''}
                onChange={e => updateAnswer(qIdx, 'textAnswer', e.target.value)}
                placeholder="Your detailed answer..."
                rows={4}
                className="w-full px-4 py-3 bg-secondary/20 border border-border/30 rounded-xl text-sm text-foreground outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </div>
          )}
        </motion.div>
      ))}

      {/* Submit */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="px-5 py-3 rounded-xl bg-secondary/50 text-muted-foreground font-bold text-sm">
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Submit Response
        </button>
      </div>
    </div>
  );
};

export default FormResponse;
