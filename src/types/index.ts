export interface List {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  list_id: string;
  parent_id: string | null;
  title: string;
  note: string;
  priority: Priority;
  due_date: string | null;
  is_completed: number;
  completed_at: string | null;
  sort_order: number;
  repeat_rule: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
  tags?: Tag[];
}

export type Priority = 1 | 2 | 3 | 4;

export const PRIORITY_CONFIG = {
  1: { label: "P1", color: "#ef4444", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  2: { label: "P2", color: "#f97316", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
  3: { label: "P3", color: "#3b82f6", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  4: { label: "P4", color: "#9ca3af", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" },
} as const;

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Reminder {
  id: string;
  task_id: string;
  remind_at: string;
  triggered: number;
}

export interface AppSettings {
  theme: "light" | "dark";
}
