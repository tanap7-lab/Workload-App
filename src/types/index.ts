export interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar_color: string;
  avatar_url?: string;
  weekly_hours: number;
  is_active: number;
}

export interface Week {
  id: number;
  week_number: number;
  year: number;
  created_at: string;
}

export interface Task {
  id: number;
  week_id: number;
  member_id: number;
  priority: string;
  task_name: string;
  effort_hours: number;
  updated_at: string;
}

export type PriorityLevel = '1' | '2' | '3' | '4' | 'ALS';

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  '1': '#EF4444', // Red
  '2': '#F97316', // Orange
  '3': '#F59E0B', // Amber
  '4': '#10B981', // Green
  'ALS': '#3B82F6', // Blue
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  '1': 'Priority 1',
  '2': 'Priority 2',
  '3': 'Priority 3',
  '4': 'Priority 4',
  'ALS': 'Admin/Learning/Social',
};
