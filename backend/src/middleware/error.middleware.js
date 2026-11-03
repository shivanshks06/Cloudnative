function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) return next(err);

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong"
  });
}

module.exports = errorHandler;
