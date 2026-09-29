import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-border bg-surface-2 text-foreground hover:bg-border/60',
  ghost: 'text-muted hover:bg-surface-2 hover:text-foreground',
}

export const buttonClass = (variant: ButtonVariant = 'primary', className?: string) =>
  cn(
    'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50',
    buttonVariants[variant],
    className,
  )

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />
}

const fieldClass =
  'w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, 'min-h-20 py-2', className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, 'h-10', className)} {...props} />
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...props} />
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-lg border border-border bg-surface', className)} {...props} />
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
