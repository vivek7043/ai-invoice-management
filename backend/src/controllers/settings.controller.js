const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const { createAuditLog } = require('../services/auditLog.service');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'OWNER',
        profileImage: user.profileImage || null,
      },
    });
  } catch (error) {
    console.error('Error fetching profile settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile settings' });
  }
}

async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, fullName, email } = req.body;

    const newName = (name || fullName || '').trim();
    if (newName) user.name = newName;
    if (email) user.email = email.trim().toLowerCase();

    if (req.file) {
      user.profileImage = `/uploads/settings/${req.file.filename}`;
    }

    await user.save();

    await createAuditLog({
      companyId: user.companyId,
      userId: user._id,
      userName: user.name,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: String(user._id),
      description: 'Profile settings updated',
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'OWNER',
        profileImage: user.profileImage || null,
      },
    });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile settings' });
  }
}

async function getCompanySettings(req, res) {
  try {
    let company = null;
    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne({ ownerId: req.user._id });
    }

    if (!company) {
      const user = await User.findById(req.user._id);
      company = await Company.create({
        companyName: `${user ? user.name : 'My'} Company`,
        ownerId: req.user._id,
        logo: user ? user.profileImage : null,
      });
      if (user) {
        user.companyId = company._id;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      company: {
        _id: company._id,
        id: company._id,
        companyName: company.companyName || '',
        ownerId: company.ownerId,
        logo: company.logo || null,
      },
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch company settings' });
  }
}

async function updateCompanySettings(req, res) {
  try {
    const { companyName } = req.body;

    let company = null;
    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne({ ownerId: req.user._id });
    }

    if (!company) {
      company = new Company({ ownerId: req.user._id });
    }

    if (companyName !== undefined && companyName.trim()) {
      company.companyName = companyName.trim();
    }

    if (req.file) {
      company.logo = `/uploads/settings/${req.file.filename}`;
    }

    await company.save();

    await createAuditLog({
      companyId: company._id,
      userId: req.user._id,
      userName: req.user.name || 'Owner',
      action: 'COMPANY_SETTINGS_UPDATED',
      entityType: 'Company',
      entityId: String(company._id),
      description: 'Company settings updated',
    });

    const safeCompany = {
      _id: company._id,
      id: company._id,
      companyName: company.companyName,
      ownerId: company.ownerId,
      logo: company.logo || null,
    };

    return res.status(200).json({
      success: true,
      message: 'Company settings updated successfully.',
      company: safeCompany,
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update company settings' });
  }
}

async function changePassword(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await createAuditLog({
      companyId: user.companyId,
      userId: user._id,
      userName: user.name,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: String(user._id),
      description: 'User password changed successfully',
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getCompanySettings,
  updateCompanySettings,
  changePassword,
};
