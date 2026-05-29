import { useEffect, useRef } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { useStore } from "@/stores/useStore";
import * as db from "@/lib/db";

export function useReminders() {
  const { tasks, selectedListId, loadTasks } = useStore();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkReminders = async () => {
      try {
        let granted = await isPermissionGranted();
        if (!granted) {
          const perm = await requestPermission();
          granted = perm === "granted";
        }
        if (!granted) return;

        const now = new Date();

        for (const task of tasks) {
          if (task.is_completed === 1) continue;
          if (!task.due_date) continue;

          const dueDate = new Date(task.due_date);

          for (const minutes of [15, 60, 1440]) {
            const remindAt = new Date(dueDate.getTime() - minutes * 60 * 1000);
            if (now >= remindAt && now < new Date(remindAt.getTime() + 60000)) {
              const key = `${task.id}-${minutes}`;
              if (!notifiedRef.current.has(key)) {
                notifiedRef.current.add(key);
                sendNotification({
                  title: "FlowList 提醒",
                  body: `任务「${task.title}」${minutes >= 60 ? `${minutes / 60}小时后` : `${minutes}分钟后`}到期`,
                });
              }
            }
          }
        }
      } catch {
        // Notification plugin not available in browser
      }
    };

    checkReminders();
    interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [tasks]);
}
