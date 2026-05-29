import { useState, useRef, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { toggleTheme } from "@/hooks/useTheme";
import StatsPanel from "./StatsPanel";
import { Plus, Trash2, Sun, Calendar, Search, Moon, BarChart3, Download, Upload, CheckCheck, FileText, Image } from "lucide-react";
import { getAllTasks, getLists as dbGetLists, getTags as dbGetTags } from "@/lib/db";
import { toPng } from "html-to-image";

const LIST_COLORS = ["#6366f1", "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#06b6d4", "#ec4899", "#8b5cf6"];

export default function Sidebar() {
  const store = useStore();
  const { lists, selectedListId, selectList, addList, removeList, updateListName, viewMode, setViewMode, loadTodayTasks, loadLists, searchTasks, searchQuery, setSearchQuery } = store;
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LIST_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (showAdd && inputRef.current) inputRef.current.focus();
  }, [showAdd]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addList(newName.trim(), newColor);
    setNewName("");
    setShowAdd(false);
  };

  const handleEditSubmit = async (id: string) => {
    if (editName.trim()) {
      await updateListName(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleTxtExport = async () => {
    try {
      const lists = await dbGetLists();
      const tasks = await getAllTasks();
      const { getSubtasks } = await import("@/lib/db");
      let txt = "FlowList 任务清单\n" + "=".repeat(40) + "\n\n";
      for (const list of lists) {
        const listTasks = tasks.filter((t) => t.list_id === list.id);
        txt += `## ${list.name}\n\n`;
        for (const task of listTasks) {
          const status = task.is_completed ? "[x]" : "[ ]";
          const pri = ["", "!!", "!", "", ""][task.priority];
          txt += `${status} ${pri} ${task.title}\n`;
          const subs = await getSubtasks(task.id);
          for (const sub of subs) {
            const s = sub.is_completed ? "[x]" : "[ ]";
            txt += `    ${s} ${sub.title}\n`;
          }
          txt += "\n";
        }
      }
      downloadFile(txt, `flowlist-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain");
    } catch (e) {
      alert("导出 TXT 失败：" + (e instanceof Error ? e.message : String(e)));
    }
    setShowExportMenu(false);
  };

  const handleImageExport = async () => {
    try {
      const el = document.querySelector("[data-task-list]");
      if (!el) { alert("未找到任务列表"); return; }
      const dataUrl = await toPng(el as HTMLElement, { backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `flowlist-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (e) {
      alert("导出图片失败：" + (e instanceof Error ? e.message : String(e)));
    }
    setShowExportMenu(false);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      const { getSubtasks, getTaskTags } = await import("@/lib/db");
      const lists = await dbGetLists();
      const tasks = await getAllTasks();
      const tags = await dbGetTags();
      const tasksWithDetails = [];
      for (const t of tasks) {
        const subtasks = await getSubtasks(t.id);
        const taskTags = await getTaskTags(t.id);
        tasksWithDetails.push({ ...t, subtasks, tags: taskTags });
      }
      const data = { lists, tasks: tasksWithDetails, tags };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("导出失败：" + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleImport = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const text = await file.text();
          const data = JSON.parse(text);
          const { createTask, addTaskTag } = await import("@/lib/db");

          if (data.lists) {
            for (const list of data.lists) {
              try { await addList(list.name, list.color); } catch {}
            }
          }
          if (data.tags) {
            for (const tag of data.tags) {
              try { await useStore.getState().addTag(tag.name, tag.color); } catch {}
            }
          }
          if (data.tasks) {
            const refreshedLists = await dbGetLists();
            const defaultListId = refreshedLists[0]?.id ?? "default";
            for (const task of data.tasks) {
              const taskListId = data.lists
                ? (refreshedLists.find((l) => l.name === data.lists.find((dl: any) => dl.name === l.name)?.name)?.id ?? defaultListId)
                : defaultListId;
              try {
                const newTask = await createTask(taskListId, task.title, task.priority ?? 4, null);
                if (task.note) await (await import("@/lib/db")).updateTask(newTask.id, { note: task.note });
                if (task.due_date) await (await import("@/lib/db")).updateTask(newTask.id, { due_date: task.due_date });
                if (task.tags) {
                  for (const tag of task.tags) {
                    try { await addTaskTag(newTask.id, tag.id); } catch {}
                  }
                }
              } catch {}
            }
          }
          await loadLists();
          if (selectedListId) await useStore.getState().loadTasks(selectedListId);
        } catch (e) {
          alert("导入失败：" + (e instanceof Error ? e.message : String(e)));
        }
      };
      input.click();
    } catch (e) {
      alert("导入失败：" + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <>
      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}
      <div className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-xs font-bold text-white">
            FL
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">FlowList</span>
          <button
            onClick={() => toggleTheme()}
            className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="切换主题"
          >
            <Moon className="hidden h-3.5 w-3.5 dark:block" />
            <Sun className="h-3.5 w-3.5 dark:hidden" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                clearTimeout(searchTimerRef.current);
                const q = e.target.value;
                setSearchQuery(q);
                searchTimerRef.current = setTimeout(() => searchTasks(q), 300);
              }}
              placeholder="搜索任务..."
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              viewMode === "list" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Sun className="h-4 w-4" />
            所有任务
          </button>
          <button
            onClick={loadTodayTasks}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              viewMode === "today" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Calendar className="h-4 w-4" />
            今天
          </button>
        </nav>

        <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-800" />

        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">清单</span>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-2">
          {lists.map((list) => (
            <div key={list.id} className="group relative">
              {editingId === list.id ? (
                <input
                  ref={editRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleEditSubmit(list.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSubmit(list.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm outline-none dark:border-indigo-600 dark:bg-gray-800"
                />
              ) : (
                <button
                  onClick={() => selectList(list.id)}
                  onDoubleClick={() => {
                    setEditingId(list.id);
                    setEditName(list.name);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    selectedListId === list.id
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                  <span className="truncate">{list.name}</span>
                  {list.id !== "default" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeList(list.id);
                      }}
                      className="ml-auto hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </button>
              )}
            </div>
          ))}

          {showAdd && (
            <div className="mt-1 rounded-lg border border-indigo-200 bg-white p-2 dark:border-indigo-800 dark:bg-gray-800">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setShowAdd(false);
                }}
                placeholder="清单名称"
                className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900"
              />
              <div className="mt-1.5 flex gap-1">
                {LIST_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-5 w-5 rounded-full transition-transform ${newColor === c ? "scale-110 ring-2 ring-offset-1 ring-gray-400" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <button onClick={handleAdd} className="rounded bg-indigo-500 px-2.5 py-1 text-xs text-white hover:bg-indigo-600">确定</button>
                <button onClick={() => setShowAdd(false)} className="rounded px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">取消</button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-3 py-1.5 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center gap-1 rounded p-1 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="统计"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 rounded p-1 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                title="导出"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {showExportMenu && (
                <div className="absolute bottom-full left-0 z-20 mb-1 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button onClick={handleTxtExport} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <FileText className="h-3.5 w-3.5" /> TXT 文本
                  </button>
                  <button onClick={handleImageExport} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Image className="h-3.5 w-3.5" /> PNG 图片
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button onClick={() => { handleExport(); setShowExportMenu(false); }} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    JSON 备份
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleImport}
              className="flex items-center gap-1 rounded p-1 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="导入"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <CheckCheck className="h-3.5 w-3.5" />
              v0.2
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
