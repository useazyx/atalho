import { useId, type InputHTMLAttributes, type ReactNode } from "react"

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string
  error?: string
  hint?: string
  // Texto fixo antes do campo (tipo "localhost:3337/" antes do apelido)
  prefix?: ReactNode
}

export function TextField({ label, error, hint, prefix, className = "", ...props }: TextFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink-secondary">
        {label}
      </label>
      <div className="flex h-10 min-w-0 items-center rounded-lg border border-border bg-surface-raised transition-colors focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/20 has-aria-invalid:border-danger">
        {prefix && (
          <span className="flex h-full shrink-0 items-center border-r border-border px-3 font-mono text-[13px] text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 rounded-lg bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
