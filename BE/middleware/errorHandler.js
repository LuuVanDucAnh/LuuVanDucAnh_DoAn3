function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'EREQUEST') {
    return res.status(500).json({ message: 'Lỗi cơ sở dữ liệu: ' + err.message });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token không hợp lệ.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token đã hết hạn.' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Lỗi server không xác định.',
  });
}

module.exports = errorHandler;
