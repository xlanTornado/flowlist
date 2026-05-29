import { useEffect } from "react";
import { useStore } from "@/stores/useStore";

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("flowlist-theme");

    if (stored === "dark" || (!stored && prefersDark)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.toggle("dark");
  localStorage.setItem("flowlist-theme", isDark ? "dark" : "light");
}
