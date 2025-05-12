// frontend/src/components/workouts/WorkoutLogger.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

const WorkoutLogger = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [routine, setRoutine] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [workoutLog, setWorkoutLog] = useState({
    routineId: route.params?.routineId,
    date: new Date(),
    duration: 0,
    notes: '',
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);

  // Load routine data
  useEffect(() => {
    const loadRoutine = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const routineId = route.params?.routineId;
        
        if (!routineId) {
          Alert.alert('Error', 'No routine selected');
          navigation.goBack();
          return;
        }
        
        const response = await axios.get(`/api/routines/${routineId}`, {
          headers: { 'x-auth-token': token }
        });
        
        setRoutine(response.data);
        
        // Initialize workout log with exercises from the routine
        const selectedDayIndex = route.params?.dayIndex || 0;
        const exercises = response.data.workouts[selectedDayIndex].exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
          targetReps: ex.reps,
          targetWeight: ex.weight,
          targetDistance: ex.distance,
          targetDuration: ex.duration,
          completedSets: Array(ex.sets).fill().map(() => ({
            reps: ex.reps,
            weight: ex.weight,
            distance: ex.distance,
            duration: ex.duration,
            isCompleted: false
          }))
        }));
        
        setWorkoutLog(prev => ({
          ...prev,
          exercises,
          workoutName: response.data.workouts[selectedDayIndex].name
        }));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading routine:', error);
        Alert.alert('Error', 'Failed to load workout routine');
        setIsLoading(false);
        navigation.goBack();
      }
    };
    
    loadRoutine();
  }, [route.params?.routineId, navigation, route.params?.dayIndex]);

  // Timer functionality
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
        setWorkoutLog(prev => ({ ...prev, duration: elapsed }));
      }, 1000);
      
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
    }
  }, [isActive, startTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isActive) {
      // Start timer
      setStartTime(new Date().getTime() - (elapsedTime * 1000));
      setIsActive(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Pause timer
      setIsActive(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const resetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setIsActive(false);
            setElapsedTime(0);
            setWorkoutLog(prev => ({ ...prev, duration: 0 }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      ]
    );
  };

  const handleSetComplete = (exerciseIndex, setIndex, isCompleted) => {
    setWorkoutLog(prevLog => {
      const updatedExercises = [...prevLog.exercises];
      updatedExercises[exerciseIndex].completedSets[setIndex].isCompleted = isCompleted;
      
      // Apply haptic feedback
      if (isCompleted) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      return {
        ...prevLog,
        exercises: updatedExercises
      };
    });
  };

  const handleSetValueChange = (exerciseIndex, setIndex, field, value) => {
    setWorkoutLog(prevLog => {
      const updatedExercises = [...prevLog.exercises];
      updatedExercises[exerciseIndex].completedSets[setIndex][field] = value;
      
      return {
        ...prevLog,
        exercises: updatedExercises
      };
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setWorkoutLog(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleNotesChange = (text) => {
    setWorkoutLog(prev => ({ ...prev, notes: text }));
  };

  const calculateProgress = () => {
    let totalSets = 0;
    let completedSets = 0;
    
    workoutLog.exercises.forEach(exercise => {
      totalSets += exercise.completedSets.length;
      completedSets += exercise.completedSets.filter(set => set.isCompleted).length;
    });
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  const saveWorkout = async () => {
    if (!isActive && calculateProgress() === 0) {
      Alert.alert('No Progress', 'You haven\'t logged any sets yet. Start working out first!');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Stop timer if it's running
      if (isActive) {
        setIsActive(false);
      }
      
      const token = localStorage.getItem('token');
      
      // Format workout log data for API
      const formattedLog = {
        ...workoutLog,
        progress: calculateProgress()
      };
      
      // Save workout log to API
      const response = await axios.post('/api/workout-logs', formattedLog, {
        headers: { 'x-auth-token': token }
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Workout Saved!',
        'Your workout has been saved successfully.',
        [
          { text: 'View History', onPress: () => navigation.navigate('WorkoutHistory') },
          { text: 'Done', onPress: () => navigation.navigate('Home') }
        ]
      );
      
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout log');
      setIsSaving(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading workout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with workout name */}
        <View style={styles.header}>
          <Text style={styles.workoutName}>{workoutLog.workoutName}</Text>
          
          {/* Date picker */}
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#555" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Timer section */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[styles.timerButton, isActive ? styles.timerButtonActive : null]} 
              onPress={toggleTimer}
            >
              <Ionicons 
                name={isActive ? "pause" : "play"} 
                size={24} 
                color={isActive ? "#fff" : "#333"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.timerResetButton} 
              onPress={resetTimer}
            >
              <Ionicons name="refresh" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarOuter}>
            <View 
              style={[
                styles.progressBarInner, 
                { width: `${calculateProgress()}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{calculateProgress()}% Complete</Text>
        </View>
        
        {/* Exercises section */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          
          {workoutLog.exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              
              {/* Sets table header */}
              <View style={styles.setsHeader}>
                <Text style={[styles.setHeaderCell, styles.setNumCell]}>#</Text>
                {exercise.targetReps > 0 && <Text style={styles.setHeaderCell}>Reps</Text>}
                {exercise.targetWeight > 0 && <Text style={styles.setHeaderCell}>Weight</Text>}
                {exercise.targetDistance > 0 && <Text style={styles.setHeaderCell}>Distance</Text>}
                {exercise.targetDuration > 0 && <Text style={styles.setHeaderCell}>Time</Text>}
                <Text style={[styles.setHeaderCell, styles.doneCell]}>Done</Text>
              </View>
              
              {/* Sets rows */}
              {exercise.completedSets.map((set, setIndex) => (
                <View 
                  key={setIndex} 
                  style={[
                    styles.setRow, 
                    set.isCompleted ? styles.completedSetRow : null
                  ]}
                >
                  <Text style={[styles.setCell, styles.setNumCell]}>
                    {setIndex + 1}
                  </Text>
                  
                  {exercise.targetReps > 0 && (
                    <View style={styles.setCell}>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="numeric"
                        value={set.reps.toString()}
                        onChangeText={(text) => 
                          handleSetValueChange(
                            exerciseIndex, 
                            setIndex, 
                            'reps', 
                            parseInt(text) || 0
                          )
                        }
                      />
                    </View>
                  )}
                  
                  {exercise.targetWeight > 0 && (
                    <View style={styles.setCell}>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="numeric"
                        value={set.weight.toString()}
                        onChangeText={(text) => 
                          handleSetValueChange(
                            exerciseIndex, 
                            setIndex, 
                            'weight', 
                            parseFloat(text) || 0
                          )
                        }
                      />
                    </View>
                  )}
                  
                  {exercise.targetDistance > 0 && (
                    <View style={styles.setCell}>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="numeric"
                        value={set.distance.toString()}
                        onChangeText={(text) => 
                          handleSetValueChange(
                            exerciseIndex, 
                            setIndex, 
                            'distance', 
                            parseFloat(text) || 0
                          )
                        }
                      />
                    </View>
                  )}
                  
                  {exercise.targetDuration > 0 && (
                    <View style={styles.setCell}>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="numeric"
                        value={set.duration.toString()}
                        onChangeText={(text) => 
                          handleSetValueChange(
                            exerciseIndex, 
                            setIndex, 
                            'duration', 
                            parseInt(text) || 0
                          )
                        }
                      />
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={[
                      styles.setCell, 
                      styles.doneCell, 
                      set.isCompleted ? styles.doneCellCompleted : null
                    ]}
                    onPress={() => handleSetComplete(exerciseIndex, setIndex, !set.isCompleted)}
                  >
                    {set.isCompleted ? (
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color="#ccc" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>
        
        {/* Notes section */}
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>Workout Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="How was your workout? Note any PRs or challenges..."
            value={workoutLog.notes}
            onChangeText={handleNotesChange}
          />
        </View>
        
        {/* Date picker modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </ScrollView>
      
      {/* Save button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveWorkout}
          disabled={isSaving}
        >
          {isSaving ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Save Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#555',
  },
  timerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 16,
  },
  timerButton: {
    backgroundColor: '#f0f0f0',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timerButtonActive: {
    backgroundColor: '#4CAF50',
  },
  timerResetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarOuter: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  exercisesContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  setHeaderCell: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: '#666',
  },
  setNumCell: {
    flex: 0.5,
  },
  doneCell: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  completedSetRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  setCell: {
    flex: 1,
    justifyContent: 'center',
  },
  setInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 6,
    textAlign: 'center',
  },
  doneCellCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  notesContainer: {
    margin: 16,
    marginTop: 0,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveIcon: {
    marginRight: 8,
  },
});

export default WorkoutLogger;