const authService = require('../services/auth.service');

async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const profileImage = req.file ? `/uploads/settings/${req.file.filename}` : null;

    const result = await authService.registerOwner({
      name,
      email,
      password,
      profileImage,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      company: result.company,
      token: result.token,
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
      company: result.company,
    });
  } catch (error) {
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
}

async function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'OWNER',
      companyId: req.user.companyId,
      profileImage: req.user.profileImage || null,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
    },
  });
}

async function logoutUser(req, res) {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Registered business email is required' });
    }

    const result = await authService.forgotPassword(email);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('No registered account found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });
    }

    const result = await authService.verifyResetOtp(email, otp);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const result = await authService.resetPassword(email, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
