"use client";

import { ChangeEvent } from "react";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  infoTooltip?: string;
}

export function TextareaField({
  label,
  value,
  onChange,
  maxLength = 1500,
  infoTooltip,
}: TextareaFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);

  return (
    <div className="flex flex-col gap-1 mt-2">
      <label className="text-label-bold font-label-bold text-on-surface flex items-center gap-1">
        {label} (longitud máxima: {maxLength} caracteres)
        {infoTooltip && (
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-help"
            title={infoTooltip}
          >
            info
          </span>
        )}
      </label>
      <textarea
        className="w-full border border-outline-variant rounded bg-white text-body-md text-on-surface p-3 min-h-[100px] resize-y focus:ring-1 focus:ring-primary focus:border-primary outline-none"
        value={value ?? ""}
        maxLength={maxLength}
        onChange={handleChange}
      />
    </div>
  );
}
