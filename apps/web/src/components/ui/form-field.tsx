import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

type FieldFrameProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function FieldFrame({
  label,
  hint,
  error,
  required,
  children,
}: FieldFrameProps) {
  return (
    <label className={cn('form-field', error && 'form-field-error')}>
      <span className="form-field-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="form-field-message" role="alert">{error}</span>
      ) : hint ? (
        <span className="form-field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('text-input', className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('text-input', 'select-input', className)} {...props}>
      {children}
    </select>
  );
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('text-input', 'text-area', className)} {...props} />;
}
