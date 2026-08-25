import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<'input'> & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
