import { useState } from 'react';
import { Trash2, CheckCircle2, Circle, Clock, ArrowUpRight, ArrowDownRight, ArrowUpLeft, ArrowDownLeft, Grid3X3, Plus, Pencil, X, Check } from 'lucide-react';
import { Task, TaskStatus, Priority, LifeArea, AREA_CONFIG, PRIORITY_CONFIG } from '../types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface EisenhowerViewProps {
  tasks: Task[];
  onAdd: (title: string, description: string, priority: Priority, dueDate: string | null, area: LifeArea) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

interface QuadrantConfig {
  key: Quadrant;
  title: string;
  subtitle: string;
  action: string;
  priority: Priority;
  icon: React.ReactNode;
  bgCard: string;
  borderAccent: string;
  headerBg: string;
  headerText: string;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    key: 'do', title: 'Hacer', subtitle: 'Urgente + Importante', action: '🔥 Hazlo ahora', priority: 'urgent',
    icon: <ArrowUpLeft size={18} />, bgCard: 'bg-white dark:bg-gray-800',
    borderAccent: 'border-red-200 dark:border-red-900/40', headerBg: 'bg-red-50 dark:bg-red-900/20', headerText: 'text-red-700 dark:text-red-400',
  },
  {
    key: 'schedule', title: 'Planificar', subtitle: 'Importante + No urgente', action: '📅 Programa una fecha', priority: 'high',
    icon: <ArrowUpRight size={18} />, bgCard: 'bg-white dark:bg-gray-800',
    borderAccent: 'border-sky-200 dark:border-sky-900/40', headerBg: 'bg-sky-50 dark:bg-sky-900/20', headerText: 'text-sky-700 dark:text-sky-400',
  },
  {
    key: 'delegate', title: 'Delegar', subtitle: 'Urgente + No importante', action: '🤝 ¿Puedes delegarlo?', priority: 'medium',
    icon: <ArrowDownLeft size={18} />, bgCard: 'bg-white dark:bg-gray-800',
    borderAccent: 'border-amber-200 dark:border-amber-900/40', headerBg: 'bg-amber-50 dark:bg-amber-900/20', headerText: 'text-amber-700 dark:text-amber-400',
  },
  {
    key: 'eliminate', title: 'Eliminar', subtitle: 'No urgente + No importante', action: '🗑️ ¿Es necesario?', priority: 'low',
    icon: <ArrowDownRight size={18} />, bgCard: 'bg-white dark:bg-gray-800',
    borderAccent: 'border-gray-200 dark:border-gray-700', headerBg: 'bg-gray-50 dark:bg-gray-700/50', headerText: 'text-gray-500 dark:text-gray-400',
  },
];

function classifyTask(task: Task): Quadrant {
  if (task.priority === 'urgent') return 'do';
  if (task.priority === 'high') return 'schedule';
  if (task.priority === 'medium') return 'delegate';
  return 'eliminate';
}

