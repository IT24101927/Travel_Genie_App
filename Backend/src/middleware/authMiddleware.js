const { verifyToken } = require('../utils/jwt');
const User = require('../modules/users/models/user.model');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Bearer token is missing.'
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User account is not available.'
      });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      fullName: user.fullName
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid or expired token.'
    });
  }
};

module.exports = {
  protect
};
