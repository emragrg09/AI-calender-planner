'use client';

import React from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';

interface ReadOnlyEventModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export default function ReadOnlyEventModal({
  event,
  onClose
}: ReadOnlyEventModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={18} style={{ color: 'var(--color-event-personal)' }} />
            Personal Calendar Event
          </span>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
              {event.summary}
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ⏰ {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
            </span>
          </div>

          {event.description && (
            <div>
              <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Description</h5>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {event.description}
              </p>
            </div>
          )}

          <div 
            className="preview-banner" 
            style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.2)', 
              color: '#93c5fd', 
              margin: 0 
            }}
          >
            💡 This is a personal Google Calendar event. For safety and respect of your commitments, this app cannot edit or delete personal events.
          </div>

          <div className="modal-footer" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
