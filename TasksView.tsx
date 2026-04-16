import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Search, ListTodo, Pin, PinOff, ChevronDown, X } from 'lucide-react';
import { Task, Priority, TaskStatus, LifeArea, AREA_CONFIG, PRIORITY_CONFIG } from '../types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface TasksViewProps {
  tasks: Task[];
  onAdd: (title: string, description: string, priority: Priority, dueDate: string | null, area: LifeArea) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En progreso' },
  { value: 'completed', label: 'Completada' },
];

export function TasksView({ tasks, onAdd, onUpdateStatus, onDelete, onTogglePin }: TasksViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [area, setArea] = useState<LifeArea>('personal');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const today = startOfDay(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim(), priority, dueDate || null, area);
    setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setArea('personal');
    setShowForm(false);
  };

  const filteredTasks = tasks
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<TaskStatus, number> = { pending: 0, 'in-progress': 1, completed: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const cycleStatus = (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = { 'pending': 'in-progress', 'in-progress': 'completed', 'completed': 'pending' };
    onUpdateStatus(task.id, next[task.status]);
  };

  const activeFilters = (filterStatus !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0);

  return (
    <div className="space-y-3 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Mis tareas</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {tasks.filter(t => t.status !== 'completed').length} pendientes · {tasks.filter(t => t.status === 'completed').length} completadas
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Nueva tarea</span><span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Form — bottom sheet on mobile */}
      {showForm && (
        <>
          {/* Mobile overlay */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowForm(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slideUp"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-600" />
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Nueva tarea</h3>
                  <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700">
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué necesitas hacer?" autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-base focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 text-gray-700 dark:text-gray-200" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-base focus:outline-none resize-none text-gray-700 dark:text-gray-200" />
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Prioridad</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setPriority(key)}
                        className={cn('py-3 rounded-xl text-xs font-medium border transition-all text-center',
                          priority === key ? cfg.bg + ' border-current font-semibold' : 'border-gray-100 dark:border-gray-600 text-gray-400'
                        )}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Ámbito</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setArea(key)}
                        className={cn('py-3 rounded-xl text-xs font-medium border transition-all',
                          area === key ? `${cfg.bg} ${cfg.color} ${cfg.border} font-semibold` : 'border-gray-100 dark:border-gray-600 text-gray-400'
                        )}>
                        {cfg.emoji} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Fecha límite</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-base text-gray-600 dark:text-gray-300" />
                </div>
                <button type="submit" className="w-full py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                  Crear tarea
                </button>
              </form>
            </div>
          </div>
          {/* Desktop form */}
          <form onSubmit={handleSubmit} className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4 animate-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué necesitas hacer?" autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 text-gray-700 dark:text-gray-200" />
              </div>
              <div className="col-span-2">
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles adicionales..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none resize-none text-gray-700 dark:text-gray-200" />
              </div>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <select value={area} onChange={e => setArea(e.target.value as LifeArea)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
                {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
                ))}
              </select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium">Crear tarea</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        </>
      )}

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2.5 md:py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none text-gray-600 dark:text-gray-300" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-1.5 px-3 py-2.5 md:py-2 rounded-xl border text-sm font-medium transition-all',
            showFilters || activeFilters > 0
              ? 'border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800'
              : 'border-gray-200 dark:border-gray-600 text-gray-400'
          )}>
          <ChevronDown size={14} className={cn('transition-transform', showFilters && 'rotate-180')} />
          Filtros{activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] flex items-center justify-center font-bold">{activeFilters}</span>}
        </button>
      </div>

      {/* Filters — collapsible */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 animate-in">
          {/* Status filter as pills */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterStatus('all')}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-all', filterStatus === 'all' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
              Todos
            </button>
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setFilterStatus(s.value)}
                className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-all', filterStatus === s.value ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
                {s.label}
              </button>
            ))}
          </div>
          {/* Priority pills */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterPriority('all')}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-all', filterPriority === 'all' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
              Todas
            </button>
            {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setFilterPriority(key)}
                className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-all', filterPriority === key ? cfg.bg + ' font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {sortedTasks.map(task => {
          const pConfig = PRIORITY_CONFIG[task.priority];
          const aConfig = AREA_CONFIG[task.area];
          const isOverdue = task.dueDate && isBefore(parseISO(task.dueDate), today) && task.status !== 'completed';
          const isExpanded = expandedTask === task.id;

          return (
            <div key={task.id}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-xl border transition-all',
                task.status === 'completed' ? 'border-gray-50 dark:border-gray-700/50 opacity-50' :
                isOverdue ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-gray-700',
                task.pinned && task.status !== 'completed' && 'ring-1 ring-amber-200 dark:ring-amber-800'
              )}
            >
              <div className="flex items-start gap-3 p-3.5 md:p-4"
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                {/* Status toggle */}
                <button onClick={(e) => { e.stopPropagation(); cycleStatus(task); }}
                  className="mt-0.5 shrink-0 p-0.5">
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={22} className="text-emerald-400" />
                  ) : task.status === 'in-progress' ? (
                    <Clock size={22} className="text-sky-400" />
                  ) : (
                    <Circle size={22} className="text-gray-200 dark:text-gray-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.pinned && <Pin size={11} className="text-amber-400 shrink-0" />}
                    <p className={cn('text-sm font-medium', task.status === 'completed' ? 'line-through text-gray-300 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200')}>
                      {task.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', pConfig.bg)}>{pConfig.label}</span>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', aConfig.bg, aConfig.color)}>{aConfig.emoji} {aConfig.label}</span>
                    {task.dueDate && (
                      <span className={cn('text-[10px]', isOverdue ? 'text-red-400 font-medium' : 'text-gray-300 dark:text-gray-500')}>
                        📅 {format(parseISO(task.dueDate), "d MMM", { locale: es })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority dot indicator */}
                <div className={cn('w-2 h-2 rounded-full shrink-0 mt-2',
                  task.priority === 'urgent' ? 'bg-red-400 animate-pulse' : task.priority === 'high' ? 'bg-amber-400' : task.priority === 'medium' ? 'bg-sky-300' : 'bg-gray-200'
                )} />
              </div>

              {/* Expanded actions — always shown on tap */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 md:px-4 md:pb-4 animate-in">
                  {task.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 pl-8">{task.description}</p>
                  )}
                  <div className="flex gap-2 pl-8">
                    <button onClick={() => onTogglePin(task.id)}
                      className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95',
                        task.pinned
                          ? 'border-amber-200 dark:border-amber-800 text-amber-500 bg-amber-50/50 dark:bg-amber-900/20'
                          : 'border-gray-100 dark:border-gray-600 text-gray-400 active:bg-gray-50 dark:active:bg-gray-700'
                      )}>
                      {task.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                      {task.pinned ? 'Desfijar' : 'Fijar'}
                    </button>
                    <select value={task.status} onChange={e => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                      className="px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => onDelete(task.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/30 text-red-400 active:bg-red-50 dark:active:bg-red-900/20 transition-all active:scale-95 ml-auto">
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedTasks.length === 0 && (
          <div className="text-center py-16 text-gray-300 dark:text-gray-600">
            <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto">
              <ListTodo size={22} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="mt-3 font-medium text-gray-400 dark:text-gray-500">No hay tareas que mostrar</p>
            <p className="text-sm mt-1">Crea tu primera tarea para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}
