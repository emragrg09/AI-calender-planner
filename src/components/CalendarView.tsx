'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Trash2, X } from 'lucide-react';
import { CalendarEvent, AISuggestion } from '@/types/calendar';

interface CalendarViewProps {
  events: CalendarEvent[];
  suggestions: AISuggestion[];
  isLoadingEvents: boolean;
  viewMode: 'week' | 'day';
  setViewMode: (mode: 'week' | 'day') => void;
  currentWeekStart: Date;
  onNavigateWeek: (direction: 'next' | 'prev') => void;
  onNavigateToday: () => void;
  onOpenEditModal: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  errorMessage: string | null;
  onCloseError: () => void;
}

export default function CalendarView({
  events,
  suggestions,
  isLoadingEvents,
  viewMode,
  setViewMode,
  currentWeekStart,
  onNavigateWeek,
  onNavigateToday,
  onOpenEditModal,
  onDeleteEvent,
  errorMessage,
  onCloseError
}: CalendarViewProps) {
  // Date range display helper
  const getWeekRangeLabel = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    const startStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} – ${endStr}`;
  };

  // Filter and prepare calendar events for specific column
  const getEventsForDay = (dayIndex: number) => {
    const targetDate = new Date(currentWeekStart);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    const targetDateString = targetDate.toDateString();

    const dayEvents = events.filter(e => {
      const eStart = new Date(e.start);
      return eStart.toDateString() === targetDateString && !e.isAllDay;
    });

    const daySuggestions = suggestions.filter(s => {
      const sStart = new Date(s.start);
      return sStart.toDateString() === targetDateString;
    });

    return {
      events: dayEvents,
      suggestions: daySuggestions
    };
  };

  return (
    <main className="main-content">
      {errorMessage && (
        <div className="error-banner">
          <span>{errorMessage}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={onCloseError} />
        </div>
      )}

      <div className="calendar-header">
        <div className="calendar-title-nav">
          <span className="calendar-title">{getWeekRangeLabel()}</span>
          <div className="calendar-nav-buttons">
            <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => onNavigateWeek('prev')}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onNavigateToday}>
              Today
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => onNavigateWeek('next')}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
        </div>
      </div>

      <div className="calendar-grid-container">
        {isLoadingEvents && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Syncing with Google Calendar...</p>
          </div>
        )}
        
        {/* Week/Day View Grid */}
        <div 
          className="week-grid" 
          style={{ 
            gridTemplateColumns: viewMode === 'week' ? '60px repeat(7, 1fr)' : '60px 1fr', 
            height: '1440px' 
          }}
        >
          {/* Hour Labels */}
          <div className="hour-column">
            {Array.from({ length: 24 }).map((_, hour) => {
              const displayHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
              return (
                <div key={hour} className="hour-label">
                  {displayHour}
                </div>
              );
            })}
          </div>

          {/* Day Columns */}
          {Array.from({ length: viewMode === 'week' ? 7 : 1 }).map((_, idx) => {
            const dayIndex = viewMode === 'week' ? idx : new Date().getDay() - 1; // if day view, show today
            const columnDate = new Date(currentWeekStart);
            columnDate.setDate(columnDate.getDate() + (viewMode === 'week' ? dayIndex : 0));
            
            const isToday = new Date().toDateString() === columnDate.toDateString();
            const dayData = getEventsForDay(viewMode === 'week' ? dayIndex : 0);

            return (
              <div key={idx} className={`day-column ${isToday ? 'today' : ''}`}>
                {/* Day Column Header sticky inside calendar view */}
                <div className={`day-header-cell ${isToday ? 'today' : ''}`}>
                  <span className="day-name">
                    {columnDate.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="day-number">
                    {columnDate.getDate()}
                  </span>
                </div>

                {/* Spacing grids */}
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="grid-cell" />
                ))}

                {/* Google Events */}
                {dayData.events.map(event => {
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;
                  
                  // Compute coordinates
                  const top = startHour * 60 + 52; // Offset for header cell height
                  const height = Math.max((endHour - startHour) * 60 - 2, 24); // 2px margin

                  return (
                    <div 
                      key={event.id}
                      className={`event-card ${event.createdBy === 'ai-calendar-planner' ? 'app-event' : 'personal-event'}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={() => onOpenEditModal(event)}
                    >
                      <span className="event-title">{event.summary}</span>
                      <span className="event-time">
                        {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      
                      {/* Trash indicator for hover */}
                      {event.createdBy === 'ai-calendar-planner' && (
                        <div className="event-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="event-action-btn"
                            onClick={() => onDeleteEvent(event.id)}
                            title="Delete event"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Suggested Preview Blocks */}
                {dayData.suggestions.map(suggest => {
                  const start = new Date(suggest.start);
                  const end = new Date(suggest.end);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;
                  
                  const top = startHour * 60 + 52;
                  const height = Math.max((endHour - startHour) * 60 - 2, 24);

                  return (
                    <div 
                      key={suggest.id}
                      className="event-card suggested-event"
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={`Suggested slot for: ${suggest.title}`}
                    >
                      <span className="event-title" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Sparkles size={11} style={{ flexShrink: 0 }} />
                        {suggest.title}
                      </span>
                      <span className="event-time">
                        {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
