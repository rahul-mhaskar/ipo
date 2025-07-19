import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white p-4 shadow dark:bg-gray-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div className={`text-gray-800 dark:text-white ${className}`} {...props}>
      {children}
    </div>
  );
}
