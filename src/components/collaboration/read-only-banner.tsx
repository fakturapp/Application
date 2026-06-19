'use client'

import { motion } from 'framer-motion'
import { Eye } from '@/components/ui/icons'

export function ReadOnlyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-2.5 shadow-sm backdrop-blur-sm"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Eye className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Lecture seule</p>
        <p className="text-xs text-muted-foreground">
          Vous pouvez consulter ce document, mais pas le modifier.
        </p>
      </div>
    </motion.div>
  )
}
