import express from 'express';
import { protect } from '../middleware/auth.js';
import ProgramListing from '../models/ProgramListing.js';
import BenefitListing from '../models/BenefitListing.js';
import { runDailyDiscovery } from '../services/discoveryService.js';

const router = express.Router();

// @desc    Get all programs (active first, then expired)
// @route   GET /api/discover/programs
// @access  Private
router.get('/programs', protect, async (req, res) => {
  try {
    const { category, status, tag } = req.query;
    
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (tag && tag !== 'All') filter.tags = tag;

    const active = await ProgramListing.find({ ...filter, status: { $in: ['active', 'upcoming'] } })
      .sort({ addedAt: -1 })
      .lean({ virtuals: true });

    const expired = await ProgramListing.find({ ...filter, status: 'expired' })
      .sort({ addedAt: -1 })
      .limit(20)
      .lean({ virtuals: true });

    // Add isNew flag manually for lean queries (virtuals don't work with lean)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const addFlags = (items) => items.map(item => ({
      ...item,
      isNew: item.addedAt >= sevenDaysAgo,
      isExpiringSoon: item.expiresAt ? (item.expiresAt <= fourteenDaysFromNow && item.expiresAt > now) : false,
    }));

    res.json({
      active: addFlags(active),
      expired: addFlags(expired),
      totalActive: active.length,
      totalExpired: expired.length,
      lastUpdated: active.length > 0 ? active[0].updatedAt : null,
    });
  } catch (err) {
    console.error('Programs fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
});

// @desc    Get all benefits grouped by category
// @route   GET /api/discover/benefits
// @access  Private
router.get('/benefits', protect, async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { status: 'active' };
    if (category && category !== 'all') filter.category = category;

    const active = await BenefitListing.find(filter)
      .sort({ addedAt: -1 })
      .lean({ virtuals: true });

    const expired = await BenefitListing.find({ ...( category && category !== 'all' ? { category } : {}), status: 'expired' })
      .sort({ addedAt: -1 })
      .limit(20)
      .lean({ virtuals: true });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const addFlags = (items) => items.map(item => ({
      ...item,
      isNew: item.addedAt >= sevenDaysAgo,
    }));

    // Group active by category
    const grouped = {};
    for (const item of addFlags(active)) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    res.json({
      grouped,
      all: addFlags(active),
      expired: addFlags(expired),
      totalActive: active.length,
      lastUpdated: active.length > 0 ? active[0].updatedAt : null,
    });
  } catch (err) {
    console.error('Benefits fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch benefits' });
  }
});

// @desc    Manually trigger AI discovery refresh
// @route   POST /api/discover/refresh
// @access  Private (any authenticated user can trigger)
router.post('/refresh', protect, async (req, res) => {
  try {
    await runDailyDiscovery();
    res.json({ message: 'Discovery refresh complete', timestamp: new Date() });
  } catch (err) {
    console.error('Manual discovery error:', err);
    res.status(500).json({ message: 'Discovery refresh failed' });
  }
});

export default router;
