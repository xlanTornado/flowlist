import { useEffect } from "react";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { useStore } from "@/stores/useStore";

export function useGlobalShortcuts() {
  const loadTodayTasks = useStore((s) => s.loadTodayTasks);

  useEffect(() => {
    const setupShortcuts = async () => {
      try {
        await register("Ctrl+Shift+N", () => {
          const el = document.querySelector<HTMLInputElement>('[placeholder="添加任务..."]');
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: "smooth" });
          }
        });

        await register("Ctrl+Shift+T", () => {
          loadTodayTasks();
        });
      } catch {
        // Global shortcut not available
      }
    };

    setupShortcuts();

    return () => {
      try {
        unregister("Ctrl+Shift+N");
        unregister("Ctrl+Shift+T");
      } catch {}
    };
  }, []);
}
