// src/middlewares/error.js
export default function errorMiddleware(err, req, res, next) {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
}
