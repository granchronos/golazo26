import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium font-body text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-white dark:bg-white/5 px-4 py-3 text-sm font-body',
              'border-gray-200 dark:border-white/10',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-[#2A398D] focus:border-transparent',
              'transition-all duration-200',
              'dark:text-white',
              error && 'border-red-400 focus:ring-red-400',
              icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 font-body">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
