// backend/routes/workoutRoutineRoutes.js
const express = require('express');
const router = express.Router();
const WorkoutRoutine = require('../../models/WorkoutRoutine');
const Exercise = require('../../models/Exercise');
const { authMiddleware } = require('../../auth/authController');

// Get all routines for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const routines = await WorkoutRoutine.find({ user: req.user.userId })
      .sort({ modifiedAt: -1 });
    
    res.json(routines);
  } catch (error) {
    console.error('Error fetching routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public routine templates
router.get('/templates', async (req, res) => {
  try {
    const { goal, level, limit = 10, page = 1 } = req.query;
    
    const query = { isTemplate: true, isPublic: true };
    
    if (goal) query.goal = goal;
    if (level) query.level = level;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const templates = await WorkoutRoutine.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await WorkoutRoutine.countDocuments(query);
    
    res.json({
      templates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific routine by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const routine = await WorkoutRoutine.findById(req.params.id)
      .populate({
        path: 'workouts.exercises.exercise',
        select: 'name description muscleGroups equipment media'
      })
      .populate({
        path: 'workouts.warmup.exercise',
        select: 'name description'
      })
      .populate({
        path: 'workouts.cooldown.exercise',
        select: 'name description'
      });
    
    // Check if routine exists
    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }
    
    // Check if user owns the routine or if it's a public template
    if (routine.user.toString() !== req.user.userId && !(routine.isTemplate && routine.isPublic)) {
      return res.status(403).json({ message: 'Not authorized to access this routine' });
    }
    
    res.json(routine);
  } catch (error) {
    console.error('Error fetching routine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new routine
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      level,
      goal,
      daysPerWeek,
      estimatedDuration,
      workouts,
      tags,
      isTemplate,
      isPublic
    } = req.body;
    
    const newRoutine = new WorkoutRoutine({
      user: req.user.userId,
      name,
      description,
      level,
      goal,
      daysPerWeek,
      estimatedDuration,
      workouts,
      tags,
      isTemplate: isTemplate || false,
      isPublic: isPublic || false
    });
    
    const savedRoutine = await newRoutine.save();
    
    res.status(201).json({
      message: 'Routine created successfully',
      routine: savedRoutine
    });
  } catch (error) {
    console.error('Error creating routine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a routine
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const routine = await WorkoutRoutine.findById(req.params.id);
    
    // Check if routine exists
    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }
    
    // Check if user owns the routine
    if (routine.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this routine' });
    }
    
    const updatedRoutine = await WorkoutRoutine.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json({
      message: 'Routine updated successfully',
      routine: updatedRoutine
    });
  } catch (error) {
    console.error('Error updating routine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a routine
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const routine = await WorkoutRoutine.findById(req.params.id);
    
    // Check if routine exists
    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }
    
    // Check if user owns the routine
    if (routine.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this routine' });
    }
    
    await WorkoutRoutine.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Routine deleted successfully' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clone a template to user's routines
router.post('/clone/:id', authMiddleware, async (req, res) => {
  try {
    const template = await WorkoutRoutine.findById(req.params.id);
    
    // Check if template exists
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if it's actually a template
    if (!template.isTemplate) {
      return res.status(400).json({ message: 'This is not a template routine' });
    }
    
    // Create new routine based on template
    const newRoutine = new WorkoutRoutine({
      user: req.user.userId,
      name: `${template.name} (Copy)`,
      description: template.description,
      level: template.level,
      goal: template.goal,
      daysPerWeek: template.daysPerWeek,
      estimatedDuration: template.estimatedDuration,
      workouts: template.workouts,
      tags: template.tags,
      isTemplate: false,
      isPublic: false
    });
    
    const savedRoutine = await newRoutine.save();
    
    res.status(201).json({
      message: 'Template cloned successfully',
      routine: savedRoutine
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;