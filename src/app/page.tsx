'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  X, 
  AlertCircle
} from 'lucide-react';
import { CalendarEvent, FreeTimeSlot, Task, UserPreferences, AISuggestion } from '@/types/calendar';

// Modular Components
import Header from '@/components/Header';
import TaskManager from '@/components/TaskManager';
import CalendarView from '@/components/CalendarView';
import AISuggestionConsole from '@/components/AISuggestionConsole';

// Modals
import EditEventModal from '@/components/modals/EditEventModal';
import ReadOnlyEventModal from '@/components/modals/ReadOnlyEventModal';
import PreferencesModal from '@/components/modals/PreferencesModal';

export default function CalendarPlannerPage() {
  // Google Connection State
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'disconnected' | 'expired'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Calendar Events & Active View
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Manual Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    breakTimes: [
      { start: '12:00', end: '13:00', label: 'Lunch Break' }
    ],
    focusSessionDuration: 90 // 1.5h default focus duration
  });
  
  // AI Suggestions
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planningAttempted, setPlanningAttempted] = useState(false);

  // Modals & Popups State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [readOnlyEvent, setReadOnlyEvent] = useState<CalendarEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('calendar_planner_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Add mock tasks initially so the UI isn't bare
      const initialTasks: Task[] = [
        { id: '1', title: 'Prepare project presentation', priority: 'high', estimatedDuration: 90, deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0], completed: false },
        { id: '2', title: 'Code review backlog', priority: 'medium', estimatedDuration: 60, deadline: new Date(Date.now() + 172800000).toISOString().split('T')[0], completed: false },
        { id: '3', title: 'Submit expenses claim', priority: 'low', estimatedDuration: 30, deadline: new Date(Date.now() + 259200000).toISOString().split('T')[0], completed: false },
      ];
      setTasks(initialTasks);
      localStorage.setItem('calendar_planner_tasks', JSON.stringify(initialTasks));
    }

    const savedPrefs = localStorage.getItem('calendar_planner_preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    // Check for callback auth errors in query params
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get('auth_error');
    if (authErr) {
      setAuthError(decodeURIComponent(authErr));
    }

    checkConnection();
  }, []);

  // Sync tasks to localStorage whenever they change
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('calendar_planner_tasks', JSON.stringify(updatedTasks));
  };

  // Sync preferences to localStorage
  const savePreferences = (updatedPrefs: UserPreferences) => {
    setPreferences(updatedPrefs);
    localStorage.setItem('calendar_planner_preferences', JSON.stringify(updatedPrefs));
  };

  // Fetch Calendar Events & Check connection status
  const checkConnection = async () => {
    try {
      setIsLoadingEvents(true);
      const timeMin = currentWeekStart.toISOString();
      const timeMax = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
      
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setConnectionStatus('connected');
        setErrorMessage(null);
      } else {
        const data = await res.json();
        if (data.code === 'NO_CONNECTION') {
          setConnectionStatus('disconnected');
        } else if (data.code === 'EXPIRED_TOKEN') {
          setConnectionStatus('expired');
        } else {
          setErrorMessage(data.error || 'Failed to fetch calendar events.');
          setConnectionStatus('connected'); // assume connected but error
        }
      }
    } catch (err: any) {
      console.error('Error connecting to api:', err);
      setErrorMessage('Could not communicate with secure API routes.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Trigger refetch whenever week start changes or connection status is connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      checkConnection();
    }
  }, [currentWeekStart]);

  // Task event handlers passed to TaskManager
  const handleAddTask = (newTask: Task) => {
    const updatedTasks = [...tasks, newTask];
    saveTasks(updatedTasks);
  };

  const handleToggleTask = (id: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    saveTasks(updatedTasks);
    // Also remove from suggestions if planned
    setSuggestions(suggestions.filter(s => s.taskId !== id));
  };

  // Trigger AI suggested plan generation
  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    setPlanningAttempted(true);
    setErrorMessage(null);
    try {
      const startIso = currentWeekStart.toISOString().split('T')[0];
      const res = await fetch('/api/planner/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          tasks,
          preferences,
          startDate: startIso
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setFreeSlots(data.freeSlots || []);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to generate plan suggestions.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Communication error during plan generation.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Add all suggested events to Google Calendar
  const handleCommitPlan = async () => {
    if (suggestions.length === 0) return;
    setIsSavingPlan(true);
    setErrorMessage(null);
    try {
      let successCount = 0;
      for (const suggestion of suggestions) {
        const res = await fetch('/api/calendar/create-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: suggestion.title,
            start: suggestion.start,
            end: suggestion.end,
            description: suggestion.reason || ''
          })
        });

        if (res.ok) {
          successCount++;
        }
      }

      // Mark planned tasks as completed in task list
      const plannedTaskIds = new Set(suggestions.map(s => s.taskId));
      const updatedTasks = tasks.map(task => 
        plannedTaskIds.has(task.id) ? { ...task, completed: true } : task
      );
      saveTasks(updatedTasks);

      setSuggestions([]);
      setPlanningAttempted(false);
      checkConnection(); // Refresh calendar view
      
      alert(`Success! Successfully created ${successCount} events in your Google Calendar.`);
    } catch (err) {
      console.error('Error committing plan:', err);
      setErrorMessage('An error occurred while saving the suggestions to Google Calendar.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Delete Calendar Event
  const handleDeleteCalendarEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will remove it from Google Calendar.')) return;
    setErrorMessage(null);
    try {
      const res = await fetch('/api/calendar/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setEvents(events.filter(e => e.id !== id));
        setEditingEvent(null);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete event.');
      }
    } catch (err) {
      setErrorMessage('Error connecting to deletion endpoint.');
    }
  };

  // Update Calendar Event
  const handleUpdateCalendarEvent = async (updatedData: { summary: string; description: string; start: string; end: string }) => {
    if (!editingEvent) return;

    setErrorMessage(null);
    try {
      const res = await fetch('/api/calendar/update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEvent.id,
          summary: updatedData.summary,
          description: updatedData.description,
          start: updatedData.start,
          end: updatedData.end,
          isAllDay: editingEvent.isAllDay
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(events.map(e => e.id === editingEvent.id ? data.event : e));
        setEditingEvent(null);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to update event.');
      }
    } catch (err) {
      setErrorMessage('Error connecting to update endpoint.');
    }
  };

  // Open Edit Event Modal or View Personal Event Modal
  const openEditModal = (event: CalendarEvent) => {
    if (event.createdBy === 'ai-calendar-planner') {
      setEditingEvent(event);
    } else {
      // Personal event (read-only)
      setReadOnlyEvent(event);
    }
  };

  // Navigation helpers
  const navigateWeek = (direction: 'next' | 'prev') => {
    setCurrentWeekStart(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(nextDate.getDate() + (direction === 'next' ? 7 : -7));
      return nextDate;
    });
    // Clear suggestions when week changes to prevent misplacement
    setSuggestions([]);
    setPlanningAttempted(false);
  };

  const navigateToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
    setSuggestions([]);
    setPlanningAttempted(false);
  };

  // Onboarding screens loading helper
  if (connectionStatus === 'loading') {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Render onboarding / unconnected screens
  if (connectionStatus === 'disconnected') {
    return (
      <div className="app-container">
        <Header connectionStatus={connectionStatus} isLoadingEvents={isLoadingEvents} />

        <div className="onboarding-container">
          <div className="onboarding-card">
            <div className="onboarding-icon">
              <CalendarIcon size={36} />
            </div>
            <h2>Connect Your Google Calendar</h2>
            <p>
              Sync your planner with Google Calendar to automatically schedule your work tasks around focus sessions, meetings, and breaks.
            </p>
            {authError && (
              <div className="error-banner" style={{ margin: '0 0 1.5rem' }}>
                <span>OAuth Error: {authError}</span>
                <X size={16} style={{ cursor: 'pointer' }} onClick={() => setAuthError(null)} />
              </div>
            )}
            <a href="/api/auth/google" className="btn btn-oauth">
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Connect Google Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'expired') {
    return (
      <div className="app-container">
        <Header connectionStatus={connectionStatus} isLoadingEvents={isLoadingEvents} />

        <div className="onboarding-container">
          <div className="reconnect-card">
            <div className="onboarding-icon" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)' }}>
              <AlertCircle size={36} />
            </div>
            <h3>Calendar Connection Expired</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your Google OAuth token has expired or security credentials were changed. Please reconnect to continue syncing.
            </p>
            <a href="/api/auth/google" className="btn btn-primary" style={{ padding: '0.8rem' }}>
              Reconnect Google Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header 
        connectionStatus={connectionStatus} 
        isLoadingEvents={isLoadingEvents} 
        onSync={checkConnection}
        onOpenPreferences={() => setIsSettingsModalOpen(true)}
      />

      <div className="dashboard-grid">
        <TaskManager 
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />

        <CalendarView 
          events={events}
          suggestions={suggestions}
          isLoadingEvents={isLoadingEvents}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentWeekStart={currentWeekStart}
          onNavigateWeek={navigateWeek}
          onNavigateToday={navigateToday}
          onOpenEditModal={openEditModal}
          onDeleteEvent={handleDeleteCalendarEvent}
          errorMessage={errorMessage}
          onCloseError={() => setErrorMessage(null)}
        />

        <AISuggestionConsole 
          tasks={tasks}
          suggestions={suggestions}
          isPlanning={isPlanning}
          isSavingPlan={isSavingPlan}
          planningAttempted={planningAttempted}
          onGeneratePlan={handleGeneratePlan}
          onCommitPlan={handleCommitPlan}
        />
      </div>

      {editingEvent && (
        <EditEventModal 
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdate={handleUpdateCalendarEvent}
          onDelete={handleDeleteCalendarEvent}
        />
      )}

      {readOnlyEvent && (
        <ReadOnlyEventModal 
          event={readOnlyEvent}
          onClose={() => setReadOnlyEvent(null)}
        />
      )}

      {isSettingsModalOpen && (
        <PreferencesModal 
          preferences={preferences}
          onClose={() => setIsSettingsModalOpen(false)}
          onChange={savePreferences}
        />
      )}
    </div>
  );
}
