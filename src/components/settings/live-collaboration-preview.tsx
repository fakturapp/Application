'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

type Collaborator = {
  id: string
  name: string
  color: string
  path: { x: number; y: number }[]
  duration: number
}

const COLLABORATORS: Collaborator[] = [
  {
    id: 'marie',
    name: 'Marie',
    color: '#f43f5e',
    duration: 11,
    path: [
      { x: 16, y: 26 },
      { x: 58, y: 32 },
      { x: 54, y: 64 },
      { x: 20, y: 56 },
      { x: 16, y: 26 },
    ],
  },
  {
    id: 'thomas',
    name: 'Thomas',
    color: '#0ea5e9',
    duration: 13,
    path: [
      { x: 72, y: 18 },
      { x: 80, y: 52 },
      { x: 44, y: 72 },
      { x: 66, y: 40 },
      { x: 72, y: 18 },
    ],
  },
  {
    id: 'lea',
    name: 'Léa',
    color: '#f59e0b',
    duration: 12,
    path: [
      { x: 38, y: 78 },
      { x: 24, y: 42 },
      { x: 64, y: 22 },
      { x: 50, y: 60 },
      { x: 38, y: 78 },
    ],
  },
]

type FieldId = 'invoiceNo' | 'client' | 'item1' | 'item2' | 'total'

const EDIT_STEPS: Record<FieldId, Collaborator | null>[] = [
  { invoiceNo: null, client: null, item1: COLLABORATORS[0], item2: null, total: COLLABORATORS[1] },
  { invoiceNo: COLLABORATORS[1], client: COLLABORATORS[2], item1: null, item2: COLLABORATORS[0], total: null },
  { invoiceNo: null, client: COLLABORATORS[0], item1: COLLABORATORS[2], item2: null, total: COLLABORATORS[1] },
]

function Cursor({ collaborator, animate }: { collaborator: Collaborator; animate: boolean }) {
  const start = collaborator.path[0]
  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      initial={{ left: `${start.x}%`, top: `${start.y}%` }}
      animate={
        animate
          ? {
              left: collaborator.path.map((p) => `${p.x}%`),
              top: collaborator.path.map((p) => `${p.y}%`),
            }
          : { left: `${start.x}%`, top: `${start.y}%` }
      }
      transition={
        animate
          ? {
              duration: collaborator.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
            }
          : undefined
      }
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
        <path
          d="M5.5 3.2 L18.5 11 L11.8 12.3 L9.2 18.6 Z"
          fill={collaborator.color}
          stroke="white"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute left-3.5 top-3.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: collaborator.color }}
      >
        {collaborator.name}
      </span>
    </motion.div>
  )
}

function EditableField({
  active,
  className,
  children,
}: {
  active: Collaborator | null
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`relative rounded-md transition-all duration-300 ${className ?? ''}`}>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute -inset-1 z-10 rounded-md"
            style={{ outline: `2px solid ${active.color}`, outlineOffset: '0px' }}
          >
            <span
              className="absolute -top-2 left-1.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-semibold leading-none text-white"
              style={{ backgroundColor: active.color }}
            >
              {active.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}

export function LiveCollaborationPreview({ active = true }: { active?: boolean }) {
  const reduce = useReducedMotion()
  const animate = active && !reduce
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!animate) return
    const id = setInterval(() => setStep((s) => (s + 1) % EDIT_STEPS.length), 2600)
    return () => clearInterval(id)
  }, [animate])

  const edits = animate ? EDIT_STEPS[step] : { invoiceNo: null, client: null, item1: null, item2: null, total: null }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background:radial-gradient(120%_120%_at_50%_-10%,var(--color-accent-soft),transparent_60%)]" />

      <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
        {animate && COLLABORATORS.map((c) => <Cursor key={c.id} collaborator={c} animate={animate} />)}

        <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent-soft" />
              <div className="space-y-1">
                <div className="h-2 w-16 rounded-full bg-foreground/15" />
                <div className="h-1.5 w-10 rounded-full bg-foreground/10" />
              </div>
            </div>
            <EditableField active={edits.invoiceNo} className="px-2 py-1 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Facture</p>
              <p className="text-[11px] font-bold tabular-nums text-foreground">F-2026-014</p>
            </EditableField>
          </div>

          <EditableField active={edits.client} className="px-2 py-1.5">
            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Facturé à</p>
            <p className="text-[11px] font-semibold text-foreground">Atelier Dubois</p>
            <p className="text-[9px] text-muted-foreground">14 rue des Lilas, Lyon</p>
          </EditableField>

          <div className="mt-1 space-y-1.5">
            <div className="flex items-center justify-between border-b border-border pb-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Description</span>
              <span>Total</span>
            </div>
            <EditableField active={edits.item1} className="flex items-center justify-between px-1 py-1">
              <div className="space-y-1">
                <div className="h-1.5 w-24 rounded-full bg-foreground/15" />
                <div className="h-1.5 w-16 rounded-full bg-foreground/10" />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-foreground">450,00 €</span>
            </EditableField>
            <EditableField active={edits.item2} className="flex items-center justify-between px-1 py-1">
              <div className="space-y-1">
                <div className="h-1.5 w-20 rounded-full bg-foreground/15" />
                <div className="h-1.5 w-12 rounded-full bg-foreground/10" />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-foreground">120,00 €</span>
            </EditableField>
          </div>

          <div className="mt-auto flex justify-end">
            <EditableField active={edits.total} className="w-32 space-y-1 px-2 py-1.5">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>Sous-total</span>
                <span className="tabular-nums">570,00 €</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>TVA 20%</span>
                <span className="tabular-nums">114,00 €</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1 text-[11px] font-bold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">684,00 €</span>
              </div>
            </EditableField>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-center gap-3">
        <div className="flex -space-x-2">
          {COLLABORATORS.map((c) => (
            <div
              key={c.id}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.name[0]}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">3 personnes éditent en même temps</span>
      </div>
    </div>
  )
}
