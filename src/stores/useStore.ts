import { create } from "zustand";
import type { List, Task, Tag } from "@/types";
import * as db from "@/lib/db";

interface AppState {
  lists: List[];
  tasks: Task[];
  tags: Tag[];
  selectedListId: string | null;
  selectedTaskId: string | null;
  searchQuery: string;
  viewMode: "list" | "today" | "search";

  loadLists: () => Promise<void>;
  loadTasks: (listId: string) => Promise<void>;
  loadTags: () => Promise<void>;
  addList: (name: string, color: string) => Promise<void>;
  removeList: (id: string) => Promise<void>;
  updateListName: (id: string, name: string) => Promise<void>;
  selectList: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  addTask: (title: string, priority?: import("@/types").Priority, parentId?: string | null) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  updateTask: (id: string, data: Partial<Pick<Task, "title" | "note" | "priority" | "due_date" | "is_completed" | "completed_at" | "repeat_rule" | "sort_order" | "list_id">>) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: "list" | "today" | "search") => void;
  searchTasks: (query: string) => Promise<void>;
  loadTodayTasks: () => Promise<void>;
  addTag: (name: string, color: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  lists: [],
  tasks: [],
  tags: [],
  selectedListId: null,
  selectedTaskId: null,
  searchQuery: "",
  viewMode: "list",

  loadLists: async () => {
    const lists = await db.getLists();
    set({ lists });
    if (lists.length > 0 && !get().selectedListId) {
      set({ selectedListId: lists[0].id });
    }
  },

  loadTasks: async (listId: string) => {
    const tasks = await db.getTasks(listId);
    for (const task of tasks) {
      task.subtasks = await db.getSubtasks(task.id);
      task.tags = await db.getTaskTags(task.id);
    }
    set({ tasks });
  },

  loadTags: async () => {
    const tags = await db.getTags();
    set({ tags });
  },

  addList: async (name: string, color: string) => {
    const list = await db.createList(name, color);
    set((state) => ({ lists: [...state.lists, list] }));
  },

  removeList: async (id: string) => {
    await db.deleteList(id);
    const state = get();
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
    if (state.selectedListId === id) {
      const remaining = state.lists.filter((l) => l.id !== id);
      set({
        selectedListId: remaining[0]?.id ?? null,
        tasks: [],
      });
      if (remaining[0]) {
        get().loadTasks(remaining[0].id);
      }
    }
  },

  updateListName: async (id: string, name: string) => {
    await db.updateList(id, { name });
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? { ...l, name } : l)),
    }));
  },

  selectList: (id: string | null) => {
    set({ selectedListId: id, selectedTaskId: null, viewMode: "list" });
    if (id) {
      get().loadTasks(id);
    }
  },

  selectTask: (id: string | null) => {
    set({ selectedTaskId: id });
  },

  addTask: async (title: string, priority = 4, parentId = null) => {
    const state = get();
    const listId = state.selectedListId;
    if (!listId) return;

    const task = await db.createTask(listId, title, priority, parentId);
    if (parentId) {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === parentId ? { ...t, subtasks: [...(t.subtasks ?? []), task] } : t
        ),
      }));
    } else {
      set((s) => ({ tasks: [...s.tasks, task] }));
    }
  },

  removeTask: async (id: string) => {
    await db.deleteTask(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));
  },

  updateTask: async (id, data) => {
    await db.updateTask(id, data);
    const updateTaskInList = (ts: Task[]): Task[] =>
      ts.map((t) => {
        if (t.id === id) return { ...t, ...data };
        if (t.subtasks) return { ...t, subtasks: updateTaskInList(t.subtasks) };
        return t;
      });
    set((s) => ({ tasks: updateTaskInList(s.tasks) }));
  },

  toggleComplete: async (id, completed) => {
    await db.toggleTaskComplete(id, completed);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, is_completed: completed ? 1 : 0, completed_at: completed ? new Date().toISOString() : null }
          : t
      ),
    }));
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode, selectedTaskId: null }),

  searchTasks: async (query: string) => {
    if (!query.trim()) {
      get().setViewMode("list");
      const state = get();
      if (state.selectedListId) get().loadTasks(state.selectedListId);
      return;
    }
    set({ viewMode: "search" });
    const tasks = await db.searchTasks(query);
    set({ tasks });
  },

  loadTodayTasks: async () => {
    set({ viewMode: "today" });
    const tasks = await db.getTodayTasks();
    for (const task of tasks) {
      task.subtasks = await db.getSubtasks(task.id);
      task.tags = await db.getTaskTags(task.id);
    }
    set({ tasks });
  },

  addTag: async (name: string, color: string) => {
    const tag = await db.createTag(name, color);
    set((s) => ({ tags: [...s.tags, tag] }));
  },

  removeTag: async (id: string) => {
    await db.deleteTag(id);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },
}));
