import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMyProfile, updateProfile, processRoleplayChat } from '../controllers/languageController.js';

const router = express.Router();

router.use(protect);

router.route('/profile')
  .get(getMyProfile)
  .put(updateProfile);

router.post('/roleplay', processRoleplayChat);

export default router;
