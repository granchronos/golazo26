import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient-border'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ className, variant = 'default', padding = 'md', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        // Padding
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-7',
        // Variants
        variant === 'default' && 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm',
        variant === 'glass' && 'glass-card',
        variant === 'gradient-border' && 'border-gradient bg-white dark:bg-[#0f0f1a]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
