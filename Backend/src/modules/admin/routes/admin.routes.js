const express = require('express');
const { body } = require('express-validator');

const validateRequest = require('../../../middleware/validateMiddleware');
const { protect } = require('../../../middleware/authMiddleware');
const { authorize } = require('../../../middleware/roleMiddleware');
const {
  login,
  stats,
  listUsers,
  addUser,
  editUser,
  resetPassword,
  removeUser,
  listResource,
  transportInsights
} = require('../controllers/admin.controller');


const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/login', loginValidation, validateRequest, login);

router.use(protect, authorize('admin'));

router.get('/stats', stats);
router.get('/users', listUsers);
router.post('/users', addUser);
router.put('/users/:id', editUser);
router.post('/users/:id/reset-password', resetPassword);
router.delete('/users/:id', removeUser);
router.get('/resources/:resource', listResource);
router.get('/insights/transports', transportInsights);

module.exports = router;
