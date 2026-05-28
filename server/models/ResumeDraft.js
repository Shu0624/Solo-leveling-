import mongoose from 'mongoose';

const resumeDraftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  summary: { type: String, default: '' },
  skills: {
    languages: { type: [String], default: [] },
    frontend: { type: [String], default: [] },
    backend: { type: [String], default: [] },
    ai: { type: [String], default: [] },
    databases: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    concepts: { type: [String], default: [] },
  },
  experience: [{
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    dateRange: { type: String, default: '' },
    bullets: { type: [String], default: [] },
  }],
  projects: [{
    name: { type: String, default: '' },
    techStack: { type: String, default: '' },
    description: { type: String, default: '' },
    bullets: { type: [String], default: [] },
  }],
  education: [{
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    cgpa: { type: String, default: '' },
    year: { type: String, default: '' },
  }],
  certifications: { type: [String], default: [] },
  achievements: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model('ResumeDraft', resumeDraftSchema);
