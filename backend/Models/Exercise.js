// backend/models/Exercise.js
const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'cardio', 'full_body']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'functional'],
    required: true
  },
  equipment: [{
    type: String,
    enum: ['none', 'dumbbell', 'barbell', 'kettlebell', 'resistance_band', 'machine', 'cable', 'bodyweight', 'medicine_ball', 'stability_ball', 'pull_up_bar', 'bench', 'yoga_mat']
  }],
  instructions: [{
    step: Number,
    description: String
  }],
  media: {
    images: [{
      url: String,
      altText: String
    }],
    videos: [{
      url: String,
      thumbnail: String
    }]
  },
  metrics: {
    sets: {
      type: Boolean,
      default: true
    },
    reps: {
      type: Boolean,
      default: true
    },
    weight: {
      type: Boolean,
      default: false
    },
    time: {
      type: Boolean,
      default: false
    },
    distance: {
      type: Boolean,
      default: false
    }
  },
  tips: [String],
  variations: [{
    name: String,
    description: String,
    difficulty: String
  }],
  alternatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exercise', ExerciseSchema);