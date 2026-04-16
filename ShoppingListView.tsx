import { useState, useRef, useEffect } from 'react';
import { GroceryItem, ShoppingCategory } from '../types';

interface Props {
  items: GroceryItem[];
  categories: ShoppingCategory[];
  onToggle: (id: string) => void;
  onAddItem: (name: string, categoryId: string, quantity: string, unit: string, priority?: GroceryItem['priority']) => void;
  onUpdateItem: (id: string, updates: Partial<Omit<GroceryItem, 'id'>>) => void;
  onDeleteItem: (id: string) => void;
  onResetAll: () => void;
  onRestoreDefaults: () => void;
  onAddCategory: (label: string, emoji: string, color: string, zone: ShoppingCategory['zone']) => void;
  onUpdateCategory: (id: string, updates: Partial<Omit<ShoppingCategory, 'id'>>) => void;
  onDeleteCategory: (id: string) => void;
  dark: boolean;
}

const UNITS = ['uds', 'kg', 'g', 'L', 'ml', 'pack', 'bolsa', 'bote', 'caja', 'paquete'];

export default function ShoppingListView({
  items, categories, onToggle, onAddItem, onUpdateItem, onDeleteItem,
  onResetAll, onRestoreDefaults, onAddCategory, onUpdateCategory, onDeleteCategory, dark
}: Props) {
  const [search, setSearch] = useState('');
  const [hideChecked, setHideChecked] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', quantity: '', unit: '', categoryId: '', priority: 'convenient' as GroceryItem['priority'], notes: '' });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addText, setAddText] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catValues, setCatValues] = useState({ label: '', emoji: '' });
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatValues, setNewCatValues] = useState({ label: '', emoji: '📦' });
  const [showMenu, setShowMenu] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const addRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addingTo && addRef.current) addRef.current.focus();
  }, [addingTo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const pendingItems = totalItems - checkedItems;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const filtered = items.filter(i => {
    if (hideChecked && i.checked) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const grouped = sortedCategories.map(cat => ({
    ...cat,
    items: filtered
      .filter(i => i.categoryId === cat.id)
      .sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        const p = { essential: 0, convenient: 1, optional: 2 };
        return (p[a.priority] || 1) - (p[b.priority] || 1);
      })
  })).filter(g => g.items.length > 0 || !search);

  const handleAdd = (categoryId: string) => {
    if (!addText.trim()) return;
    const lines = addText.split(/[,\n]/).filter(l => l.trim());
    lines.forEach(line => {
      const match = line.trim().match(/^(.+?)(?:\s+(\d+\.?\d*)\s*(kg|g|uds|L|ml|pack|bolsa|bote|caja|paquete)?)?$/i);
      const name = match ? match[1].trim() : line.trim();
      const quantity = match?.[2] || '1';
      const unit = match?.[3] || 'uds';
      onAddItem(name, categoryId, quantity, unit);
    });
    setAddText('');
    setAddingTo(null);
  };

  const startEdit = (item: GroceryItem) => {
    setEditingItem(item.id);
    setActiveItem(null);
    setEditValues({
      name: item.name, quantity: item.quantity, unit: item.unit,
      categoryId: item.categoryId, priority: item.priority, notes: item.notes
    });
  };

  const saveEdit = (id: string) => {
    onUpdateItem(id, {
      name: editValues.name, quantity: editValues.quantity, unit: editValues.unit,
      categoryId: editValues.categoryId, priority: editValues.priority, notes: editValues.notes
    });
    setEditingItem(null);
  };

  const toggleCat = (catId: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const handleAddCategory = () => {
    if (newCatValues.label.trim()) {
      onAddCategory(newCatValues.label.trim(), newCatValues.emoji, 'gray', 'dry');
      setNewCatValues({ label: '', emoji: '📦' });
      setShowNewCat(false);
    }
  };

  // Styles
  const c = {
    bg: dark ? 'bg-gray-950' : 'bg-gray-50',
    text: dark ? 'text-gray-100' : 'text-gray-900',
    card: dark ? 'bg-gray-900' : 'bg-white',
    input: dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800',
    muted: dark ? 'text-gray-500' : 'text-gray-400',
    border: dark ? 'border-gray-800' : 'border-gray-100',
    hover: dark ? 'active:bg-gray-800' : 'active:bg-gray-100',
    btnPrimary: dark ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white',
    btnSecondary: dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700',
  };

  return (
    <div className={`min-h-screen ${c.bg} ${c.text}`}>
      <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">🛒 Lista de la compra</h1>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.muted} ${c.hover} transition-colors`}
            >
              ⋮
            </button>
            {showMenu && (
              <div className={`absolute right-0 top-12 z-50 ${c.card} border ${c.border} rounded-xl shadow-xl py-1 w-52`}>
                <button onClick={() => { setHideChecked(!hideChecked); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm ${c.hover} flex items-center gap-3`}>
                  <span>{hideChecked ? '👁' : '👁‍🗨'}</span>
                  {hideChecked ? 'Mostrar comprados' : 'Ocultar comprados'}
                </button>
                <button onClick={() => { onResetAll(); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm ${c.hover} flex items-center gap-3`}>
                  <span>↺</span>Desmarcar todo
                </button>
                <button onClick={() => { if (confirm('¿Restaurar lista original?')) { onRestoreDefaults(); setShowMenu(false); } }}
                  className={`w-full text-left px-4 py-3 text-sm ${c.hover} flex items-center gap-3`}>
                  <span>↻</span>Restaurar original
                </button>
                <div className={`border-t ${c.border} my-1`} />
                <button onClick={() => { setShowNewCat(true); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm ${c.hover} flex items-center gap-3`}>
                  <span>+</span>Nueva categoría
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs ${c.muted}`}>
            {pendingItems === 0 ? '✓ Listo' : `${checkedItems}/${totalItems}`}
          </span>
          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : dark ? 'bg-gray-400' : 'bg-gray-700'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${progress === 100 ? 'text-emerald-500' : c.muted}`}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-9 py-3 rounded-xl border ${c.input} text-sm focus:outline-none focus:ring-2 ${dark ? 'focus:ring-gray-600' : 'focus:ring-gray-300'}`}
          />
          <svg className={`absolute left-3 top-3.5 ${c.muted}`} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className={`absolute right-3 top-3 ${c.muted} text-lg leading-none`}>×</button>
          )}
        </div>

        {/* New category */}
        {showNewCat && (
          <div className={`mb-4 p-4 rounded-xl border ${c.border} ${c.card}`}>
            <p className={`text-xs font-medium ${c.muted} mb-3 uppercase tracking-wide`}>Nueva categoría</p>
            <div className="flex items-center gap-2">
              <input
                value={newCatValues.emoji}
                onChange={e => setNewCatValues(v => ({ ...v, emoji: e.target.value }))}
                className={`w-12 text-center text-lg rounded-xl border ${c.input} py-2 focus:outline-none`}
                maxLength={2}
              />
              <input
                value={newCatValues.label}
                onChange={e => setNewCatValues(v => ({ ...v, label: e.target.value }))}
                placeholder="Nombre"
                autoFocus
                className={`flex-1 px-3 py-2 rounded-xl border ${c.input} text-sm focus:outline-none`}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setShowNewCat(false); }}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAddCategory} className={`flex-1 py-2.5 text-sm rounded-xl font-medium ${c.btnPrimary}`}>
                Crear categoría
              </button>
              <button onClick={() => setShowNewCat(false)} className={`px-4 py-2.5 text-sm rounded-xl ${c.btnSecondary}`}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-1">
          {grouped.map(cat => {
            const catChecked = cat.items.filter(i => i.checked).length;
            const catTotal = items.filter(i => i.categoryId === cat.id).length;
            const catPending = catTotal - catChecked;
            const allDone = catTotal > 0 && catChecked === catTotal;
            const isCollapsed = collapsedCats.has(cat.id);

            return (
              <div key={cat.id} className={`${c.card} rounded-xl border ${c.border} overflow-hidden mb-2 ${allDone ? 'opacity-50' : ''} transition-opacity`}>
                {/* Category header — always tappable */}
                {editingCat === cat.id ? (
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={catValues.emoji}
                        onChange={e => setCatValues(v => ({ ...v, emoji: e.target.value }))}
                        className={`w-11 text-center text-lg rounded-lg border ${c.input} py-1 focus:outline-none`}
                        maxLength={2}
                      />
                      <input
                        value={catValues.label}
                        onChange={e => setCatValues(v => ({ ...v, label: e.target.value }))}
                        className={`flex-1 px-3 py-1.5 rounded-lg border ${c.input} text-sm font-medium focus:outline-none`}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') { onUpdateCategory(cat.id, { label: catValues.label, emoji: catValues.emoji }); setEditingCat(null); }
                          if (e.key === 'Escape') setEditingCat(null);
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { onUpdateCategory(cat.id, { label: catValues.label, emoji: catValues.emoji }); setEditingCat(null); }}
                        className={`flex-1 py-2 text-xs rounded-lg font-medium ${c.btnPrimary}`}>Guardar</button>
                      <button onClick={() => { if (confirm(`¿Eliminar "${cat.label}" y sus productos?`)) onDeleteCategory(cat.id); }}
                        className="py-2 px-3 text-xs rounded-lg font-medium bg-red-500/10 text-red-500">Eliminar</button>
                      <button onClick={() => setEditingCat(null)} className={`py-2 px-3 text-xs rounded-lg ${c.btnSecondary}`}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="flex-1 flex items-center gap-2.5 p-3 text-left"
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className={`text-sm font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{cat.label}</span>
                      {catPending > 0 && (
                        <span className={`text-[11px] ${c.muted} ml-auto mr-1`}>{catPending}</span>
                      )}
                      {allDone && <span className="text-[11px] text-emerald-500 ml-auto mr-1">✓</span>}
                      <svg className={`w-4 h-4 ${c.muted} transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {/* Category actions — always visible */}
                    <div className="flex items-center gap-0 pr-1">
                      <button
                        onClick={() => { setAddingTo(addingTo === cat.id ? null : cat.id); setAddText(''); }}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg ${c.muted} ${c.hover}`}
                        title="Añadir"
                      >+</button>
                      <button
                        onClick={() => { setEditingCat(cat.id); setCatValues({ label: cat.label, emoji: cat.emoji }); }}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs ${c.muted} ${c.hover}`}
                        title="Editar categoría"
                      >✏️</button>
                    </div>
                  </div>
                )}

                {/* Quick add for this category */}
                {addingTo === cat.id && editingCat !== cat.id && (
                  <div className={`px-3 pb-3 border-t ${c.border}`}>
                    <div className="flex items-center gap-2 pt-3">
                      <input
                        ref={addRef}
                        value={addText}
                        onChange={e => setAddText(e.target.value)}
                        placeholder="Ej: Tomates 2 kg, Lechuga"
                        className={`flex-1 px-3 py-2.5 rounded-xl border ${c.input} text-sm focus:outline-none`}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAdd(cat.id);
                          if (e.key === 'Escape') { setAddingTo(null); setAddText(''); }
                        }}
                      />
                      <button onClick={() => handleAdd(cat.id)}
                        className={`px-4 py-2.5 text-sm rounded-xl font-medium ${c.btnPrimary}`}>
                        Añadir
                      </button>
                    </div>
                  </div>
                )}

                {/* Items */}
                {!isCollapsed && editingCat !== cat.id && (
                  <div className={cat.items.length > 0 ? `border-t ${c.border}` : ''}>
                    {cat.items.map(item => (
                      <div key={item.id}>
                        {editingItem === item.id ? (
                          /* Edit mode */
                          <div className={`p-3 border-b ${c.border} space-y-3 ${dark ? 'bg-gray-800/50' : 'bg-gray-50/80'}`}>
                            <div className="flex gap-2">
                              <input
                                value={editValues.name}
                                onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                                className={`flex-1 px-3 py-2.5 rounded-xl border ${c.input} text-sm focus:outline-none`}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingItem(null); }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={editValues.quantity}
                                onChange={e => setEditValues(v => ({ ...v, quantity: e.target.value }))}
                                className={`w-16 px-3 py-2.5 rounded-xl border ${c.input} text-sm text-center focus:outline-none`}
                                placeholder="Qty"
                              />
                              <select
                                value={editValues.unit}
                                onChange={e => setEditValues(v => ({ ...v, unit: e.target.value }))}
                                className={`px-2 py-2.5 rounded-xl border ${c.input} text-sm focus:outline-none`}
                              >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <select
                                value={editValues.priority}
                                onChange={e => setEditValues(v => ({ ...v, priority: e.target.value as GroceryItem['priority'] }))}
                                className={`flex-1 px-2 py-2.5 rounded-xl border ${c.input} text-sm focus:outline-none`}
                              >
                                <option value="essential">🔴 Imprescindible</option>
                                <option value="convenient">⚪ Normal</option>
                                <option value="optional">⚫ Opcional</option>
                              </select>
                            </div>
                            <select
                              value={editValues.categoryId}
                              onChange={e => setEditValues(v => ({ ...v, categoryId: e.target.value }))}
                              className={`w-full px-3 py-2.5 rounded-xl border ${c.input} text-sm focus:outline-none`}
                            >
                              {categories.map(ct => <option key={ct.id} value={ct.id}>{ct.emoji} {ct.label}</option>)}
                            </select>
                            <input
                              value={editValues.notes}
                              onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                              placeholder="Notas (opcional)"
                              className={`w-full px-3 py-2.5 rounded-xl border ${c.input} text-sm focus:outline-none`}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(item.id)} className={`flex-1 py-2.5 text-sm rounded-xl font-medium ${c.btnPrimary}`}>
                                Guardar
                              </button>
                              <button onClick={() => { onDeleteItem(item.id); setEditingItem(null); }}
                                className="py-2.5 px-4 text-sm rounded-xl font-medium bg-red-500/10 text-red-500">
                                Eliminar
                              </button>
                              <button onClick={() => setEditingItem(null)} className={`py-2.5 px-4 text-sm rounded-xl ${c.btnSecondary}`}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Item row */
                          <div className={`flex items-center border-b ${c.border} last:border-b-0`}>
                            {/* Checkbox — large tap target */}
                            <button
                              onClick={() => onToggle(item.id)}
                              className="flex items-center justify-center w-12 h-12 flex-shrink-0"
                            >
                              <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                                item.checked
                                  ? (dark ? 'bg-gray-300 border-gray-300' : 'bg-gray-800 border-gray-800')
                                  : (dark ? 'border-gray-600' : 'border-gray-300')
                              }`}>
                                {item.checked && (
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={dark ? '#111' : '#fff'} strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M2 6l3 3 5-5" />
                                  </svg>
                                )}
                              </div>
                            </button>

                            {/* Name + details — tap to expand actions */}
                            <button
                              onClick={() => setActiveItem(activeItem === item.id ? null : item.id)}
                              className={`flex-1 flex items-center gap-2 py-3 pr-2 min-w-0 text-left ${item.checked ? 'opacity-35' : ''}`}
                            >
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm ${item.checked ? 'line-through' : ''}`}>{item.name}</span>
                                {(item.quantity !== '1' || item.unit !== 'uds') && (
                                  <span className={`text-xs ${c.muted} ml-1.5`}>{item.quantity} {item.unit}</span>
                                )}
                              </div>
                              {item.priority === 'essential' && !item.checked && (
                                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                              )}
                              {item.favorite && (
                                <span className="text-amber-400 text-xs flex-shrink-0">★</span>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Expanded actions — visible on tap (mobile-friendly) */}
                        {activeItem === item.id && editingItem !== item.id && (
                          <div className={`flex items-center gap-1 px-3 py-2 border-b ${c.border} ${dark ? 'bg-gray-800/30' : 'bg-gray-50/80'}`}>
                            <button onClick={() => onUpdateItem(item.id, { favorite: !item.favorite })}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium ${c.btnSecondary} ${c.hover}`}>
                              {item.favorite ? '★ Favorito' : '☆ Favorito'}
                            </button>
                            <button onClick={() => startEdit(item)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium ${c.btnSecondary} ${c.hover}`}>
                              ✏️ Editar
                            </button>
                            <button onClick={() => { onDeleteItem(item.id); setActiveItem(null); }}
                              className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-500">
                              🗑 Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {cat.items.length === 0 && !search && (
                      <button
                        onClick={() => { setAddingTo(cat.id); setAddText(''); }}
                        className={`w-full py-3 text-sm ${c.muted} ${c.hover}`}
                      >
                        + Añadir producto
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAB — add category */}
        <button
          onClick={() => setShowNewCat(true)}
          className={`mt-4 w-full py-3 rounded-xl border-2 border-dashed ${c.border} ${c.muted} text-sm font-medium ${c.hover}`}
        >
          + Nueva categoría
        </button>

        {/* Empty search */}
        {filtered.length === 0 && search && (
          <div className={`text-center py-12 ${c.muted}`}>
            <p className="text-sm">Sin resultados para "{search}"</p>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
