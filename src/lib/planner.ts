import { CalendarEvent, FreeTimeSlot, Task, UserPreferences, AISuggestion } from '@/types/calendar';

interface TimeInterval {
  start: Date;
  end: Date;
}

/**
 * Parses a time string in HH:MM format relative to a specific date.
 */
function parseTimeString(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Generates suggestions for scheduling manual tasks in free slots.
 */
export function generateAISuggestions(
  events: CalendarEvent[],
  tasks: Task[],
  preferences: UserPreferences,
  startDateStr: string, // YYYY-MM-DD
  daysToPlan: number = 7
): { suggestions: AISuggestion[]; freeSlots: FreeTimeSlot[] } {
  
  const suggestions: AISuggestion[] = [];
  const startDay = new Date(startDateStr);
  startDay.setHours(0, 0, 0, 0);

  // 1. Generate list of occupied blocks (events, breaks, non-working hours) for the planning period
  const occupiedBlocks: TimeInterval[] = [];

  // Add Google Calendar events that overlap with our planning period
  const planStart = new Date(startDay);
  const planEnd = new Date(startDay);
  planEnd.setDate(planEnd.getDate() + daysToPlan);

  events.forEach(event => {
    const eStart = new Date(event.start);
    const eEnd = new Date(event.end);
    
    // Check if event falls inside planning window
    if (eStart < planEnd && eEnd > planStart) {
      occupiedBlocks.push({ start: eStart, end: eEnd });
    }
  });

  // For each day, add non-working hours and break times
  for (let i = 0; i < daysToPlan; i++) {
    const currentDay = new Date(startDay);
    currentDay.setDate(currentDay.getDate() + i);

    // Non-working hours: midnight to workingHoursStart
    const workStart = parseTimeString(currentDay, preferences.workingHoursStart);
    const midnight = new Date(currentDay);
    midnight.setHours(0, 0, 0, 0);
    occupiedBlocks.push({ start: midnight, end: workStart });

    // Non-working hours: workingHoursEnd to next midnight
    const workEnd = parseTimeString(currentDay, preferences.workingHoursEnd);
    const nextMidnight = new Date(currentDay);
    nextMidnight.setHours(23, 59, 59, 999);
    occupiedBlocks.push({ start: workEnd, end: nextMidnight });

    // Add daily breaks
    preferences.breakTimes.forEach(brk => {
      const brkStart = parseTimeString(currentDay, brk.start);
      const brkEnd = parseTimeString(currentDay, brk.end);
      occupiedBlocks.push({ start: brkStart, end: brkEnd });
    });
  }

  // 2. Merge overlapping occupied blocks and sort them
  const mergedOccupied = mergeIntervals(occupiedBlocks);

  // 3. Find free slots in the gaps between occupied blocks
  const freeSlots: FreeTimeSlot[] = [];
  let currentPointer = new Date(planStart);

  for (const block of mergedOccupied) {
    if (block.start > currentPointer) {
      const diffMs = block.start.getTime() - currentPointer.getTime();
      const durationMin = Math.floor(diffMs / 60000);
      
      // Only record slots longer than 15 minutes
      if (durationMin >= 15) {
        freeSlots.push({
          start: currentPointer.toISOString(),
          end: block.start.toISOString(),
          durationMinutes: durationMin,
        });
      }
    }
    if (block.end > currentPointer) {
      currentPointer = new Date(block.end);
    }
  }

  // Handle final free slot if pointer hasn't reached planEnd
  if (planEnd > currentPointer) {
    const diffMs = planEnd.getTime() - currentPointer.getTime();
    const durationMin = Math.floor(diffMs / 60000);
    if (durationMin >= 15) {
      freeSlots.push({
        start: currentPointer.toISOString(),
        end: planEnd.toISOString(),
        durationMinutes: durationMin,
      });
    }
  }

  // 4. Prioritize tasks
  // Sort by priority (high > medium > low), then by deadline (earlier first)
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  // 5. Place tasks in free slots (Simulated AI planning)
  // We make a mutable copy of free slots to track allocations
  const availableSlots = freeSlots.map(slot => ({
    start: new Date(slot.start),
    end: new Date(slot.end),
    durationMinutes: slot.durationMinutes,
  }));

  for (const task of sortedTasks) {
    let durationRemaining = task.estimatedDuration;
    let sessionCount = 1;

    // We can schedule a task in focus sessions if it's too long or if it fits in multiple chunks
    while (durationRemaining > 0) {
      const sessionDuration = Math.min(durationRemaining, preferences.focusSessionDuration);
      
      // Find the first free slot that can fit this session duration
      const slotIndex = availableSlots.findIndex(slot => slot.durationMinutes >= sessionDuration);
      
      if (slotIndex === -1) {
        // If we can't fit the full focus session, look for the largest available slot >= 15 mins
        const largestSlotIndex = availableSlots.reduce((maxIdx, slot, currIdx, arr) => {
          if (slot.durationMinutes >= 15 && (maxIdx === -1 || slot.durationMinutes > arr[maxIdx].durationMinutes)) {
            return currIdx;
          }
          return maxIdx;
        }, -1);

        if (largestSlotIndex === -1) {
          // No slots left at all
          break;
        }

        // Schedule what we can in this slot
        const slot = availableSlots[largestSlotIndex];
        const actualSchedDuration = Math.min(durationRemaining, slot.durationMinutes);
        
        const start = new Date(slot.start);
        const end = new Date(start.getTime() + actualSchedDuration * 60000);

        suggestions.push({
          id: `${task.id}-suggest-${sessionCount}`,
          taskId: task.id,
          title: `${task.title} (Part ${sessionCount})`,
          start: start.toISOString(),
          end: end.toISOString(),
          priority: task.priority,
          duration: actualSchedDuration,
          reason: `Scheduled in best available time window (${actualSchedDuration}m) due to priority.`,
        });

        // Deduct from slot
        slot.start = new Date(end.getTime() + 15 * 60000); // 15 min buffer before next scheduling
        const newDuration = Math.floor((slot.end.getTime() - slot.start.getTime()) / 60000);
        slot.durationMinutes = newDuration >= 0 ? newDuration : 0;

        durationRemaining -= actualSchedDuration;
        sessionCount++;
      } else {
        // Fits perfectly in this slot
        const slot = availableSlots[slotIndex];
        const start = new Date(slot.start);
        const end = new Date(start.getTime() + sessionDuration * 60000);

        suggestions.push({
          id: `${task.id}-suggest-${sessionCount}`,
          taskId: task.id,
          title: durationRemaining > preferences.focusSessionDuration 
            ? `${task.title} (Session ${sessionCount})`
            : task.title,
          start: start.toISOString(),
          end: end.toISOString(),
          priority: task.priority,
          duration: sessionDuration,
          reason: `Scheduled for optimal focus session (${sessionDuration}m) matching working hours.`,
        });

        // Deduct from slot
        slot.start = new Date(end.getTime() + 15 * 60000); // Add a 15-minute break/buffer after a focus session
        const newDuration = Math.floor((slot.end.getTime() - slot.start.getTime()) / 60000);
        slot.durationMinutes = newDuration >= 0 ? newDuration : 0;

        durationRemaining -= sessionDuration;
        sessionCount++;
      }
    }
  }

  return {
    suggestions,
    freeSlots,
  };
}

/**
 * Merges overlapping and adjacent time intervals, and sorts them.
 */
function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  // Sort by start date
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    if (current.start <= lastMerged.end) {
      // Overlap, merge them
      if (current.end > lastMerged.end) {
        lastMerged.end = current.end;
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}
