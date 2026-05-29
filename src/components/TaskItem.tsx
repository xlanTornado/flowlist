import { useState, useRef, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import type { Task } from "@/types";
import { PRIORITY_CONFIG } from "@/types";
import { Circle, CheckCircle2, Trash2, ChevronDown, ChevronRight, Calendar, GripVertical } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";

interface Props {
  task: Task;
  level?: number;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDrop?: (e: React.DragEvent, taskId: string) => void;
}

export default function TaskItem({ task, level = 0, onDragStart, onDrop }: Props) {
  const { selectTask, selectedTaskId, toggleComplete, removeTask } = useStore();
  const isSelected = selectedTaskId === task.id;
  const isCompleted = task.is_completed === 1;
  const [expanded, setExpanded] = useState(true);

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isToday(d)) return { text: "今天", className: "text-amber-600 dark:text-amber-400" };
    if (isTomorrow(d)) return { text: "明天", className: "text-blue-600 dark:text-blue-400" };
    if (isPast(d)) return { text: format(d, "MM-dd"), className: "text-red-500" };
    return { text: format(d, "MM-dd"), className: "text-gray-400" };
  };

  const dueInfo = formatDueDate(task.due_date);
  const pConf = PRIORITY_CONFIG[task.priority];

  return (
    <div>
      <div
        onClick={() => selectTask(task.id)}
        draggable
        onDragStart={(e) => onDragStart?.(e, task.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop?.(e, task.id);
        }}
        className={`group flex items-center gap-2 border-b border-gray-100 px-3 py-2 transition-colors dark:border-gray-800 ${
          isSelected
            ? "bg-indigo-50 dark:bg-indigo-900/20"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <GripVertical className="hidden h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:block" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleComplete(task.id, !isCompleted);
          }}
          className="shrink-0 text-gray-300 hover:text-indigo-500 dark:text-gray-600"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${isCompleted ? "text-gray-400 line-through dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}`}>
            {task.title}
          </span>
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="text-xs text-gray-400">
              {task.subtasks.filter((s) => s.is_completed === 1).length}/{task.subtasks.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {dueInfo && (
            <span className={`flex items-center gap-0.5 text-xs ${dueInfo.className}`}>
              <Calendar className="h-3 w-3" />
              {dueInfo.text}
            </span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${pConf.bg} ${pConf.text}`}>
            {pConf.label}
          </span>
          {task.subtasks && task.subtasks.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTask(task.id);
            }}
            className="hidden rounded p-0.5 text-gray-300 hover:text-red-500 group-hover:block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && task.subtasks?.map((sub) => (
        <TaskItem key={sub.id} task={sub} level={level + 1} />
      ))}
    </div>
  );
}
