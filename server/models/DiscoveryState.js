import mongoose from 'mongoose';

// Single document tracking the web-discovery run, so a cooldown holds across
// serverless instances and the UI can say when listings were last refreshed.
const discoveryStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'discovery' },
  lastRunAt: { type: Date, default: null },        // when the last web search was claimed
  lastCompletedAt: { type: Date, default: null },  // when it finished
  lastResult: { type: Object, default: null },
}, { versionKey: false });

export default mongoose.models.DiscoveryState || mongoose.model('DiscoveryState', discoveryStateSchema);
