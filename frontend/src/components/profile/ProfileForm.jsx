// frontend/src/components/profile/ProfileForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
const fitnessGoals = [
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'muscle_gain', label: 'Muscle Gain' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'strength', label: 'Strength' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'general_fitness', label: 'General Fitness' }
];

const ProfileForm = () => {
  const [profile, setProfile] = useState({
    fitnessLevel: 'beginner',
    goals: [],
    healthMetrics: {
      weight: { value: '', unit: 'kg' },
      height: { value: '', unit: 'cm' },
      bodyFatPercentage: '',
      restingHeartRate: ''
    },
    medicalConditions: '',
    injuries: '',
    preferences: {
      workoutDuration: 45,
      workoutsPerWeek: 3,
      preferredExercises: '',
      excludedExercises: ''
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        setIsLoading(true);
        const response = await axios.get('/api/profile', {
          headers: { 'x-auth-token': token }
        });
        
        if (response.data.profile) {
          // Transform array data to string for form inputs
          const profileData = {...response.data.profile};
          if (profileData.medicalConditions) {
            profileData.medicalConditions = profileData.medicalConditions.join(', ');
          }
          if (profileData.injuries) {
            profileData.injuries = profileData.injuries.join(', ');
          }
          if (profileData.preferences) {
            if (profileData.preferences.preferredExercises) {
              profileData.preferences.preferredExercises = profileData.preferences.preferredExercises.join(', ');
            }
            if (profileData.preferences.excludedExercises) {
              profileData.preferences.excludedExercises = profileData.preferences.excludedExercises.join(', ');
            }
          }
          
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleMetricChange = (e) => {
    const { name, value } = e.target;
    const [metric, field] = name.split('.');
    
    setProfile(prev => ({
      ...prev,
      healthMetrics: {
        ...prev.healthMetrics,
        [metric]: {
          ...prev.healthMetrics[metric],
          [field]: value
        }
      }
    }));
  };
  
  const handleGoalChange = (goalId) => {
    setProfile(prev => {
      const updatedGoals = prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId];
        
      return {
        ...prev,
        goals: updatedGoals
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Transform string inputs to arrays where needed
      const formattedProfile = {
        ...profile,
        medicalConditions: profile.medicalConditions.split(',').map(item => item.trim()).filter(Boolean),
        injuries: profile.injuries.split(',').map(item => item.trim()).filter(Boolean),
        preferences: {
          ...profile.preferences,
          preferredExercises: profile.preferences.preferredExercises.split(',').map(item => item.trim()).filter(Boolean),
          excludedExercises: profile.preferences.excludedExercises.split(',').map(item => item.trim()).filter(Boolean),
        }
      };
      
      await axios.put('/api/profile', formattedProfile, {
        headers: { 'x-auth-token': token }
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-form-container">
      <h2>Your Fitness Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          {/* Fitness Level */}
          <div className="form-group">
            <label>Fitness Level</label>
            <select 
              name="fitnessLevel" 
              value={profile.fitnessLevel} 
              onChange={handleChange}
              className="form-control"
            >
              {fitnessLevels.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Fitness Goals */}
          <div className="form-group">
            <label>Fitness Goals (Select all that apply)</label>
            <div className="checkbox-group">
              {fitnessGoals.map(goal => (
                <div className="checkbox-item" key={goal.id}>
                  <input 
                    type="checkbox" 
                    id={goal.id}
                    checked={profile.goals.includes(goal.id)}
                    onChange={() => handleGoalChange(goal.id)}
                  />
                  <label htmlFor={goal.id}>{goal.label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Health Metrics</h3>
          
          {/* Weight */}
          <div className="form-group input-with-unit">
            <label>Weight</label>
            <div className="input-unit-group">
              <input 
                type="number" 
                name="weight.value"
                value={profile.healthMetrics.weight.value} 
                onChange={handleMetricChange}
                placeholder="Weight"
                className="form-control"
                step="0.1"
              />
              <select 
                name="weight.unit"
                value={profile.healthMetrics.weight.unit}
                onChange={handleMetricChange}
                className="unit-select"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>
          
          {/* Height */}
          <div className="form-group input-with-unit">
            <label>Height</label>
            <div className="input-unit-group">
              <input 
                type="number" 
                name="height.value"
                value={profile.healthMetrics.height.value} 
                onChange={handleMetricChange}
                placeholder="Height"
                className="form-control"
                step="0.1"
              />
              <select 
                name="height.unit"
                value={profile.healthMetrics.height.unit}
                onChange={handleMetricChange}
                className="unit-select"
              >
                <option value="cm">cm</option>
                <option value="ft">ft</option>
              </select>
            </div>
          </div>
          
          {/* Body Fat Percentage */}
          <div className="form-group">
            <label>Body Fat Percentage (%)</label>
            <input 
              type="number" 
              name="bodyFatPercentage"
              value={profile.healthMetrics.bodyFatPercentage} 
              onChange={e => setProfile(prev => ({
                ...prev,
                healthMetrics: {
                  ...prev.healthMetrics,
                  bodyFatPercentage: e.target.value
                }
              }))}
              placeholder="Body Fat Percentage"
              className="form-control"
              step="0.1"
            />
          </div>
          
          {/* Resting Heart Rate */}
          <div className="form-group">
            <label>Resting Heart Rate (bpm)</label>
            <input 
              type="number" 
              name="restingHeartRate"
              value={profile.healthMetrics.restingHeartRate} 
              onChange={e => setProfile(prev => ({
                ...prev,
                healthMetrics: {
                  ...prev.healthMetrics,
                  restingHeartRate: e.target.value
                }
              }))}
              placeholder="Resting Heart Rate"
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Medical Information</h3>
          
          {/* Medical Conditions */}
          <div className="form-group">
            <label>Medical Conditions (comma separated)</label>
            <textarea
              name="medicalConditions"
              value={profile.medicalConditions}
              onChange={handleChange}
              placeholder="e.g., Asthma, High blood pressure"
              className="form-control"
              rows="2"
            />
          </div>
          
          {/* Injuries */}
          <div className="form-group">
            <label>Injuries or Limitations (comma separated)</label>
            <textarea
              name="injuries"
              value={profile.injuries}
              onChange={handleChange}
              placeholder="e.g., Lower back pain, Right knee injury"
              className="form-control"
              rows="2"
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Workout Preferences</h3>
          
          {/* Workout Duration */}
          <div className="form-group">
            <label>Preferred Workout Duration (minutes)</label>
            <input 
              type="number" 
              name="preferences.workoutDuration"
              value={profile.preferences.workoutDuration} 
              onChange={handleChange}
              className="form-control"
              min="10"
              max="180"
            />
          </div>
          
          {/* Workouts Per Week */}
          <div className="form-group">
            <label>Workouts Per Week</label>
            <input 
              type="number" 
              name="preferences.workoutsPerWeek"
              value={profile.preferences.workoutsPerWeek} 
              onChange={handleChange}
              className="form-control"
              min="1"
              max="7"
            />
          </div>
          
          {/* Preferred Exercises */}
          <div className="form-group">
            <label>Preferred Exercises (comma separated)</label>
            <textarea
              name="preferences.preferredExercises"
              value={profile.preferences.preferredExercises}
              onChange={handleChange}
              placeholder="e.g., Squats, Push-ups, Cycling"
              className="form-control"
              rows="2"
            />
          </div>
          
          {/* Excluded Exercises */}
          <div className="form-group">
            <label>Exercises to Avoid (comma separated)</label>
            <textarea
              name="preferences.excludedExercises"
              value={profile.preferences.excludedExercises}
              onChange={handleChange}
              placeholder="e.g., Burpees, Running, Deadlifts"
              className="form-control"
              rows="2"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;