import { useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { useReminders } from "@/hooks/useReminders";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";

export default function App() {
  const { loadLists, loadTags, selectedListId, loadTasks, selectedTaskId } = useStore();

  useReminders();
  useGlobalShortcuts();
  useTheme();

  useEffect(() => {
    loadLists();
    loadTags();
  }, []);

  useEffect(() => {
    if (selectedListId) {
      loadTasks(selectedListId);
    }
  }, [selectedListId]);

  return (
    <div className="flex h-screen w-screen select-none overflow-hidden bg-white dark:bg-gray-950">
      <Sidebar />
      <TaskList />
      {selectedTaskId ? (
        <TaskDetail />
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-300 dark:text-gray-600">
          <div className="text-center">
            <svg className="mx-auto mb-4 h-16 w-16 opacity-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <p className="text-sm">选择任务查看或编辑详情</p>
          </div>
        </div>
      )}
    </div>
  );
}
