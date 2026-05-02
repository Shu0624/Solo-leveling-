import mongoose from 'mongoose';

const programListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  logo: { type: String, default: '🏢' },
  color: { type: String, default: '#6366f1' },
  description: { type: String, required: true },
  deadline: { type: String, default: 'Rolling applications' },
  duration: { type: String, default: '' },
  link: { type: String, default: '' },
  tags: [{ type: String }],
  eligibility: { type: String, default: '' },
  benefits: [{ type: String }],
  category: {
    type: String,
    enum: ['ambassador', 'fellowship', 'open-source', 'internship', 'placement', 'ai-course', 'hackathon', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'upcoming'],
    default: 'active'
  },
  source: {
    type: String,
    enum: ['verified', 'ai-generated'],
    default: 'ai-generated'
  },
  addedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

// Virtual: isNew if added within last 7 days
programListingSchema.virtual('isNew').get(function () {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.addedAt >= sevenDaysAgo;
});

// Virtual: isExpiringSoon if deadline within 14 days
programListingSchema.virtual('isExpiringSoon').get(function () {
  if (!this.expiresAt) return false;
  const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return this.expiresAt <= fourteenDaysFromNow && this.expiresAt > new Date();
});

programListingSchema.set('toJSON', { virtuals: true });
programListingSchema.set('toObject', { virtuals: true });

// Index for fast lookups
programListingSchema.index({ status: 1, addedAt: -1 });
programListingSchema.index({ title: 1, company: 1 }, { unique: true });

export default mongoose.model('ProgramListing', programListingSchema);
