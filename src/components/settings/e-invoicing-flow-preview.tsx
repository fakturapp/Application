'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FileCheck, Building2, Server, Check } from '@/components/ui/icons'

function Node({
  icon,
  label,
  sub,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset transition-colors ${
          highlight ? 'bg-accent-soft text-accent ring-accent/20' : 'bg-surface text-muted-foreground ring-border'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

export function EInvoicingFlowPreview({
  enabled = true,
  mode = 'sandbox',
}: {
  enabled?: boolean
  mode?: 'sandbox' | 'production'
}) {
  const reduce = useReducedMotion()
  const animate = enabled && !reduce
  const isProd = mode === 'production'
  const reach = isProd ? 1 : 0.5

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background:radial-gradient(120%_120%_at_50%_-10%,var(--color-accent-soft),transparent_60%)]" />

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Transmission Factur-X
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isProd
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isProd ? 'Production' : 'Sandbox'}
        </span>
      </div>

      <div className="relative mt-6">
        <div className="absolute left-[16%] right-[16%] top-6 h-px -translate-y-1/2 bg-border" />
        <motion.div
          className="absolute left-[16%] top-6 h-px -translate-y-1/2 bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${reach * 68}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {animate && (
          <motion.div
            className="absolute top-6 z-10 -translate-x-1/2 -translate-y-1/2"
            initial={{ left: '16%', opacity: 0 }}
            animate={{
              left: ['16%', `${16 + reach * 68}%`, `${16 + reach * 68}%`],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.6, 1] }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30">
              <FileCheck className="h-3 w-3" />
            </div>
          </motion.div>
        )}

        <div className="relative flex items-start justify-between gap-2">
          <Node icon={<FileCheck className="h-5 w-5" />} label="Votre facture" sub="Factur-X / CII" highlight />
          <Node
            icon={<Server className="h-5 w-5" />}
            label="PDP"
            sub={isProd ? 'B2Brouter' : 'Local'}
            highlight={enabled}
          />
          <Node
            icon={isProd ? <Check className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            label="Administration"
            sub={isProd ? 'Transmis' : 'Hors sandbox'}
            highlight={isProd}
          />
        </div>
      </div>

      <div className="relative mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className={`h-2 w-2 shrink-0 rounded-full ${isProd ? 'bg-emerald-500' : 'bg-amber-500'} ${animate ? 'animate-pulse' : ''}`} />
        <p className="text-[11px] text-muted-foreground">
          {!enabled
            ? 'Activez la facturation électronique pour préparer vos exports structurés.'
            : isProd
              ? 'Les factures sont transmises via votre PDP configuré.'
              : 'Génération Factur-X locale — aucune transmission externe.'}
        </p>
      </div>
    </div>
  )
}
