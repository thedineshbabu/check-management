/**
 * Calendar View Component
 * Displays calendar with month/week view
 * Highlights dates with checks and selected date
 * Shows incoming (green) and outgoing (red) indicators
 */

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, subDays } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import logger from '../utils/logger';
import './CalendarView.css';

/**
 * CalendarView Component
 * @param {Date} selectedDate - Currently selected date
 * @param {string} viewMode - 'month' or 'week'
 * @param {Function} onDateSelect - Callback when date is selected
 * @param {Object} dashboardData - Dashboard data for highlighting dates
 * @param {Array} monthChecks - Array of checks for the visible month
 * @param {Function} onMonthChange - Callback when month/week changes (to load checks)
 */
const CalendarView = ({ selectedDate, viewMode, onDateSelect, dashboardData, monthChecks = [], onMonthChange }) => {
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
   * Build a map of dates to check types
   * Groups checks by date and categorizes as incoming/outgoing
   */
  const checksByDate = useMemo(() => {
    const map = {};
    if (!monthChecks || monthChecks.length === 0) return map;

    monthChecks.forEach(check => {
      const dateStr = check.date?.split('T')[0]; // Handle ISO date strings
      if (!dateStr) return;
      
      if (!map[dateStr]) {
        map[dateStr] = { incoming: false, outgoing: false };
      }
      
      if (check.type === 'incoming') {
        map[dateStr].incoming = true;
      } else if (check.type === 'outgoing') {
        map[dateStr].outgoing = true;
      }
    });

    return map;
  }, [monthChecks]);

  /**
   * Get check info for a specific date
   * @param {Date} date - Date to check
   * @returns {Object} Object with incoming and outgoing booleans
   */
  const getCheckInfo = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return checksByDate[dateStr] || { incoming: false, outgoing: false };
  };

  /**
   * Notify parent when month/week changes
   */
  useEffect(() => {
    if (onMonthChange) {
      const dates = getDatesToDisplay();
      const start = format(dates[0], 'yyyy-MM-dd');
      const end = format(dates[dates.length - 1], 'yyyy-MM-dd');
      onMonthChange(start, end);
    }
  }, [currentDate, viewMode]);

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
            const checkInfo = getCheckInfo(date);
            const hasAnyChecks = checkInfo.incoming || checkInfo.outgoing;

            return (
              <div
                key={index}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isCurrentDay ? 'today' : ''} ${hasAnyChecks ? 'has-checks' : ''}`}
                onClick={() => onDateSelect(date)}
              >
                <span className="day-number">{format(date, 'd')}</span>
                {hasAnyChecks && (
                  <div className="check-indicators">
                    {checkInfo.incoming && (
                      <div className="check-indicator incoming" title="Incoming check(s)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4L12 20M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    {checkInfo.outgoing && (
                      <div className="check-indicator outgoing" title="Outgoing check(s)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 20L12 4M12 20L8 16M12 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <span className="legend-item">
          <div className="check-indicator incoming">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L12 20M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Incoming
        </span>
        <span className="legend-item">
          <div className="check-indicator outgoing">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20L12 4M12 20L8 16M12 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Outgoing
        </span>
      </div>
    </div>
  );
};

export default CalendarView;
