// middleware/logger.js
//
// Logs every incoming request in the format:
//   GET /api/notes
//   10:45 AM
//   ----------------

function logger(req, res, next) {
  const time = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  console.log(`${req.method} ${req.originalUrl}`);
  console.log(time);
  console.log('----------------');

  next();
}

module.exports = logger;
