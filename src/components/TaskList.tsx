import { useStore } from "@/stores/useStore";
import TaskItem from "./TaskItem";
import AddTask from "./AddTask";
import { Inbox, CalendarDays, Search } from "lucide-react";
import { useRef } from "react";
import type { Task } from "@/types";

export default function TaskList() {
  const { tasks, selectedListId, lists, viewMode, addTask, updateTask } = useStore();
  const dragId = useRef<string | null>(null);

  const currentList = lists.find((l) => l.id === selectedListId);

  const viewTitle = () => {
    if (viewMode === "today") return "今天";
    if (viewMode === "search") return "搜索结果";
    return currentList?.name ?? "任务";
  };

  const ViewIcon = () => {
    if (viewMode === "today") return <CalendarDays className="h-5 w-5" />;
    if (viewMode === "search") return <Search className="h-5 w-5" />;
    return <Inbox className="h-5 w-5" />;
  };

  const activeTasks = tasks.filter((t) => t.is_completed === 0);
  const completedTasks = tasks.filter((t) => t.is_completed === 1);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragId.current;
    if (!sourceId || sourceId === targetId) return;

    const sourceTask = tasks.find((t) => t.id === sourceId);
    const targetTask = tasks.find((t) => t.id === targetId);
    if (!sourceTask || !targetTask) return;

    await updateTask(sourceId, { sort_order: targetTask.sort_order });
    await updateTask(targetId, { sort_order: sourceTask.sort_order });
    dragId.current = null;
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <ViewIcon />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{viewTitle()}</h2>
        <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {activeTasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Inbox className="mb-3 h-10 w-10" />
            <p className="text-sm">暂无任务</p>
            <p className="text-xs">添加你的第一个任务吧</p>
          </div>
        )}

        {activeTasks.map((task) => (
          <TaskItem key={task.id} task={task} onDragStart={handleDragStart} onDrop={handleDrop} />
        ))}

        {completedTasks.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-gray-400">
              已完成 ({completedTasks.length})
            </div>
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} onDragStart={handleDragStart} onDrop={handleDrop} />
            ))}
          </>
        )}
      </div>

      {viewMode !== "search" && <AddTask onAdd={(title) => addTask(title)} />}
    </div>
  );
}
