'use client';

import React from 'react';
import { Settings, X } from 'lucide-react';
import { UserPreferences, BreakTime } from '@/types/calendar';

interface PreferencesModalProps {
  preferences: UserPreferences;
  onClose: () => void;
  onChange: (updatedPrefs: UserPreferences) => void;
}

export default function PreferencesModal({
  preferences,
  onClose,
  onChange
}: PreferencesModalProps) {
  const handleAddBreak = () => {
    const updatedPrefs = {
      ...preferences,
      breakTimes: [...preferences.breakTimes, { start: '15:00', end: '15:15', label: 'Coffee Break' }]
    };
    onChange(updatedPrefs);
  };

  const handleRemoveBreak = (index: number) => {
    const updatedBreaks = preferences.breakTimes.filter((_, idx) => idx !== index);
    const updatedPrefs = { ...preferences, breakTimes: updatedBreaks };
    onChange(updatedPrefs);
  };

  const handleUpdateBreak = (index: number, key: keyof BreakTime, value: string) => {
    const updatedBreaks = preferences.breakTimes.map((brk, idx) => 
      idx === index ? { ...brk, [key]: value } : brk
    );
    const updatedPrefs = { ...preferences, breakTimes: updatedBreaks };
    onChange(updatedPrefs);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <Settings size={18} style={{ color: 'var(--color-primary)', marginRight: '6px' }} />
            Planning Preferences
          </span>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-row">
            <div className="form-group">
              <label>Working Hours Start</label>
              <input 
                type="time" 
                className="input-control" 
                value={preferences.workingHoursStart}
                onChange={(e) => onChange({ ...preferences, workingHoursStart: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Working Hours End</label>
              <input 
                type="time" 
                className="input-control" 
                value={preferences.workingHoursEnd}
                onChange={(e) => onChange({ ...preferences, workingHoursEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Focus Session Target Duration (mins)</label>
            <input 
              type="number" 
              className="input-control" 
              min="30"
              max="180"
              step="15"
              value={preferences.focusSessionDuration}
              onChange={(e) => onChange({ ...preferences, focusSessionDuration: Number(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Daily Recurrent Breaks</label>
              <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddBreak}>
                + Add Break
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {preferences.breakTimes.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                  No breaks scheduled. Add breaks above.
                </div>
              ) : (
                preferences.breakTimes.map((brk, idx) => (
                  <div className="break-item-row" key={idx}>
                    <input 
                      type="text" 
                      className="input-control"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', flexGrow: 1 }}
                      value={brk.label}
                      onChange={(e) => handleUpdateBreak(idx, 'label', e.target.value)}
                    />
                    <input 
                      type="time" 
                      className="input-control"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '85px' }}
                      value={brk.start}
                      onChange={(e) => handleUpdateBreak(idx, 'start', e.target.value)}
                    />
                    <span>to</span>
                    <input 
                      type="time" 
                      className="input-control"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '85px' }}
                      value={brk.end}
                      onChange={(e) => handleUpdateBreak(idx, 'end', e.target.value)}
                    />
                    <button 
                      className="btn btn-secondary btn-icon-only"
                      style={{ border: 'none', background: 'transparent', width: '20px', height: '20px', color: 'var(--color-danger)' }}
                      onClick={() => handleRemoveBreak(idx)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
