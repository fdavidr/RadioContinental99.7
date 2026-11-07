import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../lib/classes'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn('button', `button--${variant}`, className)}
      type={props.type ?? 'button'}
      {...props}
    >
      {children}
    </button>
  )
}
