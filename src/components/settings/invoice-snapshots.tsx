'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { Crown, RotateCcw, Trash2, Lock } from '@/components/ui/icons'

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

export function InvoiceSnapshots() {
  const router = useRouter()
  const { user } = useAuth()
  const { refreshSettings } = useInvoiceSettings()
  const { toast } = useToast()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isPro = user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team'

  const load = useCallback(async () => {
    const { data } = await api.get<{ snapshots: Snapshot[] }>('/settings/invoices/snapshots')
    setSnapshot(data?.snapshots?.[0] ?? null)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!snapshot) return null

  async function restore() {
    if (!snapshot) return
    if (!isPro) {
      router.push('/dashboard/settings/plan')
      return
    }
    setBusy(true)
    const { error } = await api.post(`/settings/invoices/snapshots/${snapshot.id}/restore`, {})
    setBusy(false)
    if (error) {
      toast(error, 'error')
      return
    }
    await refreshSettings()
    setSnapshot(null)
    toast('Personnalisation restaurée', 'success')
  }

  async function remove() {
    if (!snapshot) return
    setBusy(true)
    await api.delete(`/settings/invoices/snapshots/${snapshot.id}`)
    setBusy(false)
    setSnapshot(null)
  }

  const appearance = snapshot.appearance

  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-500" />
        <p className="text-sm font-medium text-foreground">Sauvegarde Premium</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {isPro
          ? 'Votre personnalisation Pro a été conservée. Restaurez-la quand vous voulez.'
          : 'Votre personnalisation Pro est conservée. Restaurez-la avec Faktur Pro.'}
      </p>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
        <div
          className="h-6 w-6 shrink-0 rounded-md border border-border"
          style={{ backgroundColor: appearance?.accentColor || '#6366f1' }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {appearance
              ? `${appearance.template}${appearance.darkMode ? ' · sombre' : ''} · ${appearance.documentFont}`
              : 'Personnalisation'}
          </p>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-medium text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Annuler
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={restore}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
            >
              {isPro ? <RotateCcw className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              Restaurer
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Supprimer la sauvegarde"
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
