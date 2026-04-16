import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Pencil, X } from 'lucide-react';
import { Commitment, LifeArea, AREA_CONFIG } from '../types';
import { format, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface CommitmentsViewProps {
  commitments: Commitment[];
  onAdd: (title: string, description: string, dueDate: string, area: LifeArea) => void;
  onUpdate: (id: string, updates: Partial<Omit<Commitment, 'id' | 'createdAt'>>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CommitmentsView({ commitments, onAdd, onUpdate, onToggle, onDelete }: CommitmentsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [area, setArea] = useState<LifeArea>('personal');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = startOfDay(new Date());

  const resetForm = () => {
    setTitle(''); setDescription(''); setDueDate(''); setArea('personal'); setEditingId(null); setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    if (editingId) {
      onUpdate(editingId, { title: title.trim(), description: description.trim(), dueDate, area });
    } else {
      onAdd(title.trim(), description.trim(), dueDate, area);
    }
    resetForm();
  };

  const startEditing = (c: Commitment) => {
    setEditingId(c.id); setTitle(c.title); setDescription(c.description); setDueDate(c.dueDate); setArea(c.area); setShowForm(true); setExpandedId(null);
  };

  const filteredCommitments = commitments
    .filter(c => { if (filter === 'pending') return !c.completed; if (filter === 'completed') return c.completed; return true; })
    .sort((a, b) => { if (a.completed !== b.completed) return a.completed ? 1 : -1; return a.dueDate.localeCompare(b.dueDate); });

  const pendingCount = commitments.filter(c => !c.completed).length;
  const completedCount = commitments.filter(c => c.completed).length;

  return (
    <div className="space-y-3 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Eventos</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} · {completedCount} cumplido{completedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium active:scale-95 transition-transform">
          <Plus size={16} /> <span className="hidden sm:inline">Nuevo evento</span><span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Form — bottom sheet on mobile */}
      {showForm && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={resetForm}>
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slideUp"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-600" /></div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{editingId ? '✏️ Editar evento' : 'Nuevo evento'}</h3>
                  <button type="button" onClick={resetForm} className="p-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700"><X size={18} className="text-gray-400" /></button>
                </div>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué evento tienes?" autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-base text-gray-700 dark:text-gray-200" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-base resize-none text-gray-700 dark:text-gray-200" />
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Fecha *</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-base text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Ámbito</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setArea(key)}
                        className={cn('py-3 rounded-xl text-xs font-medium border transition-all',
                          area === key ? `${cfg.bg} ${cfg.color} ${cfg.border} font-semibold` : 'border-gray-100 dark:border-gray-600 text-gray-400'
                        )}>{cfg.emoji} {cfg.label}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-semibold active:scale-[0.98]">
                  {editingId ? 'Guardar cambios' : 'Crear evento'}
                </button>
              </form>
            </div>
          </div>
          {/* Desktop form */}
          <form onSubmit={handleSubmit} className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4 animate-in">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{editingId ? '✏️ Editar evento' : '➕ Nuevo evento'}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué evento tienes?" autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200" />
              </div>
              <div className="col-span-2">
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm resize-none text-gray-700 dark:text-gray-200" />
              </div>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300" />
              <select value={area} onChange={e => setArea(e.target.value as LifeArea)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
                {(Object.entries(AREA_CONFIG) as [LifeArea, typeof AREA_CONFIG[LifeArea]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium">{editingId ? 'Guardar' : 'Crear evento'}</button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        </>
      )}

      {/* Filter pills */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: 'Todos' },
          { key: 'pending' as const, label: 'Pendientes' },
          { key: 'completed' as const, label: 'Cumplidos' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={cn('px-4 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95',
              filter === tab.key
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredCommitments.map(commitment => {
          const isOverdue = !commitment.completed && isBefore(parseISO(commitment.dueDate), today);
          const daysLeft = differenceInDays(parseISO(commitment.dueDate), today);
          const areaConfig = AREA_CONFIG[commitment.area];
          const isExpanded = expandedId === commitment.id;

          return (
            <div key={commitment.id}
              className={cn('bg-white dark:bg-gray-800 rounded-xl border transition-all',
                commitment.completed ? 'border-gray-50 dark:border-gray-700/50 opacity-50' : isOverdue ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-gray-700'
              )}>
              <div className="flex items-start gap-3 p-3.5 md:p-4"
                onClick={() => setExpandedId(isExpanded ? null : commitment.id)}>
                <button onClick={(e) => { e.stopPropagation(); onToggle(commitment.id); }} className="mt-0.5 shrink-0 p-0.5">
                  {commitment.completed ? <CheckCircle2 size={22} className="text-emerald-400" /> : <Circle size={22} className="text-gray-200 dark:text-gray-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('font-medium text-sm', commitment.completed ? 'line-through text-gray-300 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200')}>
                      {commitment.title}
                    </p>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', areaConfig.bg, areaConfig.color)}>{areaConfig.emoji}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <span className={cn(isOverdue ? 'text-red-400 font-medium' : 'text-gray-300 dark:text-gray-500')}>
                      📅 {format(parseISO(commitment.dueDate), "d MMM", { locale: es })}
                    </span>
                    {!commitment.completed && (
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        isOverdue ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                        daysLeft <= 2 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      )}>
                        {isOverdue ? `${Math.abs(daysLeft)}d vencido` : daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft}d`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded actions */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 md:px-4 md:pb-4 animate-in">
                  {commitment.description && <p className="text-xs text-gray-400 mb-3 pl-8">{commitment.description}</p>}
                  <div className="flex gap-2 pl-8">
                    <button onClick={() => startEditing(commitment)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border border-gray-100 dark:border-gray-600 text-gray-500 active:bg-gray-50 dark:active:bg-gray-700 active:scale-95">
                      <Pencil size={13} /> Editar
                    </button>
                    <button onClick={() => { onDelete(commitment.id); setExpandedId(null); }}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/30 text-red-400 active:bg-red-50 dark:active:bg-red-900/20 active:scale-95 ml-auto">
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCommitments.length === 0 && (
        <div className="text-center py-16 text-gray-300 dark:text-gray-600">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-medium text-gray-400 dark:text-gray-500">No hay eventos que mostrar</p>
          <p className="text-sm mt-1">Agrega un evento para empezar</p>
        </div>
      )}
    </div>
  );
}
