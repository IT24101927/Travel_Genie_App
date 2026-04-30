const express = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const {
  createTransportHandler,
  getTransportsHandler,
  getTransportHandler,
  updateTransportHandler,
  deleteTransportHandler
} = require('../controllers/transportController');

const router = express.Router();

router.use(protect);

router.post('/', createTransportHandler);
router.get('/', getTransportsHandler);
router.get('/:id', getTransportHandler);
router.put('/:id', updateTransportHandler);
router.delete('/:id', deleteTransportHandler);

module.exports = router;
