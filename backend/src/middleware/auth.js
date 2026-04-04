const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to access this.', 401)
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  const result = await query(
    'SELECT id, email, role, is_active FROM users WHERE id = $1',
    [decoded.id]
  );

  const currentUser = result.rows[0];

  if (!currentUser) {
    return next(
      new AppError('The account belonging to this token no longer exists.', 401)
    );
  }
  if (!currentUser.is_active) {
    return next(
      new AppError('Your account has been deactivated. Contact support.', 401)
    );
  }
  req.user = currentUser;
  next();
});

module.exports = { protect };