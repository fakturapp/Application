'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from '@/components/ui/icons'

const LINES = [
  { w: '92%', delay: 0 },
  { w: '78%', delay: 0.5 },
  { w: '85%', delay: 1 },
  { w: '64%', delay: 1.5 },
]

const LOOP = 4.5

export function FakturAiWritingPreview({ active = true }: { active?: boolean }) {
  const reduce = useReducedMotion()
  const animate = active && !reduce

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background:radial-gradient(120%_120%_at_50%_-10%,var(--color-accent-soft),transparent_60%)]" />

      <div className="relative flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-foreground">Faktur AI rédige…</span>
          {animate && (
            <span className="flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-accent"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-card p-4">
        {animate && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-1/3 [background:linear-gradient(90deg,transparent,var(--color-accent-soft),transparent)]"
            initial={{ x: '-120%' }}
            animate={{ x: ['-120%', '320%'] }}
            transition={{ duration: LOOP, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="relative flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-2.5 w-20 rounded-full bg-foreground/20" />
            <div className="h-1.5 w-12 rounded-full bg-foreground/10" />
          </div>
          <div className="h-7 w-7 rounded-lg bg-accent-soft" />
        </div>

        <div className="relative mt-4 space-y-2.5">
          {LINES.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                className="h-2 rounded-full bg-foreground/15"
                style={{ transformOrigin: 'left', width: line.w }}
                initial={{ scaleX: 0 }}
                animate={animate ? { scaleX: [0, 0, 1, 1, 0] } : { scaleX: 1 }}
                transition={
                  animate
                    ? {
                        duration: LOOP,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        times: [0, line.delay / LOOP, (line.delay + 0.6) / LOOP, 0.85, 1],
                      }
                    : undefined
                }
              />
              {animate && (
                <motion.span
                  className="h-3.5 w-0.5 rounded-full bg-accent"
                  animate={{ opacity: [0, 0, 1, 0, 0] }}
                  transition={{
                    duration: LOOP,
                    repeat: Infinity,
                    ease: 'linear',
                    times: [0, line.delay / LOOP, (line.delay + 0.3) / LOOP, (line.delay + 0.6) / LOOP, 1],
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="relative mt-4 flex justify-end">
          <div className="w-28 space-y-1.5">
            <div className="flex justify-between">
              <div className="h-1.5 w-10 rounded-full bg-foreground/10" />
              <div className="h-1.5 w-8 rounded-full bg-foreground/10" />
            </div>
            <motion.div
              className="flex justify-between border-t border-border pt-1.5"
              initial={{ opacity: 0 }}
              animate={animate ? { opacity: [0, 0, 1, 1, 0] } : { opacity: 1 }}
              transition={animate ? { duration: LOOP, repeat: Infinity, times: [0, 0.5, 0.6, 0.85, 1] } : undefined}
            >
              <div className="h-2 w-10 rounded-full bg-foreground/25" />
              <div className="h-2 w-10 rounded-full bg-accent/70" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
