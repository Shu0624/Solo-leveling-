import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroomCode: { type: String, index: true },
    department: { type: String, index: true },
    college: { type: String, index: true },
    category: {
      type: String,
      required: true,
      enum: ['java', 'python', 'dsa', 'ai', 'aptitude', 'interview', 'resume', 'group-discussion', 'quiz', 'module', 'other']
    },
    label: { type: String }, // Custom label e.g. "Java Arrays practice"
    duration: { type: Number, required: true }, // seconds
    date: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['study', 'quiz', 'interview', 'resume-review', 'group-chat'],
      default: 'study'
    }
  },
  { timestamps: true }
);

// Index for fast aggregation queries
activitySchema.index({ user: 1, date: -1 });
activitySchema.index({ user: 1, category: 1 });
activitySchema.index({ classroomCode: 1, date: -1 });
activitySchema.index({ department: 1, date: -1 });

export default mongoose.model('Activity', activitySchema);
