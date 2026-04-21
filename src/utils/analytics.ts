import { Task, Category, TeamMember } from '../types';

export interface CategoryEffort {
  name: string;
  fullName: string;
  value: number;
  color: string;
  weight: number;
}

export interface MemberCategoryEffort {
  name: string;
  [categoryAbbr: string]: string | number;
}

/**
 * Groups all tasks by category abbreviation and sums total hours.
 */
export const aggregateByCategory = (tasks: Task[], categories: Category[]): CategoryEffort[] => {
  const effortMap: Record<string, number> = {};
  
  tasks.forEach(task => {
    if (task.category_abbr) {
      effortMap[task.category_abbr] = (effortMap[task.category_abbr] || 0) + (task.effort_hours || 0);
    }
  });

  return categories.map(cat => ({
    name: cat.abbreviation,
    fullName: cat.fullName,
    value: effortMap[cat.abbreviation] || 0,
    color: cat.color,
    weight: cat.priority_level
  })).filter(c => c.value > 0);
};

/**
 * Aggregates effort by member and category for stacked bar charts.
 */
export const aggregateByMemberCategory = (members: TeamMember[], tasks: Task[], categories: Category[]): MemberCategoryEffort[] => {
  return members.map(member => {
    const memberTasks = tasks.filter(t => t.member_id === member.id);
    const effort: MemberCategoryEffort = { name: member.name };
    
    categories.forEach(cat => {
      const catTasks = memberTasks.filter(t => t.category_abbr === cat.abbreviation);
      effort[cat.abbreviation] = catTasks.reduce((sum, t) => sum + (t.effort_hours || 0), 0);
    });
    
    return effort;
  });
};

/**
 * Calculates the percentage of total hours classified as 'Strategic' (Priority Level 1-2).
 */
export const calculateStrategicScore = (tasks: Task[], categories: Category[]): number => {
  const totalHours = tasks.reduce((sum, t) => sum + (t.effort_hours || 0), 0);
  if (totalHours === 0) return 0;

  const strategicCategories = categories
    .filter(c => c.priority_level <= 2)
    .map(c => c.abbreviation);

  const strategicHours = tasks
    .filter(t => t.category_abbr && strategicCategories.includes(t.category_abbr))
    .reduce((sum, t) => sum + (t.effort_hours || 0), 0);

  return Math.round((strategicHours / totalHours) * 100);
};

/**
 * Groups hours by Analytics Weight (1-5) for Radar analysis.
 */
export const aggregateByWeight = (tasks: Task[], categories: Category[]) => {
  const weightMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  tasks.forEach(task => {
    if (task.category_abbr) {
      const cat = categories.find(c => c.abbreviation === task.category_abbr);
      if (cat) {
        weightMap[cat.priority_level] += (task.effort_hours || 0);
      }
    }
  });

  return Object.entries(weightMap).map(([weight, hours]) => ({
    subject: `Level ${weight}`,
    A: hours,
    fullMark: Math.max(...Object.values(weightMap), 10)
  }));
};
