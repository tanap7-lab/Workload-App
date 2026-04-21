import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TeamMember, Task, Category, PriorityLevel, PRIORITY_COLORS } from '../../types';
import { useTeamStore } from '../../hooks/useTeamStore';
import { Card } from '../ui/Card';
import { cn } from '../../utils/helpers';
import { GripVertical, AlertTriangle, Clock, Calendar, ChevronDown } from 'lucide-react';
import { Reorder } from 'motion/react';
interface MemberCardProps {
  member: TeamMember;
  tasks: Task[];
  weekId: number;
  key?: React.Key;
}

const AVAILABILITY_REASONS = [
  'Regular Week',
  'Public Holiday',
  'Sick Leave',
  'Personal Leave',
  'Training / Workshop',
  'Business Trip',
  'Other'
];

export const MemberCard = ({ member, tasks, weekId }: MemberCardProps) => {
  const updateTask = useTeamStore(state => state.updateTask);
  const reorderTasks = useTeamStore(state => state.reorderTasks);
  const categories = useTeamStore(state => state.categories);
  const availabilityOverrides = useTeamStore(state => state.availability);
  const setAvailability = useTeamStore(state => state.setAvailability);

  const [prioTasks, setPrioTasks] = useState<Task[]>([]);

  useEffect(() => {
    const filtered = ['1', '2', '3', '4'].map(prio => {
      const task = tasks.find(t => t.priority === prio);
      return task || {
        week_id: weekId,
        member_id: member.id,
        priority: prio,
        task_name: '',
        effort_hours: 0,
        id: Math.random()
      } as Task;
    });
    setPrioTasks(filtered);
  }, [tasks, weekId, member.id]);

  const handleReorder = (newItems: Task[]) => {
    setPrioTasks(newItems);
    const updatedOrder = newItems.map((task, index) => ({
      ...task,
      priority: (index + 1).toString()
    }));
    reorderTasks(weekId, member.id, updatedOrder);
  };

  const [activeDropdown, setActiveDropdown] = useState<number | string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  
  const [isCapacityOpen, setIsCapacityOpen] = useState(false);
  const [capacityRect, setCapacityRect] = useState<DOMRect | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
      setIsCapacityOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleCategorySelect = (task: Task, abbr: string | null) => {
    updateTask({
      ...task,
      category_abbr: abbr || undefined
    });
    setActiveDropdown(null);
  };

  /** Resolve the bar color: category color → priority fallback */
  const getBarColor = (task: Task, isALS: boolean): string => {
    if (isALS) return PRIORITY_COLORS['ALS'];
    if (task.category_abbr) {
      const cat = categories.find(c => c.abbreviation === task.category_abbr);
      if (cat) return cat.color;
      // Category was deleted — signal with rose red
      return '#FDA4AF';
    }
    return PRIORITY_COLORS[task.priority as PriorityLevel] ?? '#CBD5E1';
  };

  /** True if task has a category_abbr that no longer exists in the categories list */
  const isCategoryMissing = (task: Task): boolean =>
    !!task.category_abbr && !categories.find(c => c.abbreviation === task.category_abbr);

  const getALS = () => tasks.find(t => t.priority === 'ALS');

  const renderRow = (task: Task, priorityLabel: string, isALS = false) => {
    const barColor = getBarColor(task, isALS);
    const missing = !isALS && isCategoryMissing(task);
    const isOpen = activeDropdown === task.id;

    return (
      <div className={cn(
        "group flex items-center gap-2 py-1.5",
        isALS && "mt-4 pt-2 border-t border-dashed border-slate-200"
      )}>
        {!isALS && (
          <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={14} />
          </div>
        )}

        {/* Category color bar */}
        <div
          className={cn("w-1 h-6 rounded-full shrink-0 transition-colors duration-300", isALS && "ml-5")}
          style={{ backgroundColor: barColor }}
          title={task.category_abbr || (isALS ? 'ALS' : 'Uncategorized')}
        />

        {/* Category badge / Dropdown */}
        {!isALS && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setDropdownRect(rect);
                setActiveDropdown(isOpen ? null : task.id);
              }}
              className={cn(
                "text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 transition-all active:scale-95",
                !task.category_abbr && "bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 border border-slate-200 border-dashed"
              )}
              style={task.category_abbr ? { backgroundColor: `${barColor}20`, color: barColor } : {}}
            >
              {missing ? '⚠' : (task.category_abbr || 'SET')}
            </button>

            {/* Dropdown Menu - rendered via Portal to avoid clipping */}
            {isOpen && dropdownRect && createPortal(
              <div 
                className="fixed bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[9999] animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                  top: dropdownRect.bottom + 8,
                  left: dropdownRect.left,
                  width: '192px' // w-48 equivalent
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 mb-1 border-b border-slate-50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Category</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(task, cat.abbreviation)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left group/item"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-slate-800 uppercase leading-none">{cat.abbreviation}</span>
                        <span className="text-[9px] font-medium text-slate-400 truncate">{cat.fullName}</span>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-50 mt-1 pt-1">
                    <button
                      onClick={() => handleCategorySelect(task, null)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-rose-50 text-rose-500 transition-colors text-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-200" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Clear Category</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* Task name input */}
        <input
          type="text"
          defaultValue={task.task_name || (isALS ? 'Admin/Learning/Social' : '')}
          placeholder={isALS ? 'ALS' : `Priority ${priorityLabel} Task`}
          readOnly={isALS}
          disabled={isALS}
          className={cn(
            "flex-1 min-w-0 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-100 rounded px-2 py-1 text-[13px] font-medium text-slate-700 placeholder:text-slate-300 transition-all",
            isALS && "text-slate-400 italic",
            missing && "text-rose-400"
          )}
          onBlur={(e) => {
            if (!isALS && e.target.value !== task.task_name) {
              updateTask({
                week_id: weekId,
                member_id: member.id,
                priority: priorityLabel,
                task_name: e.target.value,
                category_abbr: task.category_abbr,
                effort_hours: task.effort_hours || 0
              });
            }
          }}
        />

        {/* Missing category warning icon */}
        {missing && (
          <span title="Category was deleted" className="text-rose-400 shrink-0">
            <AlertTriangle size={12} />
          </span>
        )}

        {/* Effort hours */}
        <input
          type="number"
          min="0"
          max="40"
          step="0.5"
          defaultValue={task.effort_hours || 0}
          className="w-12 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-100 rounded px-1.5 py-1 text-xs font-bold text-[#FF4208] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
          onBlur={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val !== task.effort_hours) {
              updateTask({
                week_id: weekId,
                member_id: member.id,
                priority: priorityLabel,
                task_name: task.task_name || (isALS ? 'Admin/Learning/Social' : ''),
                category_abbr: task.category_abbr,
                effort_hours: val
              });
            }
          }}
        />
      </div>
    );
  };

  const override = availabilityOverrides.find(a => a.member_id === member.id && a.week_id === weekId);
  const capacity = override ? override.available_hours : (member.weekly_hours || 40);
  const isReduced = capacity < (member.weekly_hours || 40);

  const totalHours = tasks.reduce((sum, t) => sum + (t.effort_hours || 0), 0);
  const ftePercentage = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;

  return (
    <Card className="bento-card flex flex-col h-full overflow-hidden pdf-page-section">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner shadow-black/10 overflow-hidden"
            style={{ backgroundColor: !member.avatar_url ? member.avatar_color : undefined }}
          >
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              member.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{member.name}</h3>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setCapacityRect(rect);
            setIsCapacityOpen(!isCapacityOpen);
          }}
          className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all",
            isReduced ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "text-slate-400 hover:bg-slate-50"
          )}
          title={override?.reason || 'Standard Capacity'}
        >
          {totalHours}h / {capacity}h
        </button>

        {/* Capacity Adjustment Popover */}
        {isCapacityOpen && capacityRect && createPortal(
          <div 
            className="fixed bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[9999] w-64 animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              top: capacityRect.bottom + 8,
              left: Math.max(10, capacityRect.left - 100),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
              <Calendar size={14} className="text-orange-500" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Weekly Availability</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Available Hours</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={capacity}
                    onChange={(e) => setAvailability({
                      week_id: weekId,
                      member_id: member.id,
                      available_hours: parseFloat(e.target.value) || 0,
                      reason: override?.reason || 'Regular Week'
                    })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-orange-500 outline-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400">HRS</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Change Reason</label>
                <select 
                  value={override?.reason || 'Regular Week'}
                  onChange={(e) => setAvailability({
                    week_id: weekId,
                    member_id: member.id,
                    available_hours: capacity,
                    reason: e.target.value
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-orange-500 outline-none"
                >
                  {AVAILABILITY_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {isReduced && (
                <div className="bg-orange-50 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-orange-700 leading-tight">
                    Reduced capacity affects FTE calculation for this week.
                  </p>
                </div>
              )}

              <button
                className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 h-8 transition-colors"
                onClick={() => {
                  setAvailability({
                    week_id: weekId,
                    member_id: member.id,
                    available_hours: member.weekly_hours || 40,
                    reason: 'Regular Week'
                  });
                  setIsCapacityOpen(false);
                }}
              >
                Reset to {member.weekly_hours || 40}H
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      <div className="p-4 flex-1 space-y-0.5">
        <Reorder.Group axis="y" values={prioTasks} onReorder={handleReorder} className="space-y-0.5">
          {prioTasks.map((task, idx) => (
            <Reorder.Item key={task.id || idx} value={task}>
              {renderRow(task, (idx + 1).toString())}
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {renderRow(
          getALS() || { week_id: weekId, member_id: member.id, priority: 'ALS', task_name: '', effort_hours: 0, id: 0 } as Task,
          'ALS',
          true
        )}
      </div>
    </Card>
  );
};
