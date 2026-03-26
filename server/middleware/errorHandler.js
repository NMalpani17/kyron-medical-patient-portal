function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status,
    },
  });
}

module.exports = errorHandler;
