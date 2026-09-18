"use client";

import { ChangeEvent } from "react";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean; // úsalo solo cuando el campo realmente deba bloquearse (ej. calculado)
}

export function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  helperText,
  disabled = false,
}: TextFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-bold font-label-bold text-on-surface">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <input
        type="text"
        className="w-full h-10 border border-outline-variant rounded bg-white text-body-md text-on-surface px-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow disabled:bg-surface-container-low disabled:opacity-80"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
      />
      {helperText && (
        <p className="text-[11px] leading-tight text-on-surface-variant italic mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
