import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },     // null = classroom/dept level
    classroomCode: { type: String },
    scope: {
      type: String,
      enum: ['student', 'classroom', 'department', 'college'],
      default: 'student'
    },
    type: {
      type: String,
      enum: [
        'productivity', 'consistency', 'risk', 'burnout',
        'improvement', 'peak-hours', 'recommendation', 'warning',
        'subject-drop', 'inactivity', 'streak-milestone'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    data: { type: mongoose.Schema.Types.Mixed },                      // supporting metrics
    validUntil: { type: Date },                                       // auto-expire
    dismissed: { type: Boolean, default: false },
    generatedBy: { type: String, default: 'ai-engine' },
  },
  { timestamps: true }
);

// Queries: get insights for a student, classroom, or by type
aiInsightSchema.index({ user: 1, type: 1, createdAt: -1 });
aiInsightSchema.index({ classroomCode: 1, scope: 1, createdAt: -1 });
// TTL: auto-delete expired insights
aiInsightSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AIInsight', aiInsightSchema);
