import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserModel } from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'railsafe360_super_secret_key', {
    expiresIn: '30d'
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, employeeId, currentShed } = req.body;
    const User = getUserModel();

    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email or employee ID');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      employeeId,
      currentShed: currentShed || 'Jamalpur'
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      employeeId: newUser.employeeId,
      currentShed: newUser.currentShed,
      token: generateToken(newUser._id)
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const User = getUserModel();

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      currentShed: user.currentShed,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        currentShed: user.currentShed
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, employeeId, newPassword } = req.body;
    const User = getUserModel();

    const user = await User.findOne({ email, employeeId });
    if (!user) {
      res.status(404);
      throw new Error('User matching this email and Employee ID not found');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
};
