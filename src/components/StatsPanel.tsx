import { useEffect, useState } from "react";
import { useStore } from "@/stores/useStore";
import { X, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { getAllTasks } from "@/lib/db";
import type { Task } from "@/types";
import { format, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

interface Props {
  onClose: () => void;
}

export default function StatsPanel({ onClose }: Props) {
  const { lists } = useStore();
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    getAllTasks().then(setAllTasks);
  }, []);

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.is_completed === 1).length;
  const remaining = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: today });
  const weekData = weekDays.map((day) => ({
    date: day,
    label: format(day, "EEE"),
    tasks: allTasks.filter((t) => t.created_at && isSameDay(new Date(t.created_at), day)).length,
    completed: allTasks.filter(
      (t) => t.completed_at && isSameDay(new Date(t.completed_at), day)
    ).length,
  }));

  const listStats = lists.map((list) => {
    const listTasks = allTasks.filter((t) => t.list_id === list.id);
    return {
      ...list,
      total: listTasks.length,
      completed: listTasks.filter((t) => t.is_completed === 1).length,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-[480px] rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">任务统计</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">全部任务</div>
          </div>
          <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completed}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="h-3 w-3" /> 已完成
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{remaining}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Circle className="h-3 w-3" /> 待完成
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">完成率</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{rate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <TrendingUp className="mr-1 inline h-3 w-3" />
            本周概览
          </h3>
          <div className="flex items-end justify-between gap-1" style={{ height: "80px" }}>
            {weekData.map((day) => {
              const maxH = Math.max(...weekData.map((d) => d.tasks), 3);
              const h = Math.max((day.tasks / maxH) * 64, 4);
              const ch = day.tasks > 0 ? Math.max((day.completed / day.tasks) * h, 2) : 0;
              return (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{day.tasks}</span>
                  <div className="relative w-full max-w-[24px]" style={{ height: "64px" }}>
                    <div className="absolute bottom-0 w-full rounded-t-sm bg-gray-200 dark:bg-gray-700" style={{ height: `${h}px` }} />
                    <div className="absolute bottom-0 w-full rounded-t-sm bg-indigo-400" style={{ height: `${ch}px` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">清单分布</h3>
          <div className="space-y-1.5">
            {listStats.map((list) => {
              const listRate = list.total > 0 ? Math.round((list.completed / list.total) * 100) : 0;
              return (
                <div key={list.id} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                  <span className="min-w-[60px] text-xs text-gray-600 dark:text-gray-300 truncate">{list.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${listRate}%`, backgroundColor: list.color }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{list.completed}/{list.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
