'use client';

import React from 'react';
import { Calendar as CalendarIcon, RefreshCw, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'loading' | 'connected' | 'disconnected' | 'expired';
  isLoadingEvents: boolean;
  onSync?: () => void;
  onOpenPreferences?: () => void;
}

export default function Header({
  connectionStatus,
  isLoadingEvents,
  onSync,
  onOpenPreferences
}: HeaderProps) {
  return (
    <header className="header">
      <div className="logo-section">
        <CalendarIcon 
          className={connectionStatus === 'disconnected' ? 'sync-spinner' : ''} 
          style={{ color: 'var(--color-primary)' }} 
        />
        <h1>AI Calendar Planner</h1>
        {connectionStatus === 'connected' && <span className="logo-badge">Connected</span>}
        {connectionStatus === 'disconnected' && <span className="logo-badge">Pro</span>}
      </div>
      
      {connectionStatus === 'connected' && (
        <div className="header-actions">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onSync} 
            disabled={isLoadingEvents}
          >
            <RefreshCw size={14} className={isLoadingEvents ? 'spin' : ''} />
            Sync Calendar
          </button>
          
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onOpenPreferences}
          >
            <Settings size={14} />
            Preferences
          </button>

          <a href="/api/auth/google/disconnect" className="btn btn-danger btn-sm">
            <LogOut size={14} />
            Disconnect
          </a>
        </div>
      )}
    </header>
  );
}
