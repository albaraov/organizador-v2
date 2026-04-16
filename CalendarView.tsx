import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { CalendarEvent, LifeArea, Task, Commitment, AREA_CONFIG } from '../types';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO,
  addMonths, subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: Task[];
  commitments: Commitment[];
  onAdd: (title: string, description: string, date: string, startTime: string, endTime: string, area: LifeArea, color: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onDelete: (id: string) => void;
}

const EVENT_COLORS = [
  { value: '#6b7280' }, { value: '#3b82f6' }, { value: '#6366f1' },
  { value: '#ec4899' }, { value: '#f97316' }, { value: '#22c55e' }, { value: '#14b8a6' },
];

const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function CalendarView({ events, tasks, commitments, onAdd, onUpdate, onDelete }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [area, setArea] = useState<LifeArea>('personal');
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.date), day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const getTasksForDay = (day: Date) =>
    tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day) && t.status !== 'completed');
  const getCommitmentsForDay = (day: Date) =>
    commitments.filter(c => isSameDay(parseISO(c.dueDate), day) && !c.completed);

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const selectedDateTasks = selectedDate ? getTasksForDay(selectedDate) : [];
  const selectedDateCommitments = selectedDate ? getCommitmentsForDay(selectedDate) : [];


  const resetForm = () => {
    setTitle(''); setDescription(''); setStartTime('09:00'); setEndTime('10:00');
    setArea('personal'); setColor(EVENT_COLORS[0].value); setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;
    if (editingId) {
      onUpdate(editingId, { title: title.trim(), description: description.trim(), date: format(selectedDate, 'yyyy-MM-dd'), startTime, endTime, area, color });
    } else {
      onAdd(title.trim(), description.trim(), format(selectedDate, 'yyyy-MM-dd'), startTime, endTime, area, color);
    }
    resetForm();
    setShowForm(false);
  };

  const startEditing = (event: CalendarEvent) => {
    setEditingId(event.id);
    setTitle(event.title); setDescription(event.description);
    setStartTime(event.startTime); setEndTime(event.endTime);
    setArea(event.area); setColor(event.color);
    setShowForm(true); setActiveEventId(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowPanel(true);
    resetForm(); setShowForm(false); setActiveEventId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">📅 Calendario</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{events.length} cita{events.length !== 1 ? 's' : ''}</p>
        </div>
        {selectedDate && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); setShowPanel(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium"
          >
            <Plus size={16} /> Nueva cita
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-50 dark:border-gray-700">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700">
            <ChevronLeft size={18} className="text-gray-400" />
          </button>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 capitalize text-sm sm:text-base">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700">
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-50 dark:border-gray-700">
          {WEEKDAYS.map((day, i) => (
            <div key={day} className="py-2 text-center text-[10px] sm:text-[11px] font-medium text-gray-300 dark:text-gray-500 uppercase tracking-wider">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const dayTasks = getTasksForDay(day);
            const dayCommitments = getCommitmentsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const totalItems = dayEvents.length + dayTasks.length + dayCommitments.length;

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'relative min-h-[52px] sm:min-h-[80px] p-1 sm:p-1.5 border-b border-r border-gray-50 dark:border-gray-700 text-left transition-all',
                  !isCurrentMonth && 'bg-gray-50/30 dark:bg-gray-800/50',
                  isSelected && 'bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-900 dark:ring-gray-300 ring-inset',
                )}
              >
                <span className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                  isToday(day) && 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
                  !isToday(day) && isCurrentMonth && 'text-gray-600 dark:text-gray-300',
                  !isCurrentMonth && 'text-gray-200 dark:text-gray-600',
                )}>
                  {format(day, 'd')}
                </span>

                {/* Mobile: show dots only */}
                <div className="sm:hidden flex gap-0.5 mt-0.5 pl-0.5">
                  {dayEvents.slice(0, 3).map(ev => (
                    <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                  ))}
                  {dayTasks.slice(0, 2).map(t => (
                    <span key={t.id} className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  ))}
                  {dayCommitments.slice(0, 2).map(co => (
                    <span key={co.id} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ))}
                </div>

                {/* Desktop: show labels */}
                <div className="hidden sm:block mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map(event => (
                    <div key={event.id} className="text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate font-medium" style={{ backgroundColor: event.color, opacity: 0.85 }}>
                      {event.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, totalItems > 3 ? 1 : 2).map(task => (
                    <div key={task.id} className="text-[10px] leading-tight px-1 py-0.5 rounded bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 truncate font-medium">
                      ○ {task.title}
                    </div>
                  ))}
                  {dayCommitments.slice(0, totalItems > 3 ? 1 : 2).map(co => (
                    <div key={co.id} className="text-[10px] leading-tight px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 truncate font-medium">
                      ◎ {co.title}
                    </div>
                  ))}
                  {totalItems > 3 && (
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 px-1">+{totalItems - 3}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel — MOBILE: bottom sheet, DESKTOP: below calendar */}
      {selectedDate && showPanel && (
        <>
          {/* Mobile overlay */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setShowPanel(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-600" />
              </div>
              <DayPanel
                date={selectedDate}
                events={selectedDateEvents}
                tasks={selectedDateTasks}
                commitments={selectedDateCommitments}
                showForm={showForm}
                setShowForm={setShowForm}
                editingId={editingId}
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                startTime={startTime} setStartTime={setStartTime}
                endTime={endTime} setEndTime={setEndTime}
                area={area} setArea={setArea}
                color={color} setColor={setColor}
                handleSubmit={handleSubmit}
                startEditing={startEditing}
                resetForm={resetForm}
                onDelete={onDelete}
                activeEventId={activeEventId}
                setActiveEventId={setActiveEventId}
              />
              <div className="h-8" />
            </div>
          </div>

          {/* Desktop: inline panel */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <DayPanel
                date={selectedDate}
                events={selectedDateEvents}
                tasks={selectedDateTasks}
                commitments={selectedDateCommitments}
                showForm={showForm}
                setShowForm={setShowForm}
                editingId={editingId}
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                startTime={startTime} setStartTime={setStartTime}
                endTime={endTime} setEndTime={setEndTime}
                area={area} setArea={setArea}
                color={color} setColor={setColor}
                handleSubmit={handleSubmit}
                startEditing={startEditing}
                resetForm={resetForm}
                onDelete={onDelete}
                activeEventId={activeEventId}
                setActiveEventId={setActiveEventId}
              />
            </div>
          </div>
        </>
      )}

      {/* Legend — compact */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Citas</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Tareas</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Eventos</span>
      </div>
    </div>
  );
}

/* ── Day Panel ── */

interface DayPanelProps {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  commitments: Commitment[];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingId: string | null;
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  startTime: string; setStartTime: (v: string) => void;
  endTime: string; setEndTime: (v: string) => void;
  area: LifeArea; setArea: (v: LifeArea) => void;
  color: string; setColor: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  startEditing: (event: CalendarEvent) => void;
  resetForm: () => void;
  onDelete: (id: string) => void;
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
}

function DayPanel({
  date, events, tasks, commitments,
  showForm, setShowForm, editingId,
  title, setTitle, description, setDescription,
  startTime, setStartTime, endTime, setEndTime,
  area, setArea, color, setColor,
  handleSubmit, startEditing, resetForm, onDelete,
  activeEventId, setActiveEventId
}: DayPanelProps) {
  const total = events.length + tasks.length + commitments.length;

  return (
    <div className="p-4 sm:p-5">
      {/* Date header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 capitalize text-base">
            {format(date, "EEEE", { locale: es })}
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {format(date, "d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium"
        >
          <Plus size={14} /> Cita
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {editingId ? '✏️ Editar cita' : '➕ Nueva cita'}
            </p>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-700">
              <X size={14} className="text-gray-300" />
            </button>
          </div>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Nombre de la cita" autoFocus
            className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 text-gray-700 dark:text-gray-200" />
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Descripción (opcional)" rows={2}
            className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none resize-none text-gray-700 dark:text-gray-200" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Inicio</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Fin</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-400 mb-1.5 block">Ámbito</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setArea(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border',
                    area === key
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'border-gray-100 dark:border-gray-600 text-gray-400'
                  )}>
                  <span>{cfg.emoji}</span> {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-400 mb-1.5 block">Color</label>
            <div className="flex gap-3">
              {EVENT_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={cn('w-7 h-7 rounded-full border-2 transition-all', color === c.value ? 'scale-125 border-gray-400 dark:border-gray-300' : 'border-transparent')}
                  style={{ backgroundColor: c.value }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium">
              {editingId ? 'Guardar cambios' : 'Crear cita'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-xl text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Events list */}
      {events.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Citas ({events.length})
          </p>
          {events.map(event => (
            <div key={event.id}>
              <div
                className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-700/50 border-l-[3px] cursor-pointer active:bg-gray-100 dark:active:bg-gray-600"
                style={{ borderLeftColor: event.color }}
                onClick={() => setActiveEventId(activeEventId === event.id ? null : event.id)}
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{event.title}</p>
                {event.description && <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">{event.description}</p>}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-300 dark:text-gray-500">
                  <span>🕐 {event.startTime} - {event.endTime}</span>
                  <span>·</span>
                  <span>{AREA_CONFIG[event.area]?.emoji} {AREA_CONFIG[event.area]?.label}</span>
                </div>
              </div>
              {/* Action buttons — always visible on tap */}
              {activeEventId === event.id && (
                <div className="flex gap-2 mt-1.5 mb-2">
                  <button onClick={() => startEditing(event)}
                    className="flex-1 py-2.5 text-xs font-medium rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600">
                    ✏️ Editar
                  </button>
                  <button onClick={() => { onDelete(event.id); setActiveEventId(null); }}
                    className="flex-1 py-2.5 text-xs font-medium rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 active:bg-red-100">
                    🗑 Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            📋 Tareas ({tasks.length})
          </p>
          {tasks.map(task => (
            <div key={task.id} className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100/60 dark:border-sky-800/30">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{task.title}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-300 dark:text-gray-500">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  task.priority === 'urgent' ? 'bg-red-50 dark:bg-red-900/30 text-red-500' :
                  task.priority === 'high' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' :
                  task.priority === 'medium' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-500' :
                  'bg-gray-50 dark:bg-gray-700 text-gray-400'
                )}>
                  {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
                <span>{AREA_CONFIG[task.area]?.emoji}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commitments */}
      {commitments.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            🎯 Eventos ({commitments.length})
          </p>
          {commitments.map(c => (
            <div key={c.id} className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/60 dark:border-amber-800/30">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{c.title}</p>
              <span className="text-xs text-gray-300 dark:text-gray-500 mt-1 inline-block">{AREA_CONFIG[c.area]?.emoji} {AREA_CONFIG[c.area]?.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && !showForm && (
        <div className="text-center py-8 text-gray-300 dark:text-gray-600">
          <p className="text-sm">Sin eventos este día</p>
          <button onClick={() => setShowForm(true)} className="text-xs mt-2 text-gray-400 underline">
            + Añadir cita
          </button>
        </div>
      )}
    </div>
  );
}
