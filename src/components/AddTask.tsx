import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (title: string) => void;
  placeholder?: string;
}

export default function AddTask({ onAdd, placeholder = "添加任务..." }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-800">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
        <Plus className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
        />
      </div>
    </div>
  );
}
