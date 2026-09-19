/**
 * Validation middleware for authentication routes (signup and login)
 */

export const validateSignup = (req, res, next) => {
  const { username, email, password } = req.body || {};

  // 1. Username validation
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({
      success: false,
      code: "INVALID_USERNAME",
      message: "Username is required and must be at least 3 characters long.",
    });
  }

  // 2. Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      code: "INVALID_EMAIL",
      message: "A valid email address is required.",
    });
  }

  // 3. Password validation
  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      success: false,
      code: "INVALID_PASSWORD",
      message: "Password must be at least 6 characters long.",
    });
  }

  // Attach sanitized data
  req.sanitizedSignup = {
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password,
  };

  next();
};

export const validateLogin = (req, res, next) => {
  const { username, email, identifier: rawId, password } = req.body || {};
  const identifier = (username || email || rawId || "").trim();

  if (!identifier || typeof identifier !== "string") {
    return res.status(400).json({
      success: false,
      code: "INVALID_USERNAME",
      message: "Username is required.",
    });
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    return res.status(400).json({
      success: false,
      code: "INVALID_PASSWORD",
      message: "Password is required.",
    });
  }

  req.sanitizedLogin = {
    username: identifier,
    email: identifier,
    identifier,
    password,
  };

  next();
};
