/* client/src/types/mealPlanCanvas.ts */

import { ParsedMeal } from '../utils/mealParser';

export interface WeekMealPlan {
  weekStart: Date;
  weekEnd: Date;
  days: DayMealPlan[];
  totalCost: number;
  completionPercentage: number;
}

export interface DayMealPlan {
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: Date;
  meals: MealSlot[];
  status: 'empty' | 'planning' | 'partial' | 'complete' | 'approved';
  conversationThreadId?: string;
}

export interface MealSlot {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal?: ParsedMeal;
  status: 'empty' | 'suggested' | 'accepted' | 'cooking' | 'completed';
}

export interface ConversationThread {
  id: string;
  dayName: string;
  messages: any[]; // Will be Message[] from ChatPage
  startedAt: Date;
  lastMessageAt: Date;
  isCollapsed: boolean;
}

export interface CanvasState {
  activeDay: string | null;
  expandedThread: string | null;
  viewMode: 'week' | 'day';
}

export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

/**
 * Get day of week as DayName from a date
 */
export const getDayName = (date: Date): DayName => {
  const days: DayName[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Get start of week (Monday) from a date
 */
export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

/**
 * Get end of week (Sunday) from a date
 */
export const getWeekEnd = (date: Date = new Date()): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

/**
 * Create an empty week plan
 */
export const createEmptyWeekPlan = (startDate: Date = new Date()): WeekMealPlan => {
  const weekStart = getWeekStart(startDate);
  const weekEnd = getWeekEnd(startDate);

  const days: DayMealPlan[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ].map((dayName, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    return {
      dayName: dayName as DayName,
      date,
      meals: [
        { mealType: 'breakfast', status: 'empty' },
        { mealType: 'lunch', status: 'empty' },
        { mealType: 'dinner', status: 'empty' },
      ],
      status: 'empty',
    };
  });

  return {
    weekStart,
    weekEnd,
    days,
    totalCost: 0,
    completionPercentage: 0,
  };
};

/**
 * Calculate completion percentage of week plan
 */
export const calculateCompletion = (days: DayMealPlan[]): number => {
  const totalSlots = days.reduce((sum, day) => sum + day.meals.length, 0);
  // Count all non-empty meals (suggested, accepted, cooking, completed)
  const filledSlots = days.reduce(
    (sum, day) => sum + day.meals.filter(m => m.status !== 'empty').length,
    0
  );

  return totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
};

/**
 * Get status color for a day or meal slot
 */
export const getStatusColor = (status: DayMealPlan['status'] | MealSlot['status']): string => {
  switch (status) {
    case 'empty':
      return 'rgba(255,255,255,0.2)';
    case 'planning':
    case 'suggested':
      return '#FFD93D'; // Citrus Yellow
    case 'partial':
      return '#F4A460'; // Honey Gold
    case 'complete':
    case 'accepted':
      return '#05AF5C'; // Basil Green
    case 'approved':
      return '#05AF5C'; // Basil Green
    case 'cooking':
      return '#FF6B35'; // Chef Orange
    case 'completed':
      return '#05AF5C'; // Basil Green
    default:
      return 'rgba(255,255,255,0.2)';
  }
};

/**
 * Get day color from Culinary Spectrum palette
 */
export const getDayColor = (dayName: DayName): string => {
  const dayColors: Record<DayName, string> = {
    'Monday': '#FF6B35',    // Chef Orange
    'Tuesday': '#05AF5C',   // Basil Green
    'Wednesday': '#F4A460', // Honey Gold
    'Thursday': '#6A4C93',  // Plum Wine
    'Friday': '#FFD93D',    // Citrus Yellow
    'Saturday': '#FF8C5A',  // Light Orange
    'Sunday': '#37BF7E',    // Light Green
  };

  return dayColors[dayName] || '#FF6B35';
};

/**
 * Extract day context from message text
 */
export const extractDayContext = (text: string): DayName | null => {
  const days: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const lowerText = text.toLowerCase();

  for (const day of days) {
    if (lowerText.includes(day.toLowerCase())) {
      return day;
    }
  }

  return null;
};
