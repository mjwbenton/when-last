import type { ReactNode } from 'react';
import { useId } from 'react';

type FieldProps = {
  label: string;
  children: (ids: { inputId: string }) => ReactNode;
};

export function Field({ label, children }: FieldProps) {
  const inputId = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      {children({ inputId })}
    </div>
  );
}
