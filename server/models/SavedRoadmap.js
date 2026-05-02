import mongoose from 'mongoose';

const savedRoadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: { type: String, required: true },
    companyType: {
      type: String,
      enum: ['indian-services', 'indian-product', 'faang', 'remote-mnc'],
      default: 'indian-product'
    },
    experienceLevel: { type: String, default: 'Beginner' },
    totalMonths: { type: Number, default: 3 },
    
    // Full AI-generated roadmap data
    phases: [{
      name: String,
      months: String,
      priority: String,
      tasks: [String]
    }],
    weeklyPlan: { type: mongoose.Schema.Types.Mixed, default: {} },
    gapAnalysis: {
      skillsToLearn: [String],
      currentStrengths: [String],
      estimatedReadiness: String
    },
    portfolioProjects: [{
      name: String,
      techStack: String,
      description: String,
      difficulty: String
    }],
    recommendedResources: [{
      name: String,
      type: { type: String },
      description: String
    }],
    interviewFocus: [String],

    // Task completion tracking — stores "phaseIndex-taskIndex" strings
    completedTasks: [String],
    
    // Weekly plan completion — stores day names like "monday", "tuesday"
    completedWeeklyTasks: [String]
  },
  { timestamps: true }
);

// One active roadmap per user (upsert pattern)
savedRoadmapSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('SavedRoadmap', savedRoadmapSchema);
