import { useState } from 'react';
import { ViewType } from './types';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TasksView } from './components/TasksView';
import { KanbanView } from './components/KanbanView';
import { CalendarView } from './components/CalendarView';
import { CommitmentsView } from './components/CommitmentsView';
import { PomodoroView } from './components/PomodoroView';
import { WeeklyView } from './components/WeeklyView';
import { BrainDumpView } from './components/BrainDumpView';
import { EisenhowerView } from './components/EisenhowerView';
import ShoppingListView from './components/ShoppingListView';
import { cn } from './utils/cn';
import { isToday, parseISO } from 'date-fns';
import {
  LayoutDashboard, ListTodo, Calendar, ShoppingCart,
  MoreHorizontal, X, Columns3, Target, Timer, BarChart3,
  Brain, Grid3X3, Moon, Sun
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const store = useStore();

  const pendingTasks = store.tasks.filter(t => t.status !== 'completed').length;
  const todayEvents = store.events.filter(e => isToday(parseISO(e.date))).length;
  const pendingCommitments = store.commitments.filter(c => !c.completed).length;
  const brainDumpCount = store.brainDump.filter(b => !b.convertedToTaskId).length;
  const groceryPending = store.groceries.filter(g => !g.checked).length;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={store.tasks}
            events={store.events}
            commitments={store.commitments}
            notes={store.notes}
            brainDumpCount={brainDumpCount}
            onViewChange={setCurrentView}
            onAddNote={store.addNote}
            onDeleteNote={store.deleteNote}
            onUpdateTaskStatus={store.updateTaskStatus}
            onToggleCommitment={store.toggleCommitment}
          />
        );
      case 'braindump':
        return (
          <BrainDumpView
            items={store.brainDump}
            onAdd={store.addBrainDumpItem}
            onDelete={store.deleteBrainDumpItem}
            onConvert={store.convertBrainDumpToTask}
            onClearConverted={store.clearConvertedBrainDump}
          />
        );
      case 'tasks':
        return (
          <TasksView
            tasks={store.tasks}
            onAdd={store.addTask}
            onUpdateStatus={store.updateTaskStatus}
            onDelete={store.deleteTask}
            onTogglePin={store.togglePinTask}
          />
        );
      case 'kanban':
        return (
          <KanbanView
            tasks={store.tasks}
            onAdd={store.addTask}
            onUpdateTask={store.updateTask}
            onUpdateStatus={store.updateTaskStatus}
            onDelete={store.deleteTask}
            onTogglePin={store.togglePinTask}
          />
        );
      case 'eisenhower':
        return (
          <EisenhowerView
            tasks={store.tasks}
            onAdd={store.addTask}
            onUpdateTask={store.updateTask}
            onUpdateStatus={store.updateTaskStatus}
            onDelete={store.deleteTask}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            events={store.events}
            tasks={store.tasks}
            commitments={store.commitments}
            onAdd={store.addEvent}
            onUpdate={store.updateEvent}
            onDelete={store.deleteEvent}
          />
        );
      case 'commitments':
        return (
          <CommitmentsView
            commitments={store.commitments}
            onAdd={store.addCommitment}
            onUpdate={store.updateCommitment}
            onToggle={store.toggleCommitment}
            onDelete={store.deleteCommitment}
          />
        );
      case 'pomodoro':
        return (
          <PomodoroView
            tasks={store.tasks}
          />
        );
      case 'weekly':
        return (
          <WeeklyView
            tasks={store.tasks}
            events={store.events}
            commitments={store.commitments}
          />
        );
      case 'shopping':
        return (
          <ShoppingListView
            items={store.groceries}
            categories={store.shoppingCategories}
            onToggle={store.toggleGroceryItem}
            onAddItem={store.addGroceryItem}
            onUpdateItem={store.updateGroceryItem}
            onDeleteItem={store.deleteGroceryItem}
            onResetAll={store.uncheckAllGroceries}
            onRestoreDefaults={store.resetGroceriesToDefaults}
            onAddCategory={store.addShoppingCategory}
            onUpdateCategory={store.updateShoppingCategory}
            onDeleteCategory={store.deleteShoppingCategory}
            dark={store.darkMode}
          />
        );
    }
  };

  return (
    <div className={cn('min-h-[100dvh]', store.darkMode ? 'dark bg-gray-950' : 'bg-gray-50/50')}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          pendingTasks={pendingTasks}
          upcomingEvents={todayEvents}
          pendingCommitments={pendingCommitments}
          brainDumpCount={brainDumpCount}
          groceryPending={groceryPending}
          darkMode={store.darkMode}
          onToggleDark={store.toggleDarkMode}
        />
      </div>

      {/* Mobile bottom nav */}
      <MobileNav
        currentView={currentView}
        onViewChange={setCurrentView}
        pendingTasks={pendingTasks}
        todayEvents={todayEvents}
        pendingCommitments={pendingCommitments}
        groceryPending={groceryPending}
        darkMode={store.darkMode}
        onToggleDark={store.toggleDarkMode}
      />

      {/* Main content */}
      <main
        className="transition-all duration-300 min-h-[100dvh] pb-[76px] md:pb-0 main-content"
        style={{ ['--sidebar-w' as string]: sidebarCollapsed ? '64px' : '220px' }}
      >
        <div className="px-4 py-3 md:p-6 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

/* ── Mobile Bottom Navigation ── */

interface MobileNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  pendingTasks: number;
  todayEvents: number;
  pendingCommitments: number;
  groceryPending: number;
  darkMode: boolean;
  onToggleDark: () => void;
}

