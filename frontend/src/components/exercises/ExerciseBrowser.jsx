// frontend/src/components/exercises/ExerciseBrowser.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ExerciseBrowser = ({ onSelectExercise = null }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({
    muscleGroups: [],
    difficulties: [],
    categories: [],
    equipment: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    muscleGroup: '',
    difficulty: '',
    category: '',
    equipment: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/exercises/categories/all');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load exercise categories');
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch exercises with filters
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/exercises', {
          params: {
            ...filters,
            page: pagination.page,
            limit: pagination.limit
          }
        });
        
        setExercises(response.data.exercises);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setError('Failed to load exercises');
        setLoading(false);
      }
    };
    
    fetchExercises();
  }, [filters, pagination.page, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const { value } = e.target;
    // Update the visual input immediately
    setFilters(prev => ({ ...prev, search: value }));
    
    // Debounce the actual API call
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle clicking on an exercise
  const handleExerciseClick = (exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise);
    } else {
      // If no selection handler, navigate to exercise detail
      // This would use React Router in a full implementation
      console.log('Navigate to exercise detail:', exercise._id);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="exercise-browser">
      {/* Filter Section */}
      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search exercises..."
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          {/* Muscle Group Filter */}
          <div className="filter-group">
            <label htmlFor="muscleGroup">Muscle Group</label>
            <select
              id="muscleGroup"
              name="muscleGroup"
              value={filters.muscleGroup}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Muscle Groups</option>
              {categories.muscleGroups.map(group => (
                <option key={group} value={group}>
                  {group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Difficulty Filter */}
          <div className="filter-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Difficulties</option>
              {categories.difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Category Filter */}
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Equipment Filter */}
          <div className="filter-group">
            <label htmlFor="equipment">Equipment</label>
            <select
              id="equipment"
              name="equipment"
              value={filters.equipment}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Equipment</option>
              {categories.equipment.map(item => (
                <option key={item} value={item}>
                  {item === 'none' ? 'No Equipment' : item.charAt(0).toUpperCase() + item.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Exercise Cards */}
      <div className="exercise-grid">
        {loading ? (
          <div className="loading-spinner">Loading exercises...</div>
        ) : exercises.length === 0 ? (
          <div className="no-results">No exercises found matching your criteria</div>
        ) : (
          exercises.map(exercise => (
            <div 
              key={exercise._id}
              className="exercise-card"
              onClick={() => handleExerciseClick(exercise)}
            >
              <div className="exercise-image">
                {exercise.media && exercise.media.images && exercise.media.images.length > 0 ? (
                  <img 
                    src={exercise.media.images[0].url} 
                    alt={exercise.media.images[0].altText || exercise.name} 
                  />
                ) : (
                  <div className="placeholder-image">No Image</div>
                )}
              </div>
              
              <div className="exercise-details">
                <h3 className="exercise-name">{exercise.name}</h3>
                
                <div className="exercise-meta">
                  <span className={`difficulty ${exercise.difficulty}`}>
                    {exercise.difficulty}
                  </span>
                  
                  <span className="muscle-groups">
                    {exercise.muscleGroups.slice(0, 2).join(', ')}
                    {exercise.muscleGroups.length > 2 && '...'}
                  </span>
                </div>
                
                <div className="equipment-tags">
                  {exercise.equipment.map(item => (
                    <span key={item} className="equipment-tag">
                      {item === 'none' ? 'No Equipment' : item.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(pageNum => {
                // Show first page, last page, current page, and pages around current page
                return (
                  pageNum === 1 ||
                  pageNum === pagination.pages ||
                  Math.abs(pageNum - pagination.page) <= 1
                );
              })
              .map((pageNum, index, array) => {
                // Insert ellipsis when there are gaps in the sequence
                const prevPage = array[index - 1];
                const showEllipsis = prevPage && pageNum - prevPage > 1;
                
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="ellipsis">...</span>}
                    <button
                      className={`page-number ${pageNum === pagination.page ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseBrowser;