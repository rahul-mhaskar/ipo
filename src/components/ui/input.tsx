import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-white ${className}`}
      {...props}
    />
  );
}
