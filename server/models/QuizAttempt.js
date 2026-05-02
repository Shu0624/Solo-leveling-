import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: String,
        isCorrect: Boolean,
        timeTaken: Number // in seconds
      }
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    completedAt: { type: Date },
    violations: [
      {
        type: { type: String, enum: ['tab-switch', 'copy-paste-attempt', 'minimize'] },
        timestamp: Date
      }
    ]
  },
  { timestamps: true }
);

// Performance indexes for dashboard and analytics queries
attemptSchema.index({ user: 1, createdAt: -1 });
attemptSchema.index({ user: 1, percentage: 1 });

export default mongoose.model('QuizAttempt', attemptSchema);
