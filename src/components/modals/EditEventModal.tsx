'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';

interface EditEventModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: (updatedData: { summary: string; description: string; start: string; end: string }) => void;
  onDelete: (id: string) => void;
}

export default function EditEventModal({
  event,
  onClose,
  onUpdate,
  onDelete
}: EditEventModalProps) {
  const [summary, setSummary] = useState(event.summary);
  const [description, setDescription] = useState(event.description || '');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    setSummary(event.summary);
    setDescription(event.description || '');
    // Convert to ISO string format suitable for datetime-local input
    try {
      setStart(new Date(event.start).toISOString().slice(0, 16));
      setEnd(new Date(event.end).toISOString().slice(0, 16));
    } catch (e) {
      // Fallback in case of invalid date formatting
      setStart('');
      setEnd('');
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      summary,
      description,
      start,
      end
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <Edit3 size={18} style={{ color: 'var(--color-primary)', marginRight: '6px' }} />
            Edit App Event
          </span>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Event Title</label>
            <input 
              type="text" 
              className="input-control"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Start Date & Time</label>
            <input 
              type="datetime-local" 
              className="input-control"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>End Date & Time</label>
            <input 
              type="datetime-local" 
              className="input-control"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              className="input-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-danger"
              onClick={() => onDelete(event.id)}
            >
              Delete Event
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
