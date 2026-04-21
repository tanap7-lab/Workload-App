import { create } from 'zustand';
import { TeamMember, Week, Task, Category, AvailabilityOverride } from '../types';

interface TeamStore {
  members: TeamMember[];
  categories: Category[];
  currentWeek: Week | null;
  tasks: Task[];
  availability: AvailabilityOverride[];
  loading: boolean;
  error: string | null;
  
  fetchInitialData: (year: number, weekNumber: number) => Promise<void>;
  fetchWeekData: (year: number, weekNumber: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  updateMember: (id: number, settings: Partial<TeamMember>) => Promise<void>;
  addMember: () => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  updateTask: (task: Partial<Task> & { week_id: number; member_id: number; priority: string }) => Promise<void>;
  reorderTasks: (weekId: number, memberId: number, newOrder: Task[]) => Promise<void>;
  carryOver: (fromWeekId: number, toWeekId: number) => Promise<void>;
  saveCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  setAvailability: (data: AvailabilityOverride) => Promise<void>;
  setGlobalHoliday: (weekId: number) => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  members: [],
  categories: [],
  currentWeek: null,
  tasks: [],
  availability: [],
  loading: false,
  error: null,

  fetchInitialData: async (year, weekNumber) => {
    set({ loading: true });
    try {
      // First fetch categories
      const catRes = await fetch('/api/categories');
      const categories = await catRes.json();

      const weekRes = await fetch(`/api/weeks/${year}/${weekNumber}`);
      const { week, tasks, members, availability } = await weekRes.json();
      
      set({ categories, members, currentWeek: week, tasks, availability, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch initial data', loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch('/api/categories');
      const categories = await res.json();
      set({ categories });
    } catch (err) {
      set({ error: 'Failed to fetch categories' });
    }
  },

  fetchWeekData: async (year, weekNumber) => {
    set({ loading: true });
    try {
      const weekRes = await fetch(`/api/weeks/${year}/${weekNumber}`);
      const { week, tasks, members, availability } = await weekRes.json();
      set({ members, currentWeek: week, tasks, availability, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch week data', loading: false });
    }
  },

  updateMember: async (id, settings) => {
    try {
      await fetch(`/api/team-members/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const members = get().members.map(m => m.id === id ? { ...m, ...settings } : m);
      set({ members });
    } catch (err) {
      set({ error: 'Failed to update member' });
    }
  },

  addMember: async () => {
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'New Member', 
          role: 'Team Member', 
          weekly_hours: 40,
          avatar_color: '#' + Math.floor(Math.random()*16777215).toString(16)
        }),
      });
      const result = await res.json();
      
      const membersRes = await fetch('/api/team-members');
      const members = await membersRes.json();
      set({ members });
    } catch (err) {
      set({ error: 'Failed to add member' });
    }
  },

  deleteMember: async (id) => {
    if (!confirm('Are you sure you want to remove this team member from future weeks? Historical data will be preserved.')) return;
    try {
      await fetch(`/api/team-members/${id}/toggle`, { method: 'POST' });
      const week = get().currentWeek;
      if (week) {
        await get().fetchWeekData(week.year, week.week_number);
      }
    } catch (err) {
      set({ error: 'Failed to deactivate member' });
    }
  },

  updateTask: async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(taskData),
       });
       const result = await res.json();
      
      // Update local state
      const updatedTasks = [...get().tasks];
      const index = updatedTasks.findIndex(t => 
        t.week_id === taskData.week_id && 
        t.member_id === taskData.member_id && 
        t.priority === taskData.priority
      );
      
      if (index > -1) {
        updatedTasks[index] = { ...updatedTasks[index], ...taskData, id: result.id };
      } else {
        updatedTasks.push({ ...taskData, id: result.id } as Task);
      }
      
      set({ tasks: updatedTasks });
    } catch (err) {
      set({ error: 'Failed to update task' });
    }
  },

  reorderTasks: async (weekId, memberId, newOrder) => {
    try {
      // Optimistically update local state
      const otherTasks = get().tasks.filter(t => t.week_id !== weekId || t.member_id !== memberId);
      set({ tasks: [...otherTasks, ...newOrder] });

      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          week_id: weekId, 
          member_id: memberId, 
          newOrder: newOrder.map(t => ({ 
            priority: t.priority, 
            task_name: t.task_name, 
            effort_hours: t.effort_hours 
          })) 
        }),
      });
    } catch (err) {
      set({ error: 'Failed to reorder tasks' });
    }
  },

  carryOver: async (fromWeekId, toWeekId) => {
    set({ loading: true });
    try {
      await fetch('/api/weeks/carry-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_week_id: fromWeekId, to_week_id: toWeekId }),
      });
      
      // Re-fetch current week data
      const week = get().currentWeek;
      if (week) {
        await get().fetchWeekData(week.year, week.week_number);
      }
    } catch (err) {
      set({ error: 'Failed to carry over tasks', loading: false });
    }
  },

  saveCategory: async (categoryData) => {
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      await get().fetchCategories();
    } catch (err) {
      set({ error: 'Failed to save category' });
    }
  },

  deleteCategory: async (id) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      await get().fetchCategories();
    } catch (err) {
      set({ error: 'Failed to delete category' });
    }
  },

  setAvailability: async (data) => {
    try {
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const availability = [...get().availability];
      const index = availability.findIndex(a => a.member_id === data.member_id);
      if (index > -1) {
        availability[index] = data;
      } else {
        availability.push(data);
      }
      set({ availability });
    } catch (err) {
      set({ error: 'Failed to set availability' });
    }
  },

  setGlobalHoliday: async (weekId) => {
    set({ loading: true });
    try {
      await fetch(`/api/weeks/${weekId}/global-holiday`, { method: 'POST' });
      // Re-fetch everything for this week to ensure state is accurate
      const week = get().currentWeek;
      if (week) {
        await get().fetchWeekData(week.year, week.week_number);
      }
    } catch (err) {
      set({ error: 'Failed to set global holiday', loading: false });
    }
  }
}));
