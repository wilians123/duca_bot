"use client";

import { ChangeEvent } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  placeholder?: string; // ej. "Seleccione"
  disabled?: boolean;
  infoTooltip?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Seleccione",
  disabled = false,
  infoTooltip,
}: SelectFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-bold font-label-bold text-on-surface flex items-center gap-1">
        {label}
        {required && <span className="text-error">*</span>}
        {infoTooltip && (
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-help"
            title={infoTooltip}
          >
            info
          </span>
        )}
      </label>
      <div className="relative">
        <select
          className="w-full h-10 border border-outline-variant rounded bg-white text-body-md text-on-surface px-3 appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow disabled:bg-surface-container-low disabled:opacity-80"
          value={value ?? ""}
          onChange={handleChange}
          disabled={disabled}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
        </div>
      </div>
    </div>
  );
}
