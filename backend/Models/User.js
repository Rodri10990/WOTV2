// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    goals: [{
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness']
    }],
    healthMetrics: {
      weight: {
        value: { type: Number },
        unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
      },
      height: {
        value: { type: Number },
        unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
      },
      bodyFatPercentage: { type: Number },
      restingHeartRate: { type: Number }
    },
    medicalConditions: [String],
    injuries: [String],
    preferences: {
      workoutDuration: { type: Number, default: 45 }, // in minutes
      workoutsPerWeek: { type: Number, default: 3 },
      preferredExercises: [String],
      excludedExercises: [String]
    }
  },
  progressHistory: [{
    date: { type: Date, default: Date.now },
    weight: Number,
    bodyFatPercentage: Number,
    measurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      arms: Number,
      legs: Number
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);