export function EisenhowerView({ tasks, onAdd, onUpdateTask, onUpdateStatus, onDelete }: EisenhowerViewProps) {
  const [addingToQuadrant, setAddingToQuadrant] = useState<Quadrant | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newArea, setNewArea] = useState<LifeArea>('personal');
  const [newDueDate, setNewDueDate] = useState('');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editArea, setEditArea] = useState<LifeArea>('personal');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');

  const today = startOfDay(new Date());
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const getQuadrantTasks = (quadrant: Quadrant) =>
    pendingTasks.filter(t => classifyTask(t) === quadrant);

  const cycleStatus = (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      'pending': 'in-progress', 'in-progress': 'completed', 'completed': 'pending',
    };
    onUpdateStatus(task.id, next[task.status]);
  };

  const handleAdd = (quadrant: Quadrant) => {
    if (!newTitle.trim()) return;
    const q = QUADRANTS.find(q => q.key === quadrant)!;
    onAdd(newTitle.trim(), newDescription.trim(), q.priority, newDueDate || null, newArea);
    resetAddForm();
  };

  const resetAddForm = () => {
    setAddingToQuadrant(null);
    setNewTitle('');
    setNewDescription('');
    setNewArea('personal');
    setNewDueDate('');
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditArea(task.area);
    setEditDueDate(task.dueDate || '');
    setEditPriority(task.priority);
  };

  const saveEdit = () => {
    if (!editingTaskId || !editTitle.trim()) return;
    onUpdateTask(editingTaskId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      area: editArea,
      dueDate: editDueDate || null,
      priority: editPriority,
    });
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditArea('personal');
    setEditDueDate('');
    setEditPriority('medium');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <Grid3X3 size={24} className="text-gray-400" />
          Matriz de Eisenhower
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {pendingTasks.length} pendientes · {completedCount} completadas — Haz clic en + para añadir o ✏️ para editar
        </p>
      </div>

      {/* Axis Labels */}
      <div className="relative">
        <div className="hidden lg:flex absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 items-center gap-2 text-xs text-gray-300 dark:text-gray-600 font-medium tracking-wider whitespace-nowrap">
          IMPORTANCIA ↑
        </div>
        <div className="hidden lg:flex justify-center -mb-2 text-xs text-gray-300 dark:text-gray-600 font-medium tracking-wider">
          URGENCIA →
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:pl-4">
          {QUADRANTS.map(q => {
            const quadrantTasks = getQuadrantTasks(q.key);

            return (
              <div
                key={q.key}
                className={cn('rounded-2xl border overflow-hidden transition-all min-h-[220px]', q.bgCard, q.borderAccent)}
              >
                {/* Header */}
                <div className={cn('px-4 py-3 flex items-center justify-between', q.headerBg)}>
                  <div className="flex items-center gap-2">
                    <span className={q.headerText}>{q.icon}</span>
                    <div>
                      <h3 className={cn('font-semibold text-sm', q.headerText)}>{q.title}</h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{q.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', q.headerBg, q.headerText)}>
                      {quadrantTasks.length}
                    </span>
                    <button
                      onClick={() => { resetAddForm(); setAddingToQuadrant(q.key); }}
                      className={cn('p-1 rounded-lg transition-colors', q.headerText, 'hover:bg-white/50 dark:hover:bg-gray-700/50')}
                      title="Añadir tarea"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Add form */}
                {addingToQuadrant === q.key && (
                  <div className="m-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2 animate-in">
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      placeholder="Título..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700 dark:text-gray-200 placeholder:text-gray-300"
                      autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd(q.key)}
                    />
                    <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
                      placeholder="Descripción..." rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none resize-none text-gray-700 dark:text-gray-200 placeholder:text-gray-300"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                        <button key={key} type="button" onClick={() => setNewArea(key)}
                          className={cn('text-[10px] px-2 py-1 rounded-full font-medium transition-all border',
                            newArea === key ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'border-gray-100 dark:border-gray-600 text-gray-400'
                          )}>
                          {cfg.emoji} {cfg.label}
                        </button>
                      ))}
                    </div>
                    <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAdd(q.key)}
                        className="flex-1 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                        Añadir
                      </button>
                      <button onClick={resetAddForm}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Tasks */}
                <div className="p-3 space-y-1.5">
                  {quadrantTasks.map(task => {
                    const isOverdue = task.dueDate && isBefore(parseISO(task.dueDate), today);
                    const isEditing = editingTaskId === task.id;

                    if (isEditing) {
                      return (
                        <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2 animate-in">
                          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700 dark:text-gray-200"
                            autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          />
                          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                            placeholder="Descripción..." rows={2}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none resize-none text-gray-700 dark:text-gray-200 placeholder:text-gray-300"
                          />
                          <div className="flex flex-wrap gap-1">
                            {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                              <button key={key} type="button" onClick={() => setEditPriority(key)}
                                className={cn('text-[10px] px-2 py-1 rounded-full font-medium transition-all border',
                                  editPriority === key ? cfg.bg + ' border-current' : 'border-gray-100 dark:border-gray-600 text-gray-400'
                                )}>
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                              <button key={key} type="button" onClick={() => setEditArea(key)}
                                className={cn('text-[10px] px-2 py-1 rounded-full font-medium transition-all border',
                                  editArea === key ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'border-gray-100 dark:border-gray-600 text-gray-400'
                                )}>
                                {cfg.emoji} {cfg.label}
                              </button>
                            ))}
                          </div>
                          <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300"
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEdit}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                              <Check size={12} /> Guardar
                            </button>
                            <button onClick={cancelEdit}
                              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={task.id}
                        className="flex items-start gap-2.5 p-3 rounded-xl border transition-all group border-gray-50 dark:border-gray-700 hover:border-gray-100 dark:hover:border-gray-600 bg-gray-50/30 dark:bg-gray-700/20"
                      >
                        <button onClick={() => cycleStatus(task)} className="mt-0.5 shrink-0">
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : task.status === 'in-progress' ? (
                            <Clock size={16} className="text-sky-400" />
                          ) : (
                            <Circle size={16} className="text-gray-200 dark:text-gray-600 hover:text-gray-400 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            task.status === 'completed' ? 'line-through text-gray-300 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                          )}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', AREA_CONFIG[task.area].bg, AREA_CONFIG[task.area].color)}>
                              {AREA_CONFIG[task.area].emoji} {AREA_CONFIG[task.area].label}
                            </span>
                            {task.dueDate && (
                              <span className={cn('text-[10px]', isOverdue ? 'text-red-400 font-medium' : 'text-gray-300 dark:text-gray-500')}>
                                📅 {format(parseISO(task.dueDate), 'd MMM', { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                            className="p-1.5 rounded-lg active:bg-white dark:active:bg-gray-600 text-gray-300 active:text-gray-500 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                            className="p-1.5 rounded-lg active:bg-red-50 dark:active:bg-red-900/20 text-gray-300 active:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {quadrantTasks.length === 0 && addingToQuadrant !== q.key && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-gray-300 dark:text-gray-600">{q.action}</p>
                      <p className="text-[10px] text-gray-200 dark:text-gray-700 mt-1">No hay tareas aquí</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100/50 dark:border-gray-700/50">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">📌 ¿Cómo se clasifican?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUADRANTS.map(q => (
            <div key={q.key} className="flex items-start gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', PRIORITY_CONFIG[q.priority].dot)} />
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{PRIORITY_CONFIG[q.priority].label} → {q.title}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{q.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
