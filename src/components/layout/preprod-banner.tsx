'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Database, X } from '@/components/ui/icons'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IS_PREPROD } from '@/lib/app-env'

const DISMISS_KEY = 'faktur_preprod_dismissed'

export function PreprodBanner() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    setDismissed(true)
    setOpen(false)
  }

  if (!IS_PREPROD || dismissed) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[9998] flex items-stretch border-t border-amber-600/40 bg-amber-500 shadow-[0_-4px_16px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Environnement de préproduction, en savoir plus"
          className="flex flex-1 items-center justify-center gap-2 px-4 py-1.5 text-[12px] font-semibold text-amber-950 transition-colors hover:bg-amber-400"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="tracking-wide uppercase">
            Environnement de préproduction, cliquez pour en savoir plus
          </span>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer le bandeau de préproduction"
          className="flex shrink-0 items-center justify-center border-l border-amber-600/40 px-3 text-amber-950 transition-colors hover:bg-amber-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader
          onClose={() => setOpen(false)}
          icon={<Database className="h-5 w-5 text-amber-600" />}
        >
          <DialogTitle>Vous êtes sur la préproduction</DialogTitle>
          <DialogDescription>Environnement de test relié à la vraie base de données</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-foreground">
          <p>
            Ce site est un environnement de <strong>préproduction</strong>. Il n&apos;est pas
            isolé&nbsp;: il est connecté à la <strong>vraie base de données de production</strong>.
          </p>
          <p>
            Tout ce que vous faites ici, créer, modifier ou supprimer des données, peut
            <strong> affecter le site réel</strong> et entraîner une
            <strong> perte définitive de données</strong> pour de vrais utilisateurs.
          </p>
          <div className="rounded-lg border border-amber-600/30 bg-amber-500/10 p-3 text-[13px] text-amber-900 dark:text-amber-200">
            Ne l&apos;utilisez pas comme une application normale. Réservez vos actions aux tests
            strictement nécessaires, en sachant qu&apos;elles sont irréversibles.
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={dismiss}>
            Ne plus afficher
          </Button>
          <Button onClick={() => setOpen(false)}>J&apos;ai compris</Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
