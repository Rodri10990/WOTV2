// frontend/src/components/routines/RoutineBuilder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ExerciseBrowser from '../exercises/ExerciseBrowser';

const RoutineBuilder = () => {
  const { id } = useParams(); // For editing existing routine
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseBrowser, setShowExerciseBrowser] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
  
  // Form state
  const [routine, setRoutine] = useState({
    name: '',
    description: '',
    level: 'beginner',
    goal: 'general_fitness',
    daysPerWeek: 3,
    estimatedDuration: 45,
    workouts: [],
    tags: '',
    isTemplate: false,
    isPublic: false
  });
  
  // Goals and levels options
  const goals = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'strength', label: 'Strength' },
    { value: 'flexibility', label: 'Flexibility' },
    { value: 'general_fitness', label: 'General Fitness' }
  ];
  
  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  
  // Day names
  const dayNames = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Fetch routine for editing
  useEffect(() => {
    if (id) {
      const fetchRoutine = async () => {
        try {
          setIsLoading(true);
          const token = localStorage.getItem('token');
          
          const response = await axios.get(`/api/routines/${id}`, {
            headers: { 'x-auth-token': token }
          });
          
          // Format tags array to string for form
          const formattedRoutine = {
            ...response.data,
            tags: response.data.tags ? response.data.tags.join(', ') : ''
          };
          
          setRoutine(formattedRoutine);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching routine:', error);
          toast.error('Failed to load routine');
          setIsLoading(false);
          navigate('/routines');
        }
      };
      
      fetchRoutine();
    } else {
      // Initialize days based on daysPerWeek
      initializeDays(3);
    }
  }, [id, navigate]);

  // Initialize workout days
  const initializeDays = (numDays) => {
    const initialWorkouts = [];
    
    for (let i = 0; i < numDays; i++) {
      initialWorkouts.push({
        day: i + 1, // 1-based (Monday = 1)
        name: `Day ${i + 1}`,
        exercises: [],
        warmup: [],
        cooldown: []
      });
    }
    
    setRoutine(prev => ({
      ...prev,
      workouts: initialWorkouts
    }));
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setRoutine(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setRoutine(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Special handling for daysPerWeek change
    if (name === 'daysPerWeek') {
      const newDays = parseInt(value);
      const currentDays = routine.workouts.length;
      
      if (newDays > currentDays) {
        // Add more days
        const newWorkouts = [...routine.workouts];
        
        for (let i = currentDays; i < newDays; i++) {
          newWorkouts.push({
            day: i + 1,
            name: `Day ${i + 1}`,
            exercises: [],
            warmup: [],
            cooldown: []
          });
        }
        
        setRoutine(prev => ({
          ...prev,
          workouts: newWorkouts
        }));
      } else if (newDays < currentDays) {
        // Remove days (with confirmation)
        if (window.confirm(`Reducing days will remove workouts from days ${newDays + 1} to ${currentDays}. Continue?`)) {
          const newWorkouts = routine.workouts.slice(0, newDays);
          
          setRoutine(prev => ({
            ...prev,
            workouts: newWorkouts
          }));
        } else {
          // Reset the select to previous value
          setRoutine(prev => ({
            ...prev,
            daysPerWeek: currentDays
          }));
        }
      }
    }
  };

  // Handle workout day name change
  const handleDayNameChange = (dayIndex, newName) => {
    const updatedWorkouts = [...routine.workouts];
    updatedWorkouts[dayIndex].name = newName;
    
    setRoutine(prev => ({
      ...prev,
      workouts: updatedWorkouts
    }));
  };

  // Open exercise browser to add exercise
  const openExerciseBrowser = (dayIndex, section = 'exercises', exerciseIndex = null) => {
    setSelectedDay(dayIndex);
    setSelectedExerciseIndex(exerciseIndex);
    setShowExerciseBrowser(true);
  };

  // Handle adding an exercise from browser
  const handleExerciseSelect = (exercise) => {
    const updatedWorkouts = [...routine.workouts];
    const dayWorkout = updatedWorkouts[selectedDay];
    
    const newExerciseEntry = {
      exerciseId: exercise._id,
      name: exercise.name,
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0,
      distance: 0,
      notes: '',
      restTime: 60,
      metrics: exercise.primaryMetrics || ['reps', 'weight'] // Default metrics based on exercise type
    };
    
    if (selectedExerciseIndex !== null) {
      // Replace existing exercise
      dayWorkout.exercises[selectedExerciseIndex] = newExerciseEntry;
    } else {
      // Add new exercise
      dayWorkout.exercises.push(newExerciseEntry);
    }
    
    setRoutine(prev => ({
      ...prev,
      workouts: updatedWorkouts
    }));
    
    setShowExerciseBrowser(false);
    setSelectedDay(null);
    setSelectedExerciseIndex(null);
  };

  // Handle removing an exercise
  const handleRemoveExercise = (dayIndex, exerciseIndex) => {
    const updatedWorkouts = [...routine.workouts];
    updatedWorkouts[dayIndex].exercises.splice(exerciseIndex, 1);
    
    setRoutine(prev => ({
      ...prev,
      workouts: updatedWorkouts
    }));
  };

  // Handle updating exercise details
  const handleExerciseChange = (dayIndex, exerciseIndex, field, value) => {
    const updatedWorkouts = [...routine.workouts];
    updatedWorkouts[dayIndex].exercises[exerciseIndex][field] = value;
    
    setRoutine(prev => ({
      ...prev,
      workouts: updatedWorkouts
    }));
  };

  // Handle reordering exercises (moving up/down)
  const handleMoveExercise = (dayIndex, exerciseIndex, direction) => {
    const updatedWorkouts = [...routine.workouts];
    const exercises = updatedWorkouts[dayIndex].exercises;
    
    if (direction === 'up' && exerciseIndex > 0) {
      // Swap with previous exercise
      [exercises[exerciseIndex], exercises[exerciseIndex - 1]] = 
      [exercises[exerciseIndex - 1], exercises[exerciseIndex]];
    } else if (direction === 'down' && exerciseIndex < exercises.length - 1) {
      // Swap with next exercise
      [exercises[exerciseIndex], exercises[exerciseIndex + 1]] = 
      [exercises[exerciseIndex + 1], exercises[exerciseIndex]];
    }
    
    setRoutine(prev => ({
      ...prev,
      workouts: updatedWorkouts
    }));
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Format tags from comma-separated string to array
      const formattedRoutine = {
        ...routine,
        tags: routine.tags ? routine.tags.split(',').map(tag => tag.trim()) : []
      };
      
      // Create or update routine
      let response;
      if (id) {
        response = await axios.put(
          `/api/routines/${id}`,
          formattedRoutine,
          { headers: { 'x-auth-token': token } }
        );
        toast.success('Routine updated successfully!');
      } else {
        response = await axios.post(
          '/api/routines',
          formattedRoutine,
          { headers: { 'x-auth-token': token } }
        );
        toast.success('Routine created successfully!');
      }
      
      setIsLoading(false);
      navigate(`/routines/${response.data._id}`);
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error(error.response?.data?.message || 'Failed to save routine');
      setIsLoading(false);
    }
  };

  // Handle routine copy
  const handleCopyRoutine = () => {
    // Remove ID and rename for copy
    const routineCopy = {
      ...routine,
      name: `Copy of ${routine.name}`,
      _id: undefined
    };
    
    setRoutine(routineCopy);
    navigate('/routines/new'); // Redirect to new route to avoid confusion
    toast.info('Created a copy of the routine. Save to confirm.');
  };

  if (isLoading) {
    return <div className="text-center my-8"><p>Loading...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Routine' : 'Create New Routine'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Routine Name</label>
              <input
                type="text"
                name="name"
                value={routine.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Days Per Week</label>
              <select
                name="daysPerWeek"
                value={routine.daysPerWeek}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Level</label>
              <select
                name="level"
                value={routine.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {levels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Goal</label>
              <select
                name="goal"
                value={routine.goal}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {goals.map(goal => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Estimated Duration (minutes)</label>
              <input
                type="number"
                name="estimatedDuration"
                value={routine.estimatedDuration}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={routine.tags}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="strength, hiit, etc."
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={routine.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTemplate"
                name="isTemplate"
                checked={routine.isTemplate}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="isTemplate">Save as Template</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={routine.isPublic}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="isPublic">Make Public</label>
            </div>
          </div>
        </div>
        
        {/* Workout days section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Workout Schedule</h2>
          
          {routine.workouts.map((workout, dayIndex) => (
            <div key={dayIndex} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">
                    {dayNames[(workout.day - 1) % 7]}:
                  </span>
                  <input
                    type="text"
                    value={workout.name}
                    onChange={(e) => handleDayNameChange(dayIndex, e.target.value)}
                    className="border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-blue-500"
                    placeholder="Workout Name"
                  />
                </div>
              </div>
              
              {/* Exercises list */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Exercises</h3>
                  <button
                    type="button"
                    onClick={() => openExerciseBrowser(dayIndex)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
                  >
                    Add Exercise
                  </button>
                </div>
                
                {workout.exercises.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No exercises added yet</p>
                ) : (
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="border rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{exercise.name}</div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(dayIndex, exerciseIndex, 'up')}
                              disabled={exerciseIndex === 0}
                              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(dayIndex, exerciseIndex, 'down')}
                              disabled={exerciseIndex === workout.exercises.length - 1}
                              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => openExerciseBrowser(dayIndex, 'exercises', exerciseIndex)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(dayIndex, exerciseIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {exercise.metrics.includes('sets') && (
                            <div>
                              <label className="block text-xs text-gray-600">Sets</label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => handleExerciseChange(
                                  dayIndex, 
                                  exerciseIndex, 
                                  'sets', 
                                  parseInt(e.target.value)
                                )}
                                className="w-full px-2 py-1 border rounded-md"
                                min="1"
                              />
                            </div>
                          )}
                          
                          {exercise.metrics.includes('reps') && (
                            <div>
                              <label className="block text-xs text-gray-600">Reps</label>
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => handleExerciseChange(
                                  dayIndex, 
                                  exerciseIndex, 
                                  'reps', 
                                  parseInt(e.target.value)
                                )}
                                className="w-full px-2 py-1 border rounded-md"
                                min="0"
                              />
                            </div>
                          )}
                          
                          {exercise.metrics.includes('weight') && (
                            <div>
                              <label className="block text-xs text-gray-600">Weight</label>
                              <input
                                type="number"
                                value={exercise.weight}
                                onChange={(e) => handleExerciseChange(
                                  dayIndex, 
                                  exerciseIndex, 
                                  'weight', 
                                  parseFloat(e.target.value)
                                )}
                                className="w-full px-2 py-1 border rounded-md"
                                min="0"
                                step="0.5"
                              />
                            </div>
                          )}
                          
                          {exercise.metrics.includes('duration') && (
                            <div>
                              <label className="block text-xs text-gray-600">Duration (sec)</label>
                              <input
                                type="number"
                                value={exercise.duration}
                                onChange={(e) => handleExerciseChange(
                                  dayIndex, 
                                  exerciseIndex, 
                                  'duration', 
                                  parseInt(e.target.value)
                                )}
                                className="w-full px-2 py-1 border rounded-md"
                                min="0"
                              />
                            </div>
                          )}
                          
                          {exercise.metrics.includes('distance') && (
                            <div>
                              <label className="block text-xs text-gray-600">Distance (m)</label>
                              <input
                                type="number"
                                value={exercise.distance}
                                onChange={(e) => handleExerciseChange(
                                  dayIndex, 
                                  exerciseIndex, 
                                  'distance', 
                                  parseFloat(e.target.value)
                                )}
                                className="w-full px-2 py-1 border rounded-md"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-xs text-gray-600">Rest (sec)</label>
                            <input
                              type="number"
                              value={exercise.restTime}
                              onChange={(e) => handleExerciseChange(
                                dayIndex, 
                                exerciseIndex, 
                                'restTime', 
                                parseInt(e.target.value)
                              )}
                              className="w-full px-2 py-1 border rounded-md"
                              min="0"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600">Notes</label>
                          <textarea
                            value={exercise.notes || ''}
                            onChange={(e) => handleExerciseChange(
                              dayIndex, 
                              exerciseIndex, 
                              'notes', 
                              e.target.value
                            )}
                            className="w-full px-2 py-1 border rounded-md"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 mr-2"
            >
              Cancel
            </button>
            
            {id && (
              <button
                type="button"
                onClick={handleCopyRoutine}
                className="px-5 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Create Copy
              </button>
            )}
          </div>
          
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (id ? 'Update Routine' : 'Create Routine')}
          </button>
        </div>
      </form>
      
      {/* Exercise Browser Modal */}
      {showExerciseBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Select Exercise</h3>
                <button
                  onClick={() => setShowExerciseBrowser(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <ExerciseBrowser onExerciseSelect={handleExerciseSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineBuilder;