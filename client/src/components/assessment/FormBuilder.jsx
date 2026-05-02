import { useState } from 'react';
import { Plus, Trash2, GripVertical, CheckSquare, AlignLeft, FileText, ListChecks, Send, Link2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice', icon: ListChecks },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { value: 'short', label: 'Short Answer', icon: AlignLeft },
  { value: 'paragraph', label: 'Paragraph', icon: FileText },
];

const emptyQuestion = () => ({
  type: 'mcq',
  text: '',
  required: false,
  points: 1,
  options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
});

const FormBuilder = ({ onSubmit, onCancel, classroomCode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    // Reset options when switching to non-option types
    if (field === 'type' && !['mcq', 'checkbox'].includes(value)) {
      updated[idx].options = [];
    } else if (field === 'type' && ['mcq', 'checkbox'].includes(value) && (!updated[idx].options || updated[idx].options.length < 2)) {
      updated[idx].options = [{ text: '', isCorrect: false }, { text: '', isCorrect: false }];
    }
    setQuestions(updated);
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options = [...(updated[qIdx].options || []), { text: '', isCorrect: false }];
    setQuestions(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return;
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = { ...updated[qIdx].options[oIdx], [field]: value };
    // For MCQ: only one correct answer
    if (field === 'isCorrect' && value && updated[qIdx].type === 'mcq') {
      updated[qIdx].options = updated[qIdx].options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
    }
    setQuestions(updated);
  };

  const handleSubmit = () => {
    if (!title.trim()) return alert('Please enter a form title');
    const validQs = questions.filter(q => q.text.trim());
    if (validQs.length === 0) return alert('Please add at least one question');

    onSubmit({
      title,
      description,
      classroomCode,
      deadline: deadline || undefined,
      googleFormUrl: googleFormUrl || undefined,
      questions: validQs,
    });
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="glass-morphism rounded-2xl p-6 space-y-4 border-l-4 border-primary">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Untitled Form"
          className="w-full text-2xl font-extrabold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Form description (optional)"
          rows={2}
          className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground resize-none placeholder:text-muted-foreground/40"
        />
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-1"><Link2 size={12} /> Google Form URL (optional)</label>
            <input
              value={googleFormUrl}
              onChange={e => setGoogleFormUrl(e.target.value)}
              placeholder="https://forms.google.com/..."
              className="w-full px-3 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence>
        {questions.map((q, qIdx) => {
          const TypeIcon = QUESTION_TYPES.find(t => t.value === q.type)?.icon || AlignLeft;
          return (
            <motion.div
              key={qIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-morphism rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical size={18} className="opacity-30" />
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">Q{qIdx + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(qIdx, 'type', e.target.value)}
                    className="px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-lg text-xs font-bold text-foreground outline-none"
                  >
                    {QUESTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button onClick={() => removeQuestion(qIdx)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <input
                value={q.text}
                onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                placeholder="Question text..."
                className="w-full px-4 py-3 bg-secondary/20 border border-border/30 rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary/50 transition-colors"
              />

              {/* Options for MCQ / Checkbox */}
              {['mcq', 'checkbox'].includes(q.type) && (
                <div className="space-y-2 pl-2">
                  {(q.options || []).map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateOption(qIdx, oIdx, 'isCorrect', !opt.isCorrect)}
                        className={`w-6 h-6 flex items-center justify-center shrink-0 transition-colors ${
                          q.type === 'mcq' ? 'rounded-full' : 'rounded-md'
                        } border-2 ${
                          opt.isCorrect
                            ? 'border-success bg-success text-white'
                            : 'border-border/50 text-transparent hover:border-primary/50'
                        }`}
                      >
                        ✓
                      </button>
                      <input
                        value={opt.text}
                        onChange={e => updateOption(qIdx, oIdx, 'text', e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1 px-3 py-2 bg-transparent border-b border-border/30 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                      />
                      <button onClick={() => removeOption(qIdx, oIdx)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIdx)} className="text-xs text-primary font-bold hover:underline mt-1">
                    + Add Option
                  </button>
                </div>
              )}

              {/* Bottom controls */}
              <div className="flex items-center justify-between pt-3 border-t border-border/20">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => updateQuestion(qIdx, 'required', e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    Required
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Points:</label>
                    <input
                      type="number"
                      min="0"
                      value={q.points}
                      onChange={e => updateQuestion(qIdx, 'points', Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-secondary/30 border border-border/50 rounded-lg text-xs text-foreground text-center outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add Question */}
      <button
        onClick={addQuestion}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
      >
        <Plus size={18} /> Add Question
      </button>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-secondary/50 text-muted-foreground font-bold text-sm hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Send size={16} /> Publish Form
        </button>
      </div>
    </div>
  );
};

export default FormBuilder;
