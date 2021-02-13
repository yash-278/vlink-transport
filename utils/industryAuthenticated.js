module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render("industryLogin");
};
