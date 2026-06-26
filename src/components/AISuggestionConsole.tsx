'use client';

import React from 'react';
import { Sparkles, RefreshCw, Info, Check } from 'lucide-react';
import { Task, AISuggestion } from '@/types/calendar';

interface AISuggestionConsoleProps {
  tasks: Task[];
  suggestions: AISuggestion[];
  isPlanning: boolean;
  isSavingPlan: boolean;
  planningAttempted: boolean;
  onGeneratePlan: () => void;
  onCommitPlan: () => void;
}

export default function AISuggestionConsole({
  tasks,
  suggestions,
  isPlanning,
  isSavingPlan,
  planningAttempted,
  onGeneratePlan,
  onCommitPlan
}: AISuggestionConsoleProps) {
  const hasIncompleteTasks = tasks.some(t => !t.completed);

  return (
    <aside className="suggestion-sidebar">
      <div className="section-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="section-title">
          <Sparkles size={18} style={{ color: 'var(--color-event-suggested)' }} />
          AI Planning Assistant
        </span>
      </div>

      <div className="section-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-event-suggested))' }}
          onClick={onGeneratePlan}
          disabled={isPlanning || !hasIncompleteTasks}
        >
          {isPlanning ? (
            <>
              <RefreshCw className="spin" size={16} /> Analyzing free slots...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate AI Suggestions
            </>
          )}
        </button>

        {planningAttempted && suggestions.length > 0 && (
          <div className="preview-banner" style={{ marginTop: '1rem' }}>
            <strong>AI Plan Preview:</strong> Check the dashed pink blocks on the calendar. Click "Save Suggestions" to commit them to your Google Calendar.
          </div>
        )}

        <div style={{ marginTop: '1rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            Suggested Blocks ({suggestions.length})
          </h4>
          
          <div className="suggestion-list">
            {isPlanning ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ height: '70px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px' }} />
                <div style={{ height: '70px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px' }} />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="empty-state">
                <Info size={24} />
                <p>No active suggestions.</p>
                <p style={{ fontSize: '0.75rem' }}>Add incomplete manual tasks and click "Generate AI Suggestions" above to calculate optimized slots.</p>
              </div>
            ) : (
              suggestions.map(s => {
                const sStart = new Date(s.start);
                const sEnd = new Date(s.end);
                const dateStr = sStart.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
                const timeStr = `${sStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${sEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

                return (
                  <div className="suggestion-card" key={s.id}>
                    <div className="suggestion-card-header">
                      <span className="suggestion-card-title">{s.title}</span>
                      <span className={`priority-tag priority-${s.priority}`} style={{ transform: 'scale(0.85)' }}>
                        {s.priority}
                      </span>
                    </div>
                    <span className="suggestion-card-time">
                      📅 {dateStr} at {timeStr} ({s.duration}m)
                    </span>
                    {s.reason && (
                      <span className="suggestion-card-reason">
                        💡 {s.reason}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {suggestions.length > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={onCommitPlan}
                disabled={isSavingPlan}
              >
                {isSavingPlan ? (
                  <>
                    <RefreshCw className="spin" size={16} /> Creating Google events...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Add Suggested to Calendar
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
