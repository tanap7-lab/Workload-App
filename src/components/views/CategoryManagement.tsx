import React, { useState } from 'react';
import { useTeamStore } from '../../hooks/useTeamStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Trash2, Plus, Tag, Palette, LayoutGrid, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/helpers';

export const CategoryManagement = () => {
  const categories = useTeamStore(state => state.categories);
  const saveCategory = useTeamStore(state => state.saveCategory);
  const deleteCategory = useTeamStore(state => state.deleteCategory);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [newAbbr, setNewAbbr] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newPriority, setNewPriority] = useState(3);

  const handleSelectCategory = (cat: any) => {
    setEditingId(cat.id);
    setNewAbbr(cat.abbreviation);
    setNewName(cat.fullName);
    setNewColor(cat.color);
    setNewPriority(cat.priority_level);
  };

  const handleReset = () => {
    setEditingId(null);
    setNewAbbr('');
    setNewName('');
    setNewColor('#6366f1');
    setNewPriority(3);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAbbr || !newName) return;

    await saveCategory({
      id: editingId || undefined,
      abbreviation: newAbbr.toUpperCase(),
      fullName: newName,
      color: newColor,
      priority_level: newPriority
    });

    handleReset();
  };

  const presetColors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', 
    '#3B82F6', '#6366f1', '#8B5CF6', '#EC4899', 
    '#64748B', '#000000'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Category Management</h2>
          <p className="text-sm text-slate-400 font-medium">Standardize task classifications and visual coding across the team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Category Form */}
        <Card className="p-8 h-fit lg:sticky lg:top-8 border-2 border-orange-50 shadow-xl shadow-orange-900/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                {editingId ? <Palette className="text-[#FF4208]" size={20} /> : <Plus className="text-[#FF4208]" size={20} />}
              </div>
              <h3 className="font-extrabold text-slate-800">{editingId ? 'Edit Category' : 'Add New Category'}</h3>
            </div>
            {editingId && (
              <button onClick={handleReset} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleAdd} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Abbreviation</label>
              <input 
                type="text" 
                value={newAbbr}
                onChange={(e) => setNewAbbr(e.target.value)}
                placeholder="e.g. SAT"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#FF4208] focus:ring-4 focus:ring-orange-500/5 transition-all text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Description</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. System Acceptance Testing"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#FF4208] focus:ring-4 focus:ring-orange-500/5 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Visual Coding (Color)</label>
              <div className="flex flex-wrap gap-2 justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {presetColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all scale-90 hover:scale-110",
                      newColor === color ? "border-white ring-2 ring-orange-500 scale-100" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Analytics Weight (1-5)
              </label>
              <input 
                type="range" 
                min="1" 
                max="5"
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#FF4208]"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-1">
                <span>Critical</span>
                <span>Operational</span>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-[#FF4208] transition-all shadow-lg hover:shadow-[#FF4208]/20 font-black text-sm gap-2 mt-4 group">
              {editingId ? <Palette size={18} /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
              {editingId ? 'Update Category' : 'Save Category'}
            </Button>
          </form>
        </Card>

        {/* Categories List */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelectCategory(cat)}
                className="cursor-pointer"
              >
                <Card className={cn(
                  "p-5 flex items-center gap-6 transition-all group border-2",
                  editingId === cat.id ? "border-[#FF4208] bg-orange-50/30 ring-4 ring-orange-500/5 shadow-inner" : "hover:border-orange-100"
                )}>
                  <div 
                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black text-xs shadow-lg shrink-0 relative overflow-hidden"
                    style={{ backgroundColor: cat.color }}
                  >
                    <div className="absolute inset-0 bg-black/5" />
                    <span className="relative z-10">{cat.abbreviation}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-800 truncate">{cat.fullName}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <LayoutGrid size={10} className="text-slate-300" />
                        Level {cat.priority_level} Priority
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {confirmDeleteId === cat.id ? (
                      <>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(null);
                            deleteCategory(cat.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition-colors active:scale-95"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors active:scale-95"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {categories.length === 0 && (
            <div className="py-20 flex flex-col items-center text-center space-y-4 rounded-3xl border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                <Tag size={32} />
              </div>
              <div>
                <h4 className="font-bold text-slate-400">No categories defined</h4>
                <p className="text-sm text-slate-300">Add your first task category to start classification.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
