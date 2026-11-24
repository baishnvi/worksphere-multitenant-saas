'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: 'border-slate-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-400' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'border-amber-400' },
  { id: 'DONE', label: 'Done', color: 'border-emerald-400' },
];

export default function KanbanPage() {
  const { activeRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New task form state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const fetchTasks = async (projId?: string) => {
    try {
      const pId = projId || selectedProjectId;
      const res = await api.get(`/tasks?projectId=${pId}`);
      if (res.data?.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/projects').then((res) => {
      const projs = res.data?.data || [];
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
        fetchTasks(projs[0].id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleStatusChange = async (task: any, nextStatus: string) => {
    setConflictMessage(null);
    setSuccessMessage(null);

    try {
      // Send OCC expectedVersion
      const res = await api.patch(`/tasks/${task.id}`, {
        status: nextStatus,
        expectedVersion: task.version,
      });

      if (res.data?.success) {
        setSuccessMessage(`Task updated to ${nextStatus} (Version advanced to v${res.data.data.version})`);
        fetchTasks();
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictMessage(
          `409 Concurrency Conflict! ${err.response.data?.error?.message} (Server is on v${err.response.data?.error?.details?.currentVersion})`
        );
        fetchTasks();
      } else {
        alert(err.response?.data?.error?.message || 'Error updating task');
      }
    }
  };

  /**
   * Capstone Challenge Demonstration:
   * Deliberately passes a stale version (expectedVersion: 0 or stale)
   * to prove that silent overwrites are blocked by OCC!
   */
  const handleSimulateConflict = async (task: any) => {
    setConflictMessage(null);
    setSuccessMessage(null);
    try {
      const staleVersion = task.version - 1; // Out-of-date version simulation
      await api.patch(`/tasks/${task.id}`, {
        status: 'DONE',
        expectedVersion: staleVersion,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictMessage(
          `✅ Capstone OCC Triggered (409 Conflict): ${err.response.data?.error?.message}`
        );
      } else {
        alert(err.response?.data?.error?.message || 'Error simulating conflict');
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      await api.post('/tasks', {
        projectId: selectedProjectId,
        title: newTitle,
        priority: newPriority,
        status: 'TODO',
      });
      setShowModal(false);
      setNewTitle('');
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error creating task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban Board & Concurrency Control</h1>
          <p className="text-sm text-slate-500">
            Real-time Task Pipeline with Optimistic Concurrency Control (OCC) Version Guard
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                fetchTasks(e.target.value);
              }}
              aria-label="Select Project"
              className="bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          )}

          {activeRole !== 'AUDITOR' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {conflictMessage && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-3 text-amber-900 shadow-sm animate-pulse">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Optimistic Concurrency Protection: </span>
            {conflictMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start space-x-3 text-emerald-900 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{successMessage}</div>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-100 rounded-xl p-4 border border-slate-200 min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-slate-800">{col.label}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200 shadow-xs">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {task.priority}
                      </span>
                      {/* OCC Version Tag */}
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        v{task.version} (OCC)
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{task.assignee ? `${task.assignee.firstName}` : 'Unassigned'}</span>

                      {/* Action buttons */}
                      {activeRole !== 'AUDITOR' && (
                        <div className="flex items-center space-x-1">
                          {col.id !== 'DONE' && (
                            <button
                              onClick={() => {
                                const nextMap: any = {
                                  TODO: 'IN_PROGRESS',
                                  IN_PROGRESS: 'IN_REVIEW',
                                  IN_REVIEW: 'DONE',
                                };
                                handleStatusChange(task, nextMap[col.id]);
                              }}
                              title="Advance Status"
                              className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSimulateConflict(task)}
                            title="Simulate Concurrent 409 Conflict"
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                          >
                            Simulate 409
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 italic">
                    No tasks in this lane
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement Webhook Dispatcher"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
