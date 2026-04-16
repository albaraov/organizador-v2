import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Zap, CheckCircle2, Brain } from 'lucide-react';
import { BrainDumpItem, Priority, LifeArea, AREA_CONFIG, PRIORITY_CONFIG } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface BrainDumpViewProps {
  items: BrainDumpItem[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string, priority: Priority, area: LifeArea, dueDate: string | null) => void;
  onClearConverted: () => void;
}

export function BrainDumpView({ items, onAdd, onDelete, onConvert, onClearConverted }: BrainDumpViewProps) {
  const [inputText, setInputText] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertPriority, setConvertPriority] = useState<Priority>('medium');
  const [convertArea, setConvertArea] = useState<LifeArea>('personal');
  const [convertDueDate, setConvertDueDate] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pendingItems = items.filter(i => !i.convertedToTaskId);
  const convertedItems = items.filter(i => i.convertedToTaskId);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleAdd = () => {
    const text = inputText.trim();
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim());
    lines.forEach(line => onAdd(line.trim()));
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleConvert = (id: string) => {
    onConvert(id, convertPriority, convertArea, convertDueDate || null);
    setConvertingId(null);
    setConvertPriority('medium');
    setConvertArea('personal');
    setConvertDueDate('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <Brain size={24} className="text-gray-400" />
          Vaciado mental
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Vuelca aquí todo lo que tengas en la cabeza. Luego prioriza y convierte en tareas.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe lo que tengas en mente... (Enter para añadir, Shift+Enter para nueva línea)"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 resize-none text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-500"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-300 dark:text-gray-600">
            💡 Varias ideas por línea se añaden todas a la vez
          </p>
          <button onClick={handleAdd} disabled={!inputText.trim()}
            className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
            <Plus size={16} /> Vaciar
          </button>
        </div>
      </div>

      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Por priorizar ({pendingItems.length})
          </h3>
          <div className="space-y-2">
            {pendingItems.map(item => (
              <div key={item.id} className="animate-in">
                <div className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 transition-all hover:border-gray-200 dark:hover:border-gray-600 group',
                  convertingId === item.id && 'ring-2 ring-gray-200 dark:ring-gray-600'
                )}>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-300 mt-2 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{item.text}</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                        {format(parseISO(item.createdAt), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setConvertingId(convertingId === item.id ? null : item.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-1">
                        <ArrowRight size={12} /> Priorizar
                      </button>
                      <button onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {convertingId === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 animate-in">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-3">Convertir en tarea:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-1">Prioridad</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                              <button key={key} onClick={() => setConvertPriority(key)}
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                                  convertPriority === key
                                    ? cn(cfg.bg, cfg.color, 'ring-1 ring-offset-1 ring-gray-300 dark:ring-gray-500 dark:ring-offset-gray-800')
                                    : 'border-gray-100 dark:border-gray-600 text-gray-400 hover:border-gray-200'
                                )}>
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-1">Ámbito</label>
                          <select value={convertArea} onChange={e => setConvertArea(e.target.value as LifeArea)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600 dark:text-gray-300">
                            {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                              <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-1">Fecha límite</label>
                          <input type="date" value={convertDueDate} onChange={e => setConvertDueDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs focus:outline-none text-gray-600 dark:text-gray-300"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleConvert(item.id)}
                          className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> Crear tarea
                        </button>
                        <button onClick={() => setConvertingId(null)}
                          className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {convertedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Ya convertidas ({convertedItems.length})
            </h3>
            <button onClick={onClearConverted}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 size={12} /> Limpiar
            </button>
          </div>
          <div className="space-y-1.5">
            {convertedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-50 dark:border-gray-700/50">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-400 dark:text-gray-500 line-through flex-1">{item.text}</p>
                <span className="text-[10px] text-gray-300 dark:text-gray-600">→ tarea creada</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Brain size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-medium text-gray-400 dark:text-gray-500">Tu mente está vacía 🧘</p>
          <p className="text-sm text-gray-300 dark:text-gray-600 mt-1 max-w-md mx-auto">
            Escribe arriba todo lo que tengas en mente: ideas, tareas pendientes, cosas que no quieres olvidar...
          </p>
        </div>
      )}

      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100/50 dark:border-gray-700/50">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">💡 ¿Cómo usar el vaciado mental?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">1. Vuelca</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Escribe todo sin pensar en orden ni prioridad.</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">2. Prioriza</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Decide prioridad, ámbito y fecha límite.</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">3. Actúa</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Las ideas se convierten en tareas organizadas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
