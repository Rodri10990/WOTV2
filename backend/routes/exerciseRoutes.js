// backend/routes/exerciseRoutes.js
const express = require('express');
const router = express.Router();
const Exercise = require('../../models/Exercise');
const { authMiddleware } = require('../../auth/authController');

// Get all exercises with filtering options
router.get('/', async (req, res) => {
  try {
    const {
      muscleGroup,
      difficulty,
      category,
      equipment,
      search,
      limit = 20,
      page = 1
    } = req.query;
    
    const query = {};
    
    // Apply filters if provided
    if (muscleGroup) query.muscleGroups = muscleGroup;
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (equipment) query.equipment = equipment;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const exercises = await Exercise.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });
    
    const total = await Exercise.countDocuments(query);
    
    res.json({
      exercises,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get exercise by ID
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('alternatives', 'name difficulty equipment');
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes (protected)
// Add a new exercise
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (this would need a proper admin check in a real app)
    // For now we'll just allow any authenticated user to add exercises
    
    const {
      name,
      description,
      muscleGroups,
      difficulty,
      category,
      equipment,
      instructions,
      media,
      metrics,
      tips,
      variations
    } = req.body;
    
    // Check if exercise already exists
    const existingExercise = await Exercise.findOne({ name });
    if (existingExercise) {
      return res.status(400).json({ message: 'Exercise already exists' });
    }
    
    const newExercise = new Exercise({
      name,
      description,
      muscleGroups,
      difficulty,
      category,
      equipment,
      instructions,
      media,
      metrics,
      tips,
      variations
    });
    
    const savedExercise = await newExercise.save();
    
    res.status(201).json({
      message: 'Exercise created successfully',
      exercise: savedExercise
    });
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an exercise
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if exercise exists
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json({
      message: 'Exercise updated successfully',
      exercise: updatedExercise
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an exercise
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    await Exercise.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get exercise categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = {
      muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'cardio', 'full_body'],
      difficulties: ['beginner', 'intermediate', 'advanced'],
      categories: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'functional'],
      equipment: ['none', 'dumbbell', 'barbell', 'kettlebell', 'resistance_band', 'machine', 'cable', 'bodyweight', 'medicine_ball', 'stability_ball', 'pull_up_bar', 'bench', 'yoga_mat']
    };
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;