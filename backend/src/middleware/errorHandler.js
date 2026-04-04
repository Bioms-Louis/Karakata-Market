const AppError = require('../utils/AppError');

const handleDBError = (err) => {
  if (err.code === '23505') {
    const field = err.detail.match(/\(([^)]+)\)/)[1];
    return new AppError(`${field} already exists`, 400);
  }
  if (err.code === '23503') {
    return new AppError('Referenced resource does not exist', 400);
  }
  
  if (err.code === '23502') {
    return new AppError(`${err.column} is required`, 400);
  }
  
  return new AppError('Database error occurred', 500);
};

const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () => 
  new AppError('Your session has expired. Please log in again.', 401);

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
   return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,  
      error: err
    });
  }

  let error = { ...err, message: err.message };
  
  if (err.code?.startsWith('23')) error = handleDBError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  console.error('💥 UNKNOWN ERROR:', err);
  return res.status(500).json({
    success: false,
    message: 'Something went very wrong!'
  });
};

module.exports = errorHandler;