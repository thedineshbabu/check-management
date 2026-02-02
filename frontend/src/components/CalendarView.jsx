/**
 * Calendar View Component
 * Displays calendar with month/week view
 * Highlights dates with checks and selected date
 */

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, subDays } from 'date-fns';
import { useState } from 'react';
import logger from '../utils/logger';
import './CalendarView.css';

/**
 * CalendarView Component
 * @param {Date} selectedDate - Currently selected date
 * @param {string} viewMode - 'month' or 'week'
 * @param {Function} onDateSelect - Callback when date is selected
 * @param {Object} dashboardData - Dashboard data for highlighting dates
 */
const CalendarView = ({ selectedDate, viewMode, onDateSelect, dashboardData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  /**
   * Get dates to display based on view mode
   * Returns array of dates for current month or week
   * @returns {Array} Array of date objects
   */
  const getDatesToDisplay = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  /**
   * Check if date has checks
   * Determines if date should be highlighted
   * @param {Date} date - Date to check
   * @returns {boolean} True if date has checks
   */
  const hasChecks = (date) => {
    if (!dashboardData) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return dashboardData.checks?.total > 0 && dashboardData.date === dateStr;
  };

  /**
   * Navigate to previous period
   * Moves calendar view backward
   */
  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  /**
   * Navigate to next period
   * Moves calendar view forward
   */
  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  /**
   * Navigate to today
   * Resets calendar to current date
   */
  const handleToday = () => {
    setCurrentDate(new Date());
    onDateSelect(new Date());
  };

  const dates = getDatesToDisplay();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button className="btn btn-secondary" onClick={handlePrevious}>
          ←
        </button>
        <h2 className="calendar-title">
          {viewMode === 'week' 
            ? `${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d, yyyy')}`
            : format(currentDate, 'MMMM yyyy')
          }
        </h2>
        <button className="btn btn-secondary" onClick={handleNext}>
          →
        </button>
        <button className="btn btn-primary" onClick={handleToday}>
          Today
        </button>
      </div>

      <div className="calendar-grid">
        {viewMode === 'month' && (
          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
        )}

        <div className={`calendar-days ${viewMode === 'week' ? 'week-view' : ''}`}>
          {dates.map((date, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentDay = isToday(date);
            const hasChecksOnDate = hasChecks(date);

            return (
              <div
                key={index}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isCurrentDay ? 'today' : ''} ${hasChecksOnDate ? 'has-checks' : ''}`}
                onClick={() => onDateSelect(date)}
              >
                <span className="day-number">{format(date, 'd')}</span>
                {hasChecksOnDate && <span className="check-indicator">•</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

