import React, { useState, useEffect } from 'react';
import { TeamMember, Task, PriorityLevel, PRIORITY_COLORS } from '../../types';
import { useTeamStore } from '../../hooks/useTeamStore';
import { Card } from '../ui/Card';
import { cn } from '../../utils/helpers';
import { CheckCircle2, Clock, GripVertical } from 'lucide-react';
import { Reorder } from 'motion/react';

interface MemberCardProps {
  member: TeamMember;
  tasks: Task[];
  weekId: number;
  key?: React.Key;
}

export const MemberCard = ({ member, tasks, weekId }: MemberCardProps) => {
  const updateTask = useTeamStore(state => state.updateTask);
  const reorderTasks = useTeamStore(state => state.reorderTasks);
  
  // Local state for the ordered priorities (P1-P4)
  const [prioTasks, setPrioTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Filter and sort P1-P4 tasks based on their current priority
    const filtered = ['1', '2', '3', '4'].map(prio => {
      const task = tasks.find(t => t.priority === prio);
      return task || { 
        week_id: weekId, 
        member_id: member.id, 
        priority: prio, 
        task_name: '', 
        effort_hours: 0,
        id: Math.random() // Temp ID for new tasks
      } as Task;
    });
    setPrioTasks(filtered);
  }, [tasks, weekId, member.id]);

  const handleReorder = (newItems: Task[]) => {
    setPrioTasks(newItems);
    
    // Map the new positions back to their priority level '1' through '4'
    const updatedOrder = newItems.map((task, index) => ({
      ...task,
      priority: (index + 1).toString()
    }));

    reorderTasks(weekId, member.id, updatedOrder);
  };

  const getALS = () => tasks.find(t => t.priority === 'ALS');

  const renderRow = (task: Task, priorityLabel: string, isALS = false) => {
    const priority = task.priority as PriorityLevel;

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
        <div 
          className={cn("w-1 h-6 rounded-full shrink-0", isALS && "ml-5")}
          style={{ backgroundColor: PRIORITY_COLORS[isALS ? 'ALS' : priority] }}
        />
        
        <input
          type="text"
          defaultValue={task.task_name || (isALS ? 'Admin/Learning/Social' : '')}
          placeholder={isALS ? 'ALS' : `Priority ${priorityLabel} Task`}
          readOnly={isALS}
          disabled={isALS}
          className={cn(
            "flex-1 bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-100 rounded px-2 py-1 text-[13px] font-medium text-slate-700 placeholder:text-slate-300 transition-all",
            isALS && "text-slate-400 italic"
          )}
          onBlur={(e) => {
            if (!isALS && e.target.value !== task.task_name) {
              updateTask({
                week_id: weekId,
                member_id: member.id,
                priority: priorityLabel,
                task_name: e.target.value,
                effort_hours: task.effort_hours || 0
              });
            }
          }}
        />

        <div className="flex items-center gap-1">
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
                  effort_hours: val
                });
              }
            }}
          />
        </div>
      </div>
    );
  };

  const totalHours = tasks.reduce((sum, t) => sum + (t.effort_hours || 0), 0);
  const weeklyCapacity = member.weekly_hours || 40;
  const isComplete = tasks.length >= 5 && totalHours >= (weeklyCapacity * 0.875); // Roughly 35/40

  return (
    <Card className="bento-card flex flex-col h-full overflow-hidden">
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
      </div>

      <div className="p-4 flex-1 space-y-0.5">
        <Reorder.Group axis="y" values={prioTasks} onReorder={handleReorder} className="space-y-0.5">
          {prioTasks.map((task, idx) => (
            <Reorder.Item key={task.id || idx} value={task}>
              {renderRow(task, (idx + 1).toString())}
            </Reorder.Item>
          ))}
        </Reorder.Group>
        
        {renderRow(getALS() || { week_id: weekId, member_id: member.id, priority: 'ALS', task_name: '', effort_hours: 0, id: 0 } as Task, 'ALS', true)}
      </div>
    </Card>
  );
};
