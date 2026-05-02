import mongoose from 'mongoose';

const benefitListingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  provider: { type: String, default: '' },
  emoji: { type: String, default: '🎁' },
  description: { type: String, required: true },
  value: { type: String, default: '' },
  link: { type: String, default: '' },
  highlights: [{ type: String }],
  category: {
    type: String,
    enum: ['discounts', 'coding', 'laptops', 'earning', 'email', 'internship', 'ai-courses', 'placement'],
    default: 'discounts'
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

benefitListingSchema.virtual('isNew').get(function () {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.addedAt >= sevenDaysAgo;
});

benefitListingSchema.set('toJSON', { virtuals: true });
benefitListingSchema.set('toObject', { virtuals: true });

benefitListingSchema.index({ status: 1, category: 1, addedAt: -1 });
benefitListingSchema.index({ name: 1, provider: 1 }, { unique: true });

export default mongoose.model('BenefitListing', benefitListingSchema);
