import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'danger' | 'safe' | 'warning';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'border-transparent bg-white/10 text-white': variant === 'default',
            'border-transparent bg-danger text-white': variant === 'danger',
            'border-transparent bg-safe text-white': variant === 'safe',
            'border-transparent bg-warning text-white': variant === 'warning',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
