import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'blue' | 'red' | 'green' | 'gold' | 'gray'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold font-body',
        variant === 'default' && 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
        variant === 'blue' && 'bg-[#2A398D]/10 text-[#2A398D] dark:bg-[#2A398D]/30 dark:text-blue-300',
        variant === 'red' && 'bg-[#E61D25]/10 text-[#E61D25]',
        variant === 'green' && 'bg-[#3CAC3B]/10 text-[#3CAC3B]',
        variant === 'gold' && 'bg-[#C9A84C]/10 text-[#C9A84C]',
        variant === 'gray' && 'bg-gray-200 text-gray-600 dark:bg-white/5 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