function MobileNav({ currentView, onViewChange, pendingTasks, todayEvents, pendingCommitments, groceryPending, darkMode, onToggleDark }: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const mainTabs: { view: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={22} /> },
    { view: 'tasks', label: 'Tareas', icon: <ListTodo size={22} />, badge: pendingTasks },
    { view: 'calendar', label: 'Agenda', icon: <Calendar size={22} />, badge: todayEvents },
    { view: 'shopping', label: 'Compra', icon: <ShoppingCart size={22} />, badge: groceryPending },
  ];

  const moreItems: { view: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'kanban', label: 'Kanban', icon: <Columns3 size={22} /> },
    { view: 'eisenhower', label: 'Eisenhower', icon: <Grid3X3 size={22} /> },
    { view: 'commitments', label: 'Eventos', icon: <Target size={22} />, badge: pendingCommitments },
    { view: 'braindump', label: 'Vaciado', icon: <Brain size={22} /> },
    { view: 'pomodoro', label: 'Pomodoro', icon: <Timer size={22} /> },
    { view: 'weekly', label: 'Semanal', icon: <BarChart3 size={22} /> },
  ];

  const isMoreView = moreItems.some(m => m.view === currentView);

  return (
    <div className="md:hidden">
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-[90]" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" />
          <div
            className="absolute bottom-[72px] left-3 right-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-3 animate-slideUp safe-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Más opciones</span>
              <button onClick={onToggleDark} className="p-2.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 text-gray-400">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => { onViewChange(item.view); setMoreOpen(false); }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl transition-all relative active:scale-95',
                    currentView === item.view
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'text-gray-500 dark:text-gray-400 active:bg-gray-50 dark:active:bg-gray-800'
                  )}
                >
                  {item.icon}
                  <span className="text-[11px] font-medium leading-tight text-center">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 safe-bottom">
        <div className="flex items-stretch justify-around h-[68px] max-w-lg mx-auto">
          {mainTabs.map(tab => (
            <button
              key={tab.view}
              onClick={() => { onViewChange(tab.view); setMoreOpen(false); }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 relative transition-colors min-w-[60px]',
                currentView === tab.view
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-2 right-[calc(50%-20px)] min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              ) : null}
              {tab.icon}
              <span className={cn('text-[10px]', currentView === tab.view ? 'font-bold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 relative transition-colors min-w-[60px]',
              isMoreView || moreOpen ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {moreOpen ? <X size={22} /> : <MoreHorizontal size={22} />}
            <span className={cn('text-[10px]', isMoreView ? 'font-bold' : 'font-medium')}>Más</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
