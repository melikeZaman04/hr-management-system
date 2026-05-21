import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}

export function Field({ label, hint, error, required, htmlFor, children }: FieldProps) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}{required && <span className="field__label-req">*</span>}
        </label>
      )}
      {children}
      {error
        ? <div className="field__error">{error}</div>
        : hint
          ? <div className="field__hint">{hint}</div>
          : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  addon?: string
}

export function Input({ error, addon, ...props }: InputProps) {
  if (addon) {
    return (
      <div className="input-group">
        <input {...props} />
        <span className="input-group__addon">{addon}</span>
      </div>
    )
  }
  return <input className={`input${error ? ' input--error' : ''}`} {...props} />
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export function Select({ error, children, ...props }: SelectProps) {
  return <select className={`select${error ? ' select--error' : ''}`} {...props}>{children}</select>
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />
}
