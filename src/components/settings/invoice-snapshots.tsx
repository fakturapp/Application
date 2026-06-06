'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { History, RotateCcw, Trash2, Lock } from '@/components/ui/icons'

interface SnapshotAppearance {
  template: string
  darkMode: boolean
  accentColor: string
  documentFont: string
  logoBorderRadius: number
}

interface Snapshot {
  id: string
  appearance: SnapshotAppearance | null
  createdAt: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export function InvoiceSnapshots() {
  const router = useRouter()
  const { user } = useAuth()
  const { refreshSettings } = useInvoiceSettings()
  const { toast } = useToast()
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const isPro = user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team'

  const load = useCallback(async () => {
    const { data } = await api.get<{ snapshots: Snapshot[] }>('/settings/invoices/snapshots')
    setSnapshots(data?.snapshots ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (snapshots.length === 0) return null

  async function restore(id: string) {
    if (!isPro) {
      router.push('/dashboard/settings/plan')
      return
    }
    setBusy(id)
    const { error } = await api.post(`/settings/invoices/snapshots/${id}/restore`, {})
    setBusy(null)
    if (error) {
      toast(error, 'error')
      return
    }
    await refreshSettings()
    setSnapshots((current) => current.filter((snapshot) => snapshot.id !== id))
    toast('Personnalisation restaurée', 'success')
  }

  async function remove(id: string) {
    setBusy(id)
    await api.delete(`/settings/invoices/snapshots/${id}`)
    setBusy(null)
    setSnapshots((current) => current.filter((snapshot) => snapshot.id !== id))
  }

  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Personnalisation sauvegardée</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {isPro
          ? 'Restaurez une personnalisation enregistrée à tout moment.'
          : 'Vos personnalisations sont conservées. Restaurez-les avec Faktur Pro.'}
      </p>
      <div className="space-y-2">
        {snapshots.map((snapshot) => (
          <div
            key={snapshot.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            <div
              className="h-6 w-6 shrink-0 rounded-md border border-border"
              style={{ backgroundColor: snapshot.appearance?.accentColor || '#6366f1' }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {snapshot.appearance
                  ? `${snapshot.appearance.template}${snapshot.appearance.darkMode ? ' · sombre' : ''} · ${snapshot.appearance.documentFont}`
                  : 'Sauvegarde'}
              </p>
              <p className="text-[10px] text-muted-foreground">{formatDate(snapshot.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => restore(snapshot.id)}
              disabled={busy === snapshot.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
            >
              {isPro ? <RotateCcw className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              Restaurer
            </button>
            <button
              type="button"
              onClick={() => remove(snapshot.id)}
              disabled={busy === snapshot.id}
              aria-label="Supprimer la sauvegarde"
              className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
