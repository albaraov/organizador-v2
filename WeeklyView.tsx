import { BarChart3, CheckCircle2, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { Task, CalendarEvent, Commitment } from '../types';
import {
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
  parseISO, format, isWithinInterval, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface WeeklyViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  commitments: Commitment[];
}

export function WeeklyView({ tasks, events, commitments }: WeeklyViewProps) {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Tasks completed this week
  const completedThisWeek = tasks.filter(t =>
    t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })
  );

  // Tasks still pending with due date this week
  const pendingThisWeek = tasks.filter(t =>
    t.status !== 'completed' && t.dueDate &&
    isWithinInterval(parseISO(t.dueDate), { start: weekStart, end: weekEnd })
  );

  // Events this week
  const eventsThisWeek = events.filter(e =>
    isWithinInterval(parseISO(e.date), { start: weekStart, end: weekEnd })
  );

  // Commitments this week
  const commitmentsThisWeek = commitments.filter(c =>
    isWithinInterval(parseISO(c.dueDate), { start: weekStart, end: weekEnd })
  );

  const completedCommitmentsThisWeek = commitmentsThisWeek.filter(c => c.completed);

  // Daily breakdown
  const dailyData = weekDays.map(day => {
    const dayCompleted = completedThisWeek.filter(t =>
      t.completedAt && isSameDay(parseISO(t.completedAt), day)
    );
    const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
    const dayPending = tasks.filter(t =>
      t.status !== 'completed' && t.dueDate && isSameDay(parseISO(t.dueDate), day)
    );
    const dayCommitments = commitments.filter(c => isSameDay(parseISO(c.dueDate), day));

    return {
      date: day,
      completed: dayCompleted.length,
      events: dayEvents.length,
      pending: dayPending.length,
      commitments: dayCommitments.length,
      total: dayCompleted.length + dayEvents.length + dayPending.length + dayCommitments.length,
    };
  });

  const maxTotal = Math.max(...dailyData.map(d => d.total), 1);

  // Productivity score (simple metric)
  const totalPending = pendingThisWeek.length + commitmentsThisWeek.filter(c => !c.completed).length;
  const totalCompleted = completedThisWeek.length + completedCommitmentsThisWeek.length;
  const totalItems = totalPending + totalCompleted;
  const productivityScore = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Resumen semanal</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d MMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Tareas completadas"
          value={completedThisWeek.length}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Tareas pendientes"
          value={pendingThisWeek.length}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Citas esta semana"
          value={eventsThisWeek.length}
          accent="bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
        />
        <StatCard
          icon={<Target size={18} />}
          label="Eventos"
          value={`${completedCommitmentsThisWeek.length}/${commitmentsThisWeek.length}`}
          accent="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-400" /> Actividad diaria
            </h3>
          </div>

          <div className="flex items-end gap-3 h-48">
            {dailyData.map((day, i) => {
              const isCurrentDay = isSameDay(day.date, today);
              const barHeight = day.total > 0 ? (day.total / maxTotal) * 100 : 4;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {day.total > 0 ? day.total : ''}
                  </span>
                  <div className="w-full flex flex-col justify-end h-full">
                    <div className="relative w-full rounded-t-lg overflow-hidden" style={{ height: `${barHeight}%`, minHeight: '4px' }}>
                      {/* Completed */}
                      {day.completed > 0 && (
                        <div
                          className="w-full bg-emerald-300 dark:bg-emerald-500"
                          style={{ height: `${(day.completed / Math.max(day.total, 1)) * 100}%` }}
                        />
                      )}
                      {/* Events */}
                      {day.events > 0 && (
                        <div
                          className="w-full bg-sky-300 dark:bg-sky-500"
                          style={{ height: `${(day.events / Math.max(day.total, 1)) * 100}%` }}
                        />
                      )}
                      {/* Pending */}
                      {day.pending > 0 && (
                        <div
                          className="w-full bg-amber-300 dark:bg-amber-500"
                          style={{ height: `${(day.pending / Math.max(day.total, 1)) * 100}%` }}
                        />
                      )}
                      {/* Commitments */}
                      {day.commitments > 0 && (
                        <div
                          className="w-full bg-gray-300 dark:bg-gray-500"
                          style={{ height: `${(day.commitments / Math.max(day.total, 1)) * 100}%` }}
                        />
                      )}
                      {day.total === 0 && (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700" />
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    isCurrentDay
                      ? 'text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded'
                      : 'text-gray-400 dark:text-gray-500'
                  )}>
                    {format(day.date, 'EEE', { locale: es })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-500" /> Completadas
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-sky-300 dark:bg-sky-500" /> Citas
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-300 dark:bg-amber-500" /> Pendientes
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-500" /> Eventos
            </div>
          </div>
        </div>

        {/* Productivity & pending list */}
        <div className="space-y-4">
          {/* Score */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-400" /> Productividad
            </h4>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" stroke="currentColor" className="text-gray-100 dark:text-gray-700" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                    stroke="currentColor"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 - (productivityScore / 100) * 2 * Math.PI * 42}
                    className={cn(
                      'transition-all duration-700',
                      productivityScore >= 70 ? 'text-emerald-400' :
                      productivityScore >= 40 ? 'text-amber-400' : 'text-gray-400'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-200">{productivityScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {productivityScore >= 70 ? '¡Gran semana! 🎉' :
                   productivityScore >= 40 ? 'Vas bien, sigue así 💪' :
                   totalItems === 0 ? 'Sin actividad aún' :
                   'Ánimo, tú puedes 🚀'}
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">
                  {totalCompleted} de {totalItems} completados
                </p>
              </div>
            </div>
          </div>

          {/* Remaining this week */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">Pendiente esta semana</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingThisWeek.length > 0 ? pendingThisWeek.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 dark:bg-gray-700/50">
                  <span className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    task.priority === 'urgent' ? 'bg-red-400' :
                    task.priority === 'high' ? 'bg-amber-400' :
                    task.priority === 'medium' ? 'bg-sky-300' : 'bg-gray-300'
                  )} />
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{task.title}</p>
                  {task.dueDate && (
                    <span className="text-[10px] text-gray-300 dark:text-gray-500 shrink-0">
                      {format(parseISO(task.dueDate), 'd MMM', { locale: es })}
                    </span>
                  )}
                </div>
              )) : (
                <p className="text-xs text-gray-300 dark:text-gray-500 text-center py-4">¡Todo al día esta semana! ✓</p>
              )}
            </div>
          </div>

          {/* Completed this week */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">Completado esta semana ✓</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {completedThisWeek.length > 0 ? completedThisWeek.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 line-through">{task.title}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-300 dark:text-gray-500 text-center py-4">Nada completado aún</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number | string; accent: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', accent)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
