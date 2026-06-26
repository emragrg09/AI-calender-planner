export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO date-time string
  end: string;   // ISO date-time string
  isAllDay?: boolean;
  createdBy?: string; // 'ai-calendar-planner' or undefined
}

export interface FreeTimeSlot {
  start: string; // ISO date-time string
  end: string;   // ISO date-time string
  durationMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string; // YYYY-MM-DD format or ISO date
  estimatedDuration: number; // in minutes
  completed: boolean;
}

export interface BreakTime {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  label: string;
}

export interface UserPreferences {
  timezone: string;
  workingHoursStart: string; // HH:MM format
  workingHoursEnd: string;   // HH:MM format
  breakTimes: BreakTime[];
  focusSessionDuration: number; // in minutes
}

export interface AISuggestion {
  id: string;
  taskId: string;
  title: string;
  start: string; // ISO date-time string
  end: string;   // ISO date-time string
  priority: 'low' | 'medium' | 'high';
  duration: number; // in minutes
  reason?: string;
}
