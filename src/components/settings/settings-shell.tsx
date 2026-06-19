'use client'

import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE = [0.25, 0.46, 0.45, 0.94] as const

export const settingsFade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: EASE },
  }),
} satisfies Variants

export function SettingsPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={cn('mx-auto max-w-3xl px-6 py-8', className)}
    >
      {children}
    </motion.div>
  )
}

export function SettingsHero({
  icon,
  title,
  badges,
  tagline,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  badges?: React.ReactNode
  tagline?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <motion.div variants={settingsFade} custom={0} className="flex items-start justify-between gap-4 pb-2">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="relative shrink-0">
            <div className="pointer-events-none absolute -inset-2 rounded-[28px] bg-accent-soft/60 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent ring-1 ring-inset ring-accent/15">
              {icon}
            </div>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-[-0.01em] text-foreground">{title}</h1>
            {badges}
          </div>
          {tagline && <p className="text-[15px] font-medium text-foreground">{tagline}</p>}
          {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  )
}

export function SettingsSection({
  title,
  desc,
  action,
  children,
  index = 1,
  className,
}: {
  title?: React.ReactNode
  desc?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  index?: number
  className?: string
}) {
  return (
    <motion.section
      variants={settingsFade}
      custom={index}
      className={cn('border-t border-border py-7', className)}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-foreground">{title}</h2>}
            {desc && <p className="mt-1 max-w-md text-sm text-muted-foreground">{desc}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  )
}

export function SettingsRow({
  icon,
  title,
  desc,
  control,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  desc?: React.ReactNode
  control?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {control && <div className="shrink-0">{control}</div>}
    </div>
  )
}
