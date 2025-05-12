// backend/models/WorkoutLog.js
const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
  reps: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const ExerciseLogSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  targetReps: {
    type: Number,
    default: 0
  },
  targetWeight: {
    type: Number,
    default: 0
  },
  targetDistance: {
    type: Number,
    default: 0
  },
  targetDuration: {
    type: Number,
    default: 0
  },
  completedSets: [SetSchema]
});

const WorkoutLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutRoutine',
    required: true
  },
  workoutName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  exercises: [ExerciseLogSchema],
  notes: {
    type: String
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual field for formatted duration
WorkoutLogSchema.virtual('formattedDuration').get(function() {
  const mins = Math.floor(this.duration / 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (hrs > 0) {
    return `${hrs}h ${remainingMins}m`;
  } else {
    return `${mins}m`;
  }
});

// Pre-save hook to calculate progress if not provided
WorkoutLogSchema.pre('save', function(next) {
  if (this.isModified('exercises') || !this.progress) {
    let totalSets = 0;
    let completedSets = 0;
    
    this.exercises.forEach(exercise => {
      totalSets += exercise.completedSets.length;
      completedSets += exercise.completedSets.filter(set => set.isCompleted).length;
    });
    
    this.progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  }
  
  next();
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);