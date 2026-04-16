import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, ChevronDown } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../utils/cn';

interface PomodoroViewProps {
  tasks: Task[];
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<PomodoroMode, { label: string; minutes: number; color: string; icon: React.ReactNode; desc: string }> = {
  work: { label: 'Enfoque', minutes: 25, color: 'text-gray-800 dark:text-gray-100', icon: <Brain size={20} />, desc: 'Concéntrate en tu tarea' },
  shortBreak: { label: 'Descanso corto', minutes: 5, color: 'text-emerald-600 dark:text-emerald-400', icon: <Coffee size={20} />, desc: 'Tómate un respiro' },
  longBreak: { label: 'Descanso largo', minutes: 15, color: 'text-sky-600 dark:text-sky-400', icon: <Coffee size={20} />, desc: 'Relájate, te lo mereces' },
};

export function PomodoroView({ tasks }: PomodoroViewProps) {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const currentTask = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].minutes * 60);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Play a notification sound with Web Audio API
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.value = 0.3;
              osc.start();
              setTimeout(() => { osc.stop(); ctx.close(); }, 300);
            } catch { /* silent fail */ }

            if (mode === 'work') {
              setSessionsCompleted(s => s + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      // Reset to current mode duration
      setTimeLeft(MODES[mode].minutes * 60);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = MODES[mode].minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const modeConfig = MODES[mode];
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pomodoro</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Técnica de productividad · {sessionsCompleted} sesión{sessionsCompleted !== 1 ? 'es' : ''} completada{sessionsCompleted !== 1 ? 's' : ''} hoy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
            {/* Mode selector */}
            <div className="flex justify-center gap-2 mb-8">
              {(Object.keys(MODES) as PomodoroMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === m
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Timer circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-72 h-72">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
                  <circle
                    cx="150" cy="150" r="140"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-gray-100 dark:text-gray-700"
                  />
                  <circle
                    cx="150" cy="150" r="140"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={cn(
                      'transition-all duration-1000',
                      mode === 'work' ? 'text-gray-800 dark:text-gray-200' :
                      mode === 'shortBreak' ? 'text-emerald-500' : 'text-sky-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-xs font-medium mb-2 flex items-center gap-1.5', modeConfig.color)}>
                    {modeConfig.icon} {modeConfig.label}
                  </span>
                  <span className={cn('text-6xl font-light tracking-tight tabular-nums', modeConfig.color)}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </span>
                  <p className="text-xs text-gray-300 dark:text-gray-500 mt-2">{modeConfig.desc}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={resetTimer}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={toggleTimer}
                  className={cn(
                    'px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all',
                    isRunning
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                      : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                  )}
                >
                  {isRunning ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> {timeLeft === 0 ? 'Reiniciar' : 'Iniciar'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Task selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">Trabajando en...</h4>
            <div className="relative">
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className={cn(currentTask ? 'text-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-gray-500')}>
                  {currentTask ? currentTask.title : 'Seleccionar tarea (opcional)'}
                </span>
                <ChevronDown size={14} className="text-gray-300" />
              </button>
              {showTaskPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto animate-in">
                  <button
                    onClick={() => { setSelectedTask(null); setShowTaskPicker(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Sin tarea seleccionada
                  </button>
                  {pendingTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => { setSelectedTask(task.id); setShowTaskPicker(false); }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2',
                        selectedTask === task.id ? 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'
                      )}
                    >
                      <span className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        task.priority === 'urgent' ? 'bg-red-400' :
                        task.priority === 'high' ? 'bg-amber-400' :
                        task.priority === 'medium' ? 'bg-sky-300' : 'bg-gray-300'
                      )} />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">Sesiones de hoy</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: Math.max(sessionsCompleted, 4) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                    i < sessionsCompleted
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-300 dark:text-gray-500 border border-gray-100 dark:border-gray-600'
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-300 dark:text-gray-500 mt-3">
              ≈ {Math.round(sessionsCompleted * 25 / 60 * 10) / 10}h de enfoque hoy
            </p>
          </div>

          {/* Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">💡 Consejos</h4>
            <div className="space-y-2 text-xs text-gray-400 dark:text-gray-500">
              <p>• Trabaja 25 min sin distracciones</p>
              <p>• Descansos cortos de 5 min</p>
              <p>• Cada 4 sesiones, descanso largo (15 min)</p>
              <p>• Pon el móvil en silencio</p>
              <p>• Un objetivo por sesión</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
