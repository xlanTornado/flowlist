import { useState, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { PRIORITY_CONFIG } from "@/types";
import type { Priority } from "@/types";
import { Trash2, Calendar, Flag, ListPlus, X, Plus, Tag, Repeat } from "lucide-react";
import { format } from "date-fns";
import { removeTaskTag, addTaskTag, getTaskTags } from "@/lib/db";
import AddTask from "./AddTask";

const REPEAT_LABELS: Record<string, string> = {
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
  weekdays: "工作日",
  yearly: "每年",
};

export default function TaskDetail() {
  const { tasks, selectedTaskId, updateTask, removeTask, selectTask, addTask, tags, addTag, removeTag } = useStore();
  const task = tasks.find((t) => t.id === selectedTaskId);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [showPriority, setShowPriority] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note || "");
    }
  }, [selectedTaskId, task?.title, task?.note]);

  if (!task) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        <div className="text-center">
          <Flag className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm">选择任务查看详情</p>
        </div>
      </div>
    );
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const handleNoteBlur = () => {
    if (note !== (task.note || "")) {
      updateTask(task.id, { note });
    }
  };

  const handlePriorityChange = (p: Priority) => {
    updateTask(task.id, { priority: p });
    setShowPriority(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateTask(task.id, { due_date: val ? new Date(val).toISOString() : null });
    setShowDate(false);
  };

  const handleTagToggle = async (tagId: string) => {
    const hasTag = task.tags?.some((t) => t.id === tagId);
    if (hasTag) {
      await removeTaskTag(task.id, tagId);
    } else {
      await addTaskTag(task.id, tagId);
    }
    const newTags = await getTaskTags(task.id);
    updateTask(task.id, {});
  };

  const handleDeleteTask = () => {
    removeTask(task.id);
  };

  const pConf = PRIORITY_CONFIG[task.priority];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="flex-1 bg-transparent text-lg font-semibold text-gray-800 outline-none dark:text-gray-100"
          />
          <button
            onClick={handleDeleteTask}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowPriority(!showPriority)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pConf.bg} ${pConf.text}`}
            >
              <Flag className="h-3 w-3" />
              {pConf.label}
            </button>
            {showPriority && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {([1, 2, 3, 4] as Priority[]).map((p) => {
                  const c = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => handlePriorityChange(p)}
                      className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs whitespace-nowrap w-full hover:bg-gray-100 dark:hover:bg-gray-700 ${c.text}`}
                    >
                      <Flag className="h-3 w-3" />
                      P{p} {p === 1 ? "紧急" : p === 2 ? "重要" : p === 3 ? "普通" : "低优先"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDate(!showDate)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                task.due_date
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "截止日"}
            </button>
            {showDate && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <input
                  type="date"
                  defaultValue={task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : ""}
                  onChange={handleDateChange}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
                {task.due_date && (
                  <button
                    onClick={() => updateTask(task.id, { due_date: null })}
                    className="ml-2 text-xs text-red-500 hover:text-red-600"
                  >
                    清除
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Tag className="h-3 w-3" />
              标签
            </button>
            {showTagMenu && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => { handleTagToggle(tag.id); setShowTagMenu(false); }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-gray-700 dark:text-gray-200">{tag.name}</span>
                    {task.tags?.some((t) => t.id === tag.id) && <X className="ml-auto h-3 w-3 text-gray-400" />}
                  </button>
                ))}
                {tags.length === 0 && (
                  <p className="px-2 py-1 text-xs text-gray-400">暂无标签</p>
                )}
                <div className="mt-1 border-t border-gray-100 pt-1 dark:border-gray-700">
                  <div className="flex gap-1">
                    <input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="新标签名"
                      className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none dark:border-gray-600 dark:bg-gray-700"
                    />
                    <button
                      onClick={async () => {
                        if (!newTagName.trim()) return;
                        await addTag(newTagName.trim(), newTagColor);
                        setNewTagName("");
                        setShowTagMenu(false);
                      }}
                      className="rounded bg-indigo-500 px-2 py-1 text-xs text-white hover:bg-indigo-600"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowRepeat(!showRepeat)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                task.repeat_rule
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              <Repeat className="h-3 w-3" />
              {task.repeat_rule ? REPEAT_LABELS[task.repeat_rule] ?? task.repeat_rule : "重复"}
            </button>
            {showRepeat && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {Object.entries(REPEAT_LABELS).map(([rule, label]) => (
                  <button
                    key={rule}
                    onClick={() => {
                      updateTask(task.id, { repeat_rule: task.repeat_rule === rule ? null : rule });
                      setShowRepeat(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      task.repeat_rule === rule ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <Repeat className="h-3 w-3" />
                    {label}
                    {task.repeat_rule === rule && <X className="ml-auto h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        <label className="mb-1 block text-xs font-medium text-gray-400">备注</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="添加备注..."
          rows={5}
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200"
        />
      </div>

      <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-800">
        <label className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-400">
          <ListPlus className="h-3.5 w-3.5" />
          子任务
          {task.subtasks && (
            <span className="text-gray-400">
              ({task.subtasks.filter((s) => s.is_completed === 1).length}/{task.subtasks.length})
            </span>
          )}
        </label>
        {task.subtasks?.map((sub) => (
          <SubtaskRow key={sub.id} subtask={sub} taskId={task.id} />
        ))}
        <AddTask
          onAdd={(title) => addTask(title, 4, task.id)}
          placeholder="添加子任务..."
        />
      </div>
    </div>
  );
}

function SubtaskRow({ subtask, taskId }: { subtask: import("@/types").Task; taskId: string }) {
  const { updateTask, removeTask } = useStore();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(subtask.title);
  const isCompleted = subtask.is_completed === 1;

  return (
    <div className="group flex items-center gap-2 py-1">
      <button
        onClick={() => updateTask(subtask.id, { is_completed: isCompleted ? 0 : 1 })}
        className={`h-4 w-4 rounded-full border-2 shrink-0 ${
          isCompleted
            ? "border-green-500 bg-green-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {isCompleted && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            if (text.trim()) updateTask(subtask.id, { title: text.trim() });
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              updateTask(subtask.id, { title: text.trim() });
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 rounded bg-gray-100 px-2 py-0.5 text-sm outline-none dark:bg-gray-800"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 cursor-pointer text-sm ${isCompleted ? "text-gray-400 line-through" : "text-gray-600 dark:text-gray-300"}`}
        >
          {subtask.title}
        </span>
      )}
      <button
        onClick={() => removeTask(subtask.id)}
        className="hidden rounded p-0.5 text-gray-300 hover:text-red-500 group-hover:block"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
