import { useState, useRef } from 'react';
import { GripVertical, Trash2, Pin, PinOff, Plus, Pencil, X, Check } from 'lucide-react';
import { Task, TaskStatus, Priority, LifeArea, AREA_CONFIG, PRIORITY_CONFIG } from '../types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface KanbanViewProps {
  tasks: Task[];
  onAdd: (title: string, description: string, priority: Priority, dueDate: string | null, area: LifeArea) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const COLUMNS: { status: TaskStatus; label: string; emoji: string; emptyLabel: string; accent: string; dotColor: string }[] = [
  { status: 'pending', label: 'Pendientes', emoji: '⏳', emptyLabel: 'Sin tareas pendientes', accent: 'border-t-gray-300 dark:border-t-gray-500', dotColor: 'bg-gray-300' },
  { status: 'in-progress', label: 'En progreso', emoji: '🔄', emptyLabel: 'Nada en progreso', accent: 'border-t-sky-400', dotColor: 'bg-sky-400' },
  { status: 'completed', label: 'Completadas', emoji: '✅', emptyLabel: 'Nada completado', accent: 'border-t-emerald-400', dotColor: 'bg-emerald-400' },
];

export function KanbanView({ tasks, onAdd, onUpdateTask, onUpdateStatus, onDelete, onTogglePin }: KanbanViewProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const dragCounter = useRef<Record<string, number>>({});
  const [mobileTab, setMobileTab] = useState<TaskStatus>('pending');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newArea, setNewArea] = useState<LifeArea>('personal');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editArea, setEditArea] = useState<LifeArea>('personal');
  const [editDueDate, setEditDueDate] = useState('');

  const today = startOfDay(new Date());

  const getColumnTasks = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const p: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return p[a.priority] - p[b.priority];
    });
  };

  // Drag & drop (desktop only)
  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId);
  const handleDragEnter = (status: TaskStatus) => { if (!dragCounter.current[status]) dragCounter.current[status] = 0; dragCounter.current[status]++; setDragOverColumn(status); };
  const handleDragLeave = (status: TaskStatus) => { dragCounter.current[status]--; if (dragCounter.current[status] === 0 && dragOverColumn === status) setDragOverColumn(null); };
  const handleDrop = (status: TaskStatus) => { if (draggedTaskId) { const t = tasks.find(x => x.id === draggedTaskId); if (t && t.status !== status) onUpdateStatus(draggedTaskId, status); } setDraggedTaskId(null); setDragOverColumn(null); dragCounter.current = {}; };
  const handleDragEnd = () => { setDraggedTaskId(null); setDragOverColumn(null); dragCounter.current = {}; };

  const handleAdd = (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim(), '', newPriority, null, newArea);
    if (status !== 'pending') setTimeout(() => { const t = tasks[tasks.length]; if (t) onUpdateStatus(t.id, status); }, 50);
    setAddingToColumn(null); setNewTitle(''); setNewPriority('medium'); setNewArea('personal');
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id); setEditTitle(task.title); setEditPriority(task.priority); setEditArea(task.area); setEditDueDate(task.dueDate || '');
    setExpandedTask(null);
  };

  const saveEdit = () => {
    if (!editingTaskId || !editTitle.trim()) return;
    onUpdateTask(editingTaskId, { title: editTitle.trim(), priority: editPriority, area: editArea, dueDate: editDueDate || null });
    setEditingTaskId(null);
  };

  const renderColumn = (col: typeof COLUMNS[0], isMobile = false) => {
    const columnTasks = getColumnTasks(col.status);
    const isOver = dragOverColumn === col.status;

    return (
      <div
        key={col.status}
        onDragOver={e => e.preventDefault()}
        onDragEnter={() => handleDragEnter(col.status)}
        onDragLeave={() => handleDragLeave(col.status)}
        onDrop={() => handleDrop(col.status)}
        className={cn(
          isMobile ? '' : 'bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl border-t-[3px]',
          !isMobile && col.accent,
          isOver && !isMobile && 'ring-2 ring-gray-300 dark:ring-gray-500'
        )}
      >
        {/* Column header — desktop only */}
        {!isMobile && (
          <div className="p-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{col.label}</h3>
              <span className="text-xs bg-white dark:bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-medium">{columnTasks.length}</span>
            </div>
            <button onClick={() => { setAddingToColumn(col.status); setNewTitle(''); }}
              className="p-2 rounded-lg active:bg-white dark:active:bg-gray-700 text-gray-400 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* Mobile add button */}
        {isMobile && addingToColumn !== col.status && (
          <button onClick={() => { setAddingToColumn(col.status); setNewTitle(''); }}
            className="w-full py-3 mb-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 text-sm font-medium flex items-center justify-center gap-1.5 active:bg-gray-50 dark:active:bg-gray-800">
            <Plus size={16} /> Añadir tarea
          </button>
        )}

        {/* Add form */}
        {addingToColumn === col.status && (
          <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2 animate-in">
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none text-gray-700 dark:text-gray-200" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd(col.status)} />
            <div className="flex flex-wrap gap-1">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setNewPriority(key)}
                  className={cn('text-[10px] px-2.5 py-1.5 rounded-full font-medium border transition-all',
                    newPriority === key ? cfg.bg + ' border-current' : 'border-gray-100 dark:border-gray-600 text-gray-400'
                  )}>{cfg.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAdd(col.status)}
                className="flex-1 px-3 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium active:scale-95">
                Añadir
              </button>
              <button onClick={() => setAddingToColumn(null)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-xl text-xs active:scale-95">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className={cn(isMobile ? 'space-y-2' : 'p-2 space-y-2 min-h-[200px]')}>
          {columnTasks.map(task => {
            const isOverdue = task.dueDate && isBefore(parseISO(task.dueDate), today) && task.status !== 'completed';
            const isDragging = draggedTaskId === task.id;
            const isEditing = editingTaskId === task.id;
            const isExpanded = expandedTask === task.id;

            if (isEditing) {
              return (
                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600 space-y-2 animate-in">
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                    onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                  <div className="flex flex-wrap gap-1">
                    {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setEditPriority(key)}
                        className={cn('text-[10px] px-2.5 py-1.5 rounded-full font-medium border transition-all',
                          editPriority === key ? cfg.bg + ' border-current' : 'border-gray-100 dark:border-gray-600 text-gray-400'
                        )}>{cfg.label}</button>
                    ))}
                  </div>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium active:scale-95">
                      <Check size={12} /> Guardar
                    </button>
                    <button onClick={() => setEditingTaskId(null)} className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-xl text-xs active:scale-95">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={task.id}>
                <div
                  draggable={!isMobile}
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className={cn(
                    'bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 transition-all',
                    !isMobile && 'cursor-grab active:cursor-grabbing hover:border-gray-200 dark:hover:border-gray-600',
                    isDragging && 'opacity-40 scale-95',
                    isOverdue && 'border-red-100 dark:border-red-900/30',
                    task.pinned && 'ring-1 ring-amber-200 dark:ring-amber-800'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!isMobile && <GripVertical size={14} className="text-gray-200 dark:text-gray-600 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {task.pinned && <Pin size={10} className="text-amber-400 shrink-0" />}
                        <p className={cn('text-sm font-medium truncate', task.status === 'completed' ? 'line-through text-gray-300 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200')}>
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', PRIORITY_CONFIG[task.priority].bg)}>{PRIORITY_CONFIG[task.priority].label}</span>
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', AREA_CONFIG[task.area].bg, AREA_CONFIG[task.area].color)}>{AREA_CONFIG[task.area].emoji}</span>
                        {task.dueDate && (
                          <span className={cn('text-[10px]', isOverdue ? 'text-red-400 font-medium' : 'text-gray-300 dark:text-gray-500')}>
                            {format(parseISO(task.dueDate), 'd MMM', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="flex gap-1.5 mt-1.5 animate-in">
                    <button onClick={() => startEditing(task)}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium active:scale-95">
                      <Pencil size={12} /> Editar
                    </button>
                    <button onClick={() => onTogglePin(task.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs font-medium active:scale-95 text-amber-500">
                      {task.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    </button>
                    {/* Move to other status — mobile */}
                    {isMobile && col.status !== 'pending' && (
                      <button onClick={() => { onUpdateStatus(task.id, 'pending'); setExpandedTask(null); }}
                        className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-400 active:scale-95">⏳</button>
                    )}
                    {isMobile && col.status !== 'in-progress' && (
                      <button onClick={() => { onUpdateStatus(task.id, 'in-progress'); setExpandedTask(null); }}
                        className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-sky-400 active:scale-95">🔄</button>
                    )}
                    {isMobile && col.status !== 'completed' && (
                      <button onClick={() => { onUpdateStatus(task.id, 'completed'); setExpandedTask(null); }}
                        className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-emerald-400 active:scale-95">✅</button>
                    )}
                    <button onClick={() => { onDelete(task.id); setExpandedTask(null); }}
                      className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 text-xs font-medium active:scale-95">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {columnTasks.length === 0 && addingToColumn !== col.status && (
            <div className="flex items-center justify-center h-24 text-gray-300 dark:text-gray-600 text-xs">
              {col.emptyLabel}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 md:space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Tablero Kanban</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          <span className="hidden md:inline">Arrastra tareas entre columnas · </span>Toca para ver acciones
        </p>
      </div>

      {/* Mobile: Tab navigation */}
      <div className="md:hidden">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-3">
          {COLUMNS.map(col => {
            const count = getColumnTasks(col.status).length;
            return (
              <button key={col.status} onClick={() => setMobileTab(col.status)}
                className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all',
                  mobileTab === col.status
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                    : 'text-gray-400 dark:text-gray-500'
                )}>
                <span>{col.emoji}</span>
                <span className="hidden min-[400px]:inline">{col.label}</span>
                <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-[10px] font-bold flex items-center justify-center text-gray-500 dark:text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>
        {COLUMNS.filter(c => c.status === mobileTab).map(col => renderColumn(col, true))}
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden md:grid grid-cols-3 gap-4 min-h-[60vh]">
        {COLUMNS.map(col => renderColumn(col, false))}
      </div>
    </div>
  );
}
