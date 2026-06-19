'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Sparkles, Check } from '@/components/ui/icons'

type Mode = 'edition' | 'question' | 'libre'

const SCRIPTS: Record<Mode, { user: string; elias: string; doc?: { label: string; value: string } }> = {
  edition: {
    user: 'Ajoute une remise de 10 % sur la dernière ligne.',
    elias: 'C’est fait — remise de 10 % appliquée à la prestation.',
    doc: { label: 'Remise (-10 %)', value: '−96,00 €' },
  },
  question: {
    user: 'Cette facture est-elle conforme à la réforme 2026 ?',
    elias: 'Oui. SIREN, numéro de TVA et mentions Factur-X sont bien présents.',
  },
  libre: {
    user: 'Reformule l’objet sur un ton plus chaleureux.',
    elias: 'Proposition : « Accompagnement sur-mesure pour votre nouvelle marque ».',
  },
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  )
}

export function FakturAiChatPreview({ mode = 'edition', active = true }: { mode?: Mode; active?: boolean }) {
  const reduce = useReducedMotion()
  const animate = active && !reduce
  const [cycle, setCycle] = useState(0)
  const script = SCRIPTS[mode]

  useEffect(() => {
    if (!animate) return
    const id = setInterval(() => setCycle((c) => c + 1), 7000)
    return () => clearInterval(id)
  }, [animate])

  const show = (at: number) => (animate ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: at, duration: 0.35 } } : { initial: false, animate: { opacity: 1, y: 0 } })

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background:radial-gradient(120%_120%_at_50%_-10%,var(--color-accent-soft),transparent_60%)]" />

      <div className="relative flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-foreground">Elias · Faktur AI</p>
          <p className="text-[10px] capitalize text-muted-foreground">Mode {mode}</p>
        </div>
      </div>

      <div key={`${mode}-${cycle}`} className="relative mt-4 space-y-3">
        <motion.div {...show(0.2)} className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-3 py-2 text-[11px] leading-snug text-white">
            {script.user}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {animate && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, times: [0, 0.1, 0.8, 1], delay: 1 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl rounded-bl-md border border-border bg-card px-2 py-1.5">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div {...show(animate ? 3 : 0)} className="flex justify-start gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-[11px] leading-snug text-foreground">
            {script.elias}
          </div>
        </motion.div>

        {script.doc && (
          <motion.div {...show(animate ? 3.8 : 0)} className="ml-8 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft/40 px-3 py-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-[11px] text-foreground">{script.doc.label}</span>
            <span className="ml-auto text-[11px] font-semibold tabular-nums text-accent">{script.doc.value}</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
