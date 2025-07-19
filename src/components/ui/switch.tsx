import React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

export function Switch({ checked, onCheckedChange }: SwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-300 rounded-full dark:bg-gray-600">
        <div
          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
            checked ? "translate-x-full bg-blue-500" : ""
          }`}
        />
      </div>
    </label>
  );
}
