import React, { type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <select
      className={`px-4 py-2 border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
