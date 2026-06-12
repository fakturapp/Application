'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useAuth } from '@/lib/auth'
import { SaveBar } from '@/components/ui/save-bar'
import { Lock } from '@/components/ui/icons'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { saving, saveError, hasChanges, save, resetChanges } = useInvoiceSettings()
  const showInvoiceSaveBar = !pathname.startsWith('/dashboard/settings/company')

  const canManageSettings =
    user?.currentTeamRole === 'super_admin' || user?.currentTeamRole === 'admin'

  if (user && !canManageSettings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <div className="app-surface w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Accès réservé aux administrateurs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous n&apos;avez pas les permissions pour gérer les paramètres de l&apos;équipe.
            Contactez un administrateur de votre équipe.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {showInvoiceSaveBar && (
        <SaveBar
          hasChanges={hasChanges}
          saving={saving}
          error={saveError}
          onSave={save}
          onReset={resetChanges}
        />
      )}
    </>
  )
}
