"use client";

import React, { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: string; // raw numeric string e.g. "1500000"
  onChange: (raw: string) => void; // returns raw numeric string
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  min?: number;
}

/** Format a raw number string into Indonesian thousand-separated display value.
 *  e.g. "1500000" → "1.500.000"
 */
function formatDisplay(raw: string): string {
  if (!raw) return "";
  const num = raw.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("id-ID");
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className = "form-input",
  autoFocus = false,
  disabled = false,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(formatDisplay(value));

  // Sync when value changes from outside (e.g. opening edit form)
  useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    setDisplayValue(raw ? Number(raw).toLocaleString("id-ID") : "");
    onChange(raw);
  };

  return (
    <input
      className={className}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      autoFocus={autoFocus}
      disabled={disabled}
    />
  );
}
