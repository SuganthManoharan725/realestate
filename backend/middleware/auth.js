// Middleware to check if user is authenticated
module.exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin/login'); // Redirect to login page if not authenticated
};