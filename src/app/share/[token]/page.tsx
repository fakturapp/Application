'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { api, publicApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { accountLoginUrl } from '@/lib/account-redirect'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ShieldAlert, LogIn } from '@/components/ui/icons'

type DocumentType = 'invoice' | 'quote' | 'credit_note'

const documentRoutes: Record<DocumentType, string> = {
  invoice: 'invoices',
  quote: 'quotes',
  credit_note: 'credit-notes',
}

export default function ShareLinkPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useAuth()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'error' | 'unauthenticated'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (loading) return

    if (!user) {
      let cancelled = false
      async function probeGuestAccess() {
        const { data } = await publicApi.get<{ allowed: boolean }>(`/share/guest/${token}/check`)
        if (cancelled) return
        if (data?.allowed) {
          router.replace(`/share/live/${token}`)
          return
        }
        setStatus('unauthenticated')
      }
      probeGuestAccess()
      return () => {
        cancelled = true
      }
    }

    async function validate() {
      const { data, error } = await api.get<{
        message: string
        data: {
          documentType: DocumentType
          documentId: string
          permission: string
          isOwner: boolean
        }
      }>(`/share/validate/${token}`)

      if (error) {
        setStatus('error')
        setErrorMessage(error)
        return
      }

      if (data?.data) {
        const { documentType, documentId } = data.data
        const route = documentRoutes[documentType]
        router.replace(`/dashboard/${route}/${documentId}/edit`)
      }
    }

    validate()
  }, [token, router, user, loading])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Vérification de l&apos;accès...</p>
        </motion.div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm mx-auto px-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft mx-auto mb-5">
            <LogIn className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Connexion requise</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Connectez-vous pour accéder à ce document partagé.
          </p>
          <Button onClick={() => { window.location.href = accountLoginUrl(window.location.href) }} className="gap-2">
            <LogIn className="h-4 w-4" /> Se connecter
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm mx-auto px-6"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-5">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Accès refusé</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {errorMessage || 'Ce lien de partage est invalide ou a été désactivé.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Retour au tableau de bord
        </Button>
      </motion.div>
    </div>
  )
}
