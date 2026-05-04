const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/authMiddleware');
const { authorize } = require('../../../middleware/roleMiddleware');
const { createUploader } = require('../../../middleware/uploadMiddleware');
const districtController = require('../controllers/district.controller');


const upload = createUploader('districts');

router.get('/', districtController.getAllDistricts);
router.get('/:id', districtController.getDistrictById);

router.post('/upload', protect, authorize('admin'), upload.single('image'), districtController.uploadDistrictImage);
router.post('/', protect, authorize('admin'), districtController.createDistrict);
router.put('/:id', protect, authorize('admin'), districtController.updateDistrict);
router.delete('/:id', protect, authorize('admin'), districtController.deleteDistrict);

module.exports = router;
