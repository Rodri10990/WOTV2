// backend/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../../auth/authController');

// Get current user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      profile: user.profile,
      progressHistory: user.progressHistory
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { fitnessLevel, goals, healthMetrics, medicalConditions, injuries, preferences } = req.body;
    
    // Build profile object
    const profileFields = {};
    
    if (fitnessLevel) profileFields.fitnessLevel = fitnessLevel;
    if (goals) profileFields.goals = goals;
    if (healthMetrics) profileFields.healthMetrics = healthMetrics;
    if (medicalConditions) profileFields.medicalConditions = medicalConditions;
    if (injuries) profileFields.injuries = injuries;
    if (preferences) profileFields.preferences = preferences;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { profile: profileFields } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      profile: user.profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add progress record to history
router.post('/progress', authMiddleware, async (req, res) => {
  try {
    const { weight, bodyFatPercentage, measurements } = req.body;
    
    const newProgress = {
      date: new Date(),
      weight,
      bodyFatPercentage,
      measurements
    };
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { progressHistory: newProgress } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Progress added successfully',
      progressHistory: user.progressHistory
    });
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get progress history
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('progressHistory');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      progressHistory: user.progressHistory
    });
  } catch (error) {
    console.error('Error fetching progress history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;