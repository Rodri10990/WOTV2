// backend/models/WorkoutRoutine.js
const mongoose = require('mongoose');

const WorkoutRoutineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  goal: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness'],
    required: true
  },
  daysPerWeek: {
    type: Number,
    min: 1,
    max: 7,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  workouts: [{
    day: {
      type: Number, // 1 = Monday, 7 = Sunday
      required: true
    },
    name: {
      type: String,
      required: true
    },
    exercises: [{
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
      },
      sets: Number,
      reps: String, // Can be a range like "8-12"
      weight: String, // Can be "bodyweight" or a specific weight
      duration: Number, // In seconds
      distance: Number, // In meters
      rest: Number, // Rest time in seconds
      notes: String
    }],
    warmup: [{
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      duration: Number, // In seconds
      description: String
    }],
    cooldown: [{
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
      },
      duration: Number, // In seconds
      description: String
    }]
  }],
  tags: [String],
  isTemplate: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  modifiedAt: {
    type: Date,
    default: Date.now
  }
});

// Update modifiedAt on save
WorkoutRoutineSchema.pre('save', function(next) {
  this.modifiedAt = Date.now();
  next();
});

module.exports = mongoose.model('WorkoutRoutine', WorkoutRoutineSchema);