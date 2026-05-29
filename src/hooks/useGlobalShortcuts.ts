import { useEffect } from "react";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { useStore } from "@/stores/useStore";

export function useGlobalShortcuts() {
  const { selectList, loadTodayTasks } = useStore();

  useEffect(() => {
    const setupShortcuts = async () => {
      try {
        await register("Ctrl+Shift+N", () => {
          const { addTask } = useStore.getState();
          addTask("");
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
      } catch {
        // Cleanup
      }
    };
  }, []);
}
