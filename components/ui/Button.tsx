import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-5 py-2.5 text-sm',
          size === 'lg' && 'px-7 py-3.5 text-base',
          // Variants
          variant === 'primary' && 'btn-fwc',
          variant === 'secondary' && 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
          variant === 'ghost' && 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200',
          variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600',
          variant === 'outline' && 'border-2 border-[#2A398D] text-[#2A398D] hover:bg-[#2A398D] hover:text-white',
          // Disabled
          (disabled || loading) && '!opacity-50 !cursor-not-allowed !transform-none !shadow-none',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
