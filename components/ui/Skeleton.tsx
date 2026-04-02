import { cn } from '@/lib/utils/cn'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'card'
}

export function Skeleton({ className, variant = 'line', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'line' && 'h-4 w-full rounded-lg',
        variant === 'circle' && 'h-10 w-10 rounded-full',
        variant === 'card' && 'h-32 w-full rounded-2xl',
        className
      )}
      {...props}
    />
  )
}

export function GroupCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-6 w-24 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-8 h-8" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <Skeleton variant="circle" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  )
}
