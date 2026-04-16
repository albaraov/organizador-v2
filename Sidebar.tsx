import { LayoutDashboard, ListTodo, Columns3, Calendar, Target, Timer, BarChart3, ChevronLeft, ChevronRight, Moon, Sun, Brain, Grid3X3, ShoppingCart } from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggle: () => void;
  pendingTasks: number;
  upcomingEvents: number;
  pendingCommitments: number;
  brainDumpCount: number;
  groceryPending: number;
  darkMode: boolean;
  onToggleDark: () => void;
}

const navItems: { view: ViewType; label: string; icon: React.ReactNode; section?: string }[] = [
  { view: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={20} /> },
  { view: 'braindump', label: 'Vaciado', icon: <Brain size={20} />, section: 'capturar' },
  { view: 'tasks', label: 'Tareas', icon: <ListTodo size={20} />, section: 'organizar' },
  { view: 'kanban', label: 'Kanban', icon: <Columns3 size={20} /> },
  { view: 'eisenhower', label: 'Eisenhower', icon: <Grid3X3 size={20} /> },
  { view: 'calendar', label: 'Calendario', icon: <Calendar size={20} /> },
  { view: 'commitments', label: 'Eventos', icon: <Target size={20} /> },
  { view: 'shopping', label: 'Compra', icon: <ShoppingCart size={20} />, section: 'día a día' },
  { view: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} />, section: 'productividad' },
  { view: 'weekly', label: 'Semanal', icon: <BarChart3 size={20} /> },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggle, pendingTasks, upcomingEvents, pendingCommitments, brainDumpCount, groceryPending, darkMode, onToggleDark }: SidebarProps) {
  const badges: Record<ViewType, number> = {
    dashboard: 0,
    braindump: brainDumpCount,
    tasks: pendingTasks,
    kanban: 0,
    eisenhower: 0,
    calendar: upcomingEvents,
    commitments: pendingCommitments,
    shopping: groceryPending,
    pomodoro: 0,
    weekly: 0,
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[64px]' : 'w-[220px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-xs font-bold">
              O
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm tracking-tight">Organizer</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ view, label, icon, section }, idx) => (
          <div key={view}>
            {/* Section divider */}
            {section && !collapsed && (
              <p className={cn(
                'text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 px-3',
                idx > 0 ? 'mt-4 mb-2' : 'mb-2'
              )}>
                {section}
              </p>
            )}
            {section && collapsed && idx > 0 && (
              <div className="my-2 mx-2 border-t border-gray-100 dark:border-gray-800" />
            )}
            <button
              onClick={() => onViewChange(view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                currentView === view
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {badges[view] > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-semibold rounded-full flex items-center justify-center',
                    collapsed
                      ? 'absolute -top-1 -right-1 w-4 h-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'ml-auto px-1.5 py-0.5',
                    currentView === view
                      ? (collapsed ? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-800' : 'bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900')
                      : (collapsed ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')
                  )}
                >
                  {badges[view]}
                </span>
              )}
            </button>
          </div>
        ))}
      </nav>

      {/* Footer - Dark mode toggle */}
      <div className="p-3 border-t border-gray-50 dark:border-gray-800 space-y-2">
        <button
          onClick={onToggleDark}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          )}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span className="text-sm font-medium">{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>
        {!collapsed && (
          <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center">
            Datos guardados localmente
          </p>
        )}
      </div>
    </aside>
  );
}
