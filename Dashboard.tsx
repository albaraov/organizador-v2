import {
  ListTodo, Calendar, Target, AlertTriangle, Plus, X,
  Clock, Flame, ArrowRight, StickyNote
} from 'lucide-react';
import { Task, CalendarEvent, Commitment, Note, ViewType } from '../types';
import { format, isToday, isTomorrow, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';
import { useState } from 'react';

interface DashboardProps {
  tasks: Task[];
  events: CalendarEvent[];
  commitments: Commitment[];
  notes: Note[];
  brainDumpCount: number;
  onViewChange: (view: ViewType) => void;
  onAddNote: (content: string, color: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateTaskStatus: (id: string, status: 'pending' | 'in-progress' | 'completed') => void;
  onToggleCommitment: (id: string) => void;
}

const NOTE_COLORS = [
  'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200',
  'bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200',
  'bg-sky-50/60 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-800/40 text-sky-900 dark:text-sky-200',
  'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200',
  'bg-rose-50/60 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-800/40 text-rose-900 dark:text-rose-200',
  'bg-violet-50/60 dark:bg-violet-900/20 border-violet-200/60 dark:border-violet-800/40 text-violet-900 dark:text-violet-200',
];
const NOTE_COLOR_KEYS = ['gray', 'amber', 'sky', 'emerald', 'rose', 'violet'];
const NOTE_DOT_COLORS = ['bg-gray-300', 'bg-amber-300', 'bg-sky-300', 'bg-emerald-300', 'bg-rose-300', 'bg-violet-300'];

export function Dashboard({
  tasks, events, commitments, notes, brainDumpCount,
  onViewChange, onAddNote, onDeleteNote, onUpdateTaskStatus, onToggleCommitment
}: DashboardProps) {
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('gray');
  const [mobileTab, setMobileTab] = useState<'hoy' | 'pendiente' | 'notas'>('hoy');

  const today = startOfDay(new Date());
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  const overdueTasks = pendingTasks.filter(t => t.dueDate && isBefore(parseISO(t.dueDate), today));
  const todayEvents = events.filter(e => isToday(parseISO(e.date)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.date)));
  const todayTasks = pendingTasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate)));
  const pendingCommitments = commitments.filter(c => !c.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const upcomingCommitments = pendingCommitments.slice(0, 6);

  const handleAddNote = () => {
    if (noteText.trim()) { onAddNote(noteText.trim(), noteColor); setNoteText(''); }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const cycleTaskStatus = (task: Task) => {
    const next = task.status === 'pending' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'pending';
    onUpdateTaskStatus(task.id, next as Task['status']);
  };

  // Alert banner data
  const alertItems: { text: string; color: string; icon: React.ReactNode }[] = [];
  if (overdueTasks.length > 0) alertItems.push({ text: `${overdueTasks.length} vencida${overdueTasks.length > 1 ? 's' : ''}`, color: 'text-red-500', icon: <AlertTriangle size={13} /> });
  if (urgentTasks.length > 0) alertItems.push({ text: `${urgentTasks.length} urgente${urgentTasks.length > 1 ? 's' : ''}`, color: 'text-amber-500', icon: <Flame size={13} /> });

  const TaskRow = ({ task, showDate = false }: { task: Task; showDate?: boolean }) => (
    <div className="flex items-center gap-3 py-2.5">
      <button onClick={() => cycleTaskStatus(task)} className="shrink-0 p-0.5">
        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
          task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
          task.status === 'in-progress' ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30' :
          'border-gray-300 dark:border-gray-600'
        )}>
          {task.status === 'completed' && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M2 6l3 3 5-5" /></svg>}
          {task.status === 'in-progress' && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', task.status === 'completed' ? 'line-through text-gray-300 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200')}>
          {task.title}
        </p>
        {showDate && task.dueDate && (
          <p className={cn('text-[10px]', isBefore(parseISO(task.dueDate), today) ? 'text-red-400' : 'text-gray-300 dark:text-gray-500')}>
            {format(parseISO(task.dueDate), "d MMM", { locale: es })}
          </p>
        )}
      </div>
      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
        task.priority === 'urgent' ? 'bg-red-400 animate-pulse' : task.priority === 'high' ? 'bg-amber-400' : task.priority === 'medium' ? 'bg-sky-300' : 'bg-gray-200'
      )} />
    </div>
  );

  return (
    <div className="space-y-3 md:space-y-6">
      {/* ─── MOBILE ─── */}
      <div className="md:hidden space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{getGreeting()} 👋</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
          {alertItems.length > 0 && (
            <div className="flex flex-col items-end gap-1 mt-1">
              {alertItems.map((a, i) => (
                <span key={i} className={cn('text-[10px] font-semibold flex items-center gap-1', a.color)}>
                  {a.icon} {a.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats — horizontal scroll */}
        <div className="flex gap-2 scroll-snap-x -mx-4 px-4">
          <QuickStat emoji="📋" value={pendingTasks.length} label="Pendientes" onClick={() => onViewChange('tasks')} />
          <QuickStat emoji="📅" value={todayEvents.length} label="Citas hoy" onClick={() => onViewChange('calendar')} />
          <QuickStat emoji="🎯" value={pendingCommitments.length} label="Eventos" onClick={() => onViewChange('commitments')} />
          {brainDumpCount > 0 && <QuickStat emoji="🧠" value={brainDumpCount} label="Ideas" onClick={() => onViewChange('braindump')} />}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(['hoy', 'pendiente', 'notas'] as const).map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={cn('flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all',
                mobileTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-400 dark:text-gray-500'
              )}>
              {tab === 'hoy' ? '📅 Hoy' : tab === 'pendiente' ? '📌 Pendiente' : '📝 Notas'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Hoy */}
          {mobileTab === 'hoy' && (
            <div className="p-4">
              {(todayEvents.length > 0 || todayTasks.length > 0) ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {todayEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{event.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{event.startTime} – {event.endTime}</p>
                      </div>
                    </div>
                  ))}
                  {todayTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  {upcomingCommitments.filter(c => isToday(parseISO(c.dueDate))).map(c => (
                    <div key={c.id} className="flex items-center gap-3 py-3">
                      <button onClick={() => onToggleCommitment(c.id)} className="shrink-0">
                        <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </div>
                      </button>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{c.title}</p>
                      <span className="text-[10px] font-semibold text-amber-500">HOY</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">✨</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nada programado para hoy</p>
                  {tomorrowEvents.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] text-gray-400 font-medium mb-1">Mañana:</p>
                      {tomorrowEvents.slice(0, 3).map(e => (
                        <p key={e.id} className="text-xs text-gray-500 dark:text-gray-400">{e.startTime} — {e.title}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => onViewChange('calendar')}
                className="w-full mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 text-xs font-medium text-gray-400 flex items-center justify-center gap-1 py-2">
                Ver calendario <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Pendiente */}
          {mobileTab === 'pendiente' && (
            <div className="p-4">
              {overdueTasks.length > 0 && (
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1">⚠️ Vencidas</p>
              )}
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {overdueTasks.map(task => <TaskRow key={task.id} task={task} showDate />)}
                {pendingTasks.filter(t => !overdueTasks.includes(t)).slice(0, 8).map(task => (
                  <TaskRow key={task.id} task={task} showDate />
                ))}
              </div>

              {upcomingCommitments.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">🎯 Eventos cercanos</p>
                  <div className="space-y-2">
                    {upcomingCommitments.slice(0, 4).map(c => {
                      const daysLeft = differenceInDays(parseISO(c.dueDate), today);
                      const isOverdue = daysLeft < 0;
                      return (
                        <div key={c.id} className="flex items-center gap-3 py-2">
                          <button onClick={() => onToggleCommitment(c.id)} className="shrink-0">
                            <div className={cn('w-5 h-5 rounded-full border-2',
                              isOverdue ? 'border-red-400' : daysLeft <= 2 ? 'border-amber-400' : 'border-gray-300 dark:border-gray-600'
                            )} />
                          </button>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{c.title}</p>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                            isOverdue ? 'text-red-500 bg-red-50 dark:bg-red-900/20' :
                            daysLeft <= 2 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                            'text-gray-400 bg-gray-100 dark:bg-gray-700'
                          )}>
                            {isOverdue ? `${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Hoy' : daysLeft === 1 ? 'Mañana' : `${daysLeft}d`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {pendingTasks.length === 0 && upcomingCommitments.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm text-gray-400">¡Todo al día!</p>
                </div>
              )}
              <button onClick={() => onViewChange('tasks')}
                className="w-full mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 text-xs font-medium text-gray-400 flex items-center justify-center gap-1 py-2">
                Ver todas <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Notas */}
          {mobileTab === 'notas' && (
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Nota rápida..."
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none text-gray-700 dark:text-gray-200" />
                <button onClick={handleAddNote}
                  className="p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl active:scale-95">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                {NOTE_COLOR_KEYS.map((c, i) => (
                  <button key={c} onClick={() => setNoteColor(c)}
                    className={cn('w-8 h-8 rounded-full border-2 transition-all', NOTE_DOT_COLORS[i],
                      noteColor === c ? 'scale-110 border-gray-400' : 'border-transparent'
                    )} />
                ))}
              </div>
              {notes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {notes.map(note => {
                    const colorIdx = NOTE_COLOR_KEYS.indexOf(note.color);
                    const colorClass = colorIdx >= 0 ? NOTE_COLORS[colorIdx] : NOTE_COLORS[0];
                    return (
                      <div key={note.id} className={cn('p-3 rounded-xl border relative', colorClass)}>
                        <button onClick={() => onDeleteNote(note.id)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 active:scale-90">
                          <X size={11} className="text-gray-400" />
                        </button>
                        <p className="text-xs whitespace-pre-wrap break-words pr-5">{note.content}</p>
                        <p className="text-[9px] mt-1.5 opacity-40">{format(parseISO(note.createdAt), "d MMM", { locale: es })}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-300 dark:text-gray-600 py-4">Sin notas</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="hidden md:block space-y-6">
        {/* Greeting */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{getGreeting()} 👋</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          {(urgentTasks.length > 0 || overdueTasks.length > 0 || todayEvents.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {urgentTasks.length > 0 && (
                <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Flame size={12} /> {urgentTasks.length} urgente{urgentTasks.length > 1 ? 's' : ''}
                </span>
              )}
              {overdueTasks.length > 0 && (
                <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {overdueTasks.length} vencida{overdueTasks.length > 1 ? 's' : ''}
                </span>
              )}
              {todayEvents.length > 0 && (
                <span className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Calendar size={12} /> {todayEvents.length} cita{todayEvents.length > 1 ? 's' : ''} hoy
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<ListTodo size={18} />} label="Tareas pendientes" value={pendingTasks.length} onClick={() => onViewChange('tasks')} />
          <StatCard icon={<Calendar size={18} />} label="Citas hoy" value={todayEvents.length} onClick={() => onViewChange('calendar')} />
          <StatCard icon={<Target size={18} />} label="Eventos activos" value={pendingCommitments.length} onClick={() => onViewChange('commitments')} />
        </div>

        {/* Upcoming commitments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Target size={18} className="text-gray-400" /> Eventos cercanos
            </h3>
            <button onClick={() => onViewChange('commitments')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          {upcomingCommitments.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingCommitments.map(c => {
                const isOverdue = isBefore(parseISO(c.dueDate), today);
                const daysLeft = differenceInDays(parseISO(c.dueDate), today);
                return (
                  <div key={c.id} className={cn('p-4 rounded-xl border transition-all',
                    isOverdue ? 'border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-900/10' :
                    daysLeft <= 2 ? 'border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10' :
                    'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30'
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button onClick={() => onToggleCommitment(c.id)} className="shrink-0">
                          <div className={cn('w-5 h-5 rounded-full border-2',
                            isOverdue ? 'border-red-400' : daysLeft <= 2 ? 'border-amber-400' : 'border-gray-300 dark:border-gray-600'
                          )} />
                        </button>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug truncate">{c.title}</p>
                      </div>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0',
                        isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        daysLeft === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        daysLeft <= 3 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      )}>
                        {isOverdue ? `${Math.abs(daysLeft)}d vencido` : daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-7">
                      📅 {format(parseISO(c.dueDate), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-300 dark:text-gray-600 text-center py-6">Sin eventos pendientes ✓</p>
          )}
        </div>

        {/* Tasks & Today's events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ListTodo size={18} className="text-gray-400" /> Tareas prioritarias
              </h3>
              <button onClick={() => onViewChange('tasks')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2.5">
                  <button onClick={() => cycleTaskStatus(task)} className="shrink-0">
                    <div className={cn('w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center',
                      task.status === 'in-progress' ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {task.status === 'in-progress' && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className={cn('text-xs', isBefore(parseISO(task.dueDate), today) ? 'text-red-400' : 'text-gray-300 dark:text-gray-500')}>
                        {format(parseISO(task.dueDate), "d MMM", { locale: es })}
                      </p>
                    )}
                  </div>
                  <div className={cn('w-2 h-2 rounded-full shrink-0',
                    task.priority === 'urgent' ? 'bg-red-400 animate-pulse' : task.priority === 'high' ? 'bg-amber-400' : task.priority === 'medium' ? 'bg-sky-300' : 'bg-gray-200'
                  )} />
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-sm text-gray-300 dark:text-gray-600 text-center py-6">Sin tareas pendientes ✓</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" /> Agenda de hoy
              </h3>
              <button onClick={() => onViewChange('calendar')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                Ver calendario <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {todayEvents.length > 0 ? todayEvents.map(event => (
                <div key={event.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{event.title}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">{event.startTime} – {event.endTime}</p>
                  </div>
                </div>
              )) : tomorrowEvents.length > 0 ? (
                <>
                  <p className="text-xs text-gray-300 dark:text-gray-500 mb-2 pt-1">Nada hoy. Mañana:</p>
                  {tomorrowEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="py-3 flex items-center gap-3">
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{event.title}</p>
                        <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">{event.startTime} – {event.endTime}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-300 dark:text-gray-600 text-center py-6">Sin citas programadas</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
            <StickyNote size={18} className="text-gray-400" /> Notas rápidas
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              placeholder="Escribe una nota rápida..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 text-gray-700 dark:text-gray-200" />
            <div className="flex items-center gap-1.5">
              {NOTE_COLOR_KEYS.map((c, i) => (
                <button key={c} onClick={() => setNoteColor(c)}
                  className={cn('w-5 h-5 rounded-full border-2 transition-all', NOTE_DOT_COLORS[i],
                    noteColor === c ? 'scale-125 border-gray-400' : 'border-transparent'
                  )} />
              ))}
            </div>
            <button onClick={handleAddNote}
              className="px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-1">
              <Plus size={14} /> Agregar
            </button>
          </div>
          {notes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {notes.map(note => {
                const colorIdx = NOTE_COLOR_KEYS.indexOf(note.color);
                const colorClass = colorIdx >= 0 ? NOTE_COLORS[colorIdx] : NOTE_COLORS[0];
                return (
                  <div key={note.id} className={cn('p-3 rounded-xl border relative group', colorClass)}>
                    <button onClick={() => onDeleteNote(note.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity">
                      <X size={11} className="text-gray-400" />
                    </button>
                    <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
                    <p className="text-[10px] mt-2 opacity-40">{format(parseISO(note.createdAt), "d MMM HH:mm", { locale: es })}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function QuickStat({ emoji, value, label, onClick }: { emoji: string; value: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 w-[85px] bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 text-center active:scale-95 transition-transform">
      <span className="text-lg">{emoji}</span>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{value}</p>
      <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{label}</p>
    </button>
  );
}

function StatCard({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number | string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left w-full">
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center mb-3">{icon}</div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
    </button>
  );
}
