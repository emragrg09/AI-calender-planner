'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Clock, CalendarCheck } from 'lucide-react';
import { Task } from '@/types/calendar';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskManager({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask
}: TaskManagerProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDuration, setNewTaskDuration] = useState(60); // 1 hour default
  const [newTaskDeadline, setNewTaskDeadline] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      estimatedDuration: Number(newTaskDuration),
      deadline: newTaskDeadline,
      completed: false
    });

    // Reset input fields
    setNewTaskTitle('');
    setNewTaskDuration(60);
    // Keep deadline as tomorrow
  };

  return (
    <aside className="sidebar">
      <div className="section-header">
        <span className="section-title">
          <CalendarCheck size={18} style={{ color: 'var(--color-primary)' }} />
          Task Manager
        </span>
      </div>

      <div className="section-body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label>Task Title</label>
            <input 
              type="text" 
              className="input-control" 
              placeholder="What needs to be planned?" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select 
              className="input-control" 
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="high">🔥 High Priority</option>
              <option value="medium">⚡ Medium Priority</option>
              <option value="low">🌱 Low Priority</option>
            </select>
          </div>

          <div className="input-row">
            <div className="form-group">
              <label>Duration (mins)</label>
              <input 
                type="number" 
                className="input-control" 
                min="15" 
                step="15"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                required 
              />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input 
                type="date" 
                className="input-control"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
            <Plus size={16} /> Add Task
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            Manually Added Tasks ({tasks.filter(t => !t.completed).length})
          </h4>
          <div className="task-list">
            {tasks.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No tasks added yet. Add tasks above.
              </div>
            ) : (
              tasks.map(task => (
                <div className="task-item" key={task.id}>
                  <input 
                    type="checkbox" 
                    className="task-checkbox" 
                    checked={task.completed} 
                    onChange={() => onToggleTask(task.id)}
                  />
                  <div className="task-details">
                    <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                    <div className="task-meta">
                      <span className={`priority-tag priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} /> {task.estimatedDuration}m
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary btn-icon-only" 
                    style={{ width: '24px', height: '24px', color: 'var(--color-danger)', border: 'none', background: 'transparent' }}
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
