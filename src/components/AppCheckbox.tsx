import React, { useEffect, useRef } from 'react';

interface AppCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange' | 'size'> {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
  variant?: 'default' | 'soft';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const AppCheckbox: React.FC<AppCheckboxProps> = ({
  checked,
  onCheckedChange,
  variant = 'default',
  size = 'md',
  children,
  className = '',
  disabled,
  ...inputProps
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isChecked = checked === true;

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.indeterminate = checked === 'indeterminate';
  }, [checked]);

  return (
    <label
      className={`app-checkbox app-checkbox-${variant} app-checkbox-${size}${isChecked ? ' checked' : ''}${checked === 'indeterminate' ? ' indeterminate' : ''}${disabled ? ' disabled' : ''} ${className}`.trim()}
    >
      <input
        {...inputProps}
        ref={inputRef}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span className="app-checkbox-box" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          {checked === 'indeterminate' ? (
            <path d="M4 8h8" />
          ) : (
            <path d="M3.75 8.2 6.65 11 12.25 5" />
          )}
        </svg>
      </span>
      <span className="app-checkbox-content">{children}</span>
    </label>
  );
};

export default AppCheckbox;
