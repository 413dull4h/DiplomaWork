import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import clsx from 'clsx'

type BaseProps = {
  label: string
  error?: string
  hint?: ReactNode
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & BaseProps

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, name, ...props }, ref) => {
    const inputId = id ?? name

    return (
      <label className="block" htmlFor={inputId}>
        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={clsx(
            'focus-ring w-full rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 disabled:bg-slate-100/70 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:disabled:bg-slate-800',
            error && 'border-rose-300 focus-visible:border-rose-500 focus-visible:ring-rose-500/20',
            className,
          )}
          {...props}
        />
        {hint ? <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
        {error ? <span className="mt-2 block text-xs font-medium text-rose-600">{error}</span> : null}
      </label>
    )
  },
)

Input.displayName = 'Input'

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, id, name, ...props }, ref) => {
    const inputId = id ?? name

    return (
      <label className="block" htmlFor={inputId}>
        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          className={clsx(
            'focus-ring min-h-36 w-full resize-y rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 disabled:bg-slate-100/70 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:disabled:bg-slate-800',
            error && 'border-rose-300 focus-visible:border-rose-500 focus-visible:ring-rose-500/20',
            className,
          )}
          {...props}
        />
        {hint ? <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
        {error ? <span className="mt-2 block text-xs font-medium text-rose-600">{error}</span> : null}
      </label>
    )
  },
)

TextArea.displayName = 'TextArea'
