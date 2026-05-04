const express = require('express');

const { protect } = require('../../../middleware/authMiddleware');
const validateRequest = require('../../../middleware/validateMiddleware');
const { createUploader } = require('../../../middleware/uploadMiddleware');
const { updateProfileValidation } = require('../user.validation');
const { getMyProfile, updateMyProfile, changeMyPassword, deleteMyAccount } = require('../controllers/user.controller');


const router = express.Router();
const upload = createUploader('profiles');

router.get('/me', protect, getMyProfile);
router.put(
  '/me',
  protect,
  upload.single('profileImage'),
  updateProfileValidation,
  validateRequest,
  updateMyProfile
);
router.post('/me/change-password', protect, changeMyPassword);
router.delete('/me', protect, deleteMyAccount);

module.exports = router;
