function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'Facebook authentication required. Please connect your Meta account.'
    });
  }
  next();
}

function optionalAuth(req, res, next) {
  next();
}

module.exports = { requireAuth, optionalAuth };
