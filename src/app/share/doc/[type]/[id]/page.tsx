'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { accountLoginUrl } from '@/lib/account-redirect'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ShieldAlert, LogIn } from '@/components/ui/icons'

const VALID_ROUTES = new Set(['invoices', 'quotes', 'credit-notes'])

export default function SharedDocumentRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useAuth()
  const type = params.type as string
  const id = params.id as string

  const [status, setStatus] = useState<'loading' | 'invalid' | 'unauthenticated'>('loading')

  useEffect(() => {
    if (!VALID_ROUTES.has(type) || !id) {
      setStatus('invalid')
      return
    }

    if (loading) return

    if (!user) {
      setStatus('unauthenticated')
      return
    }

    router.replace(`/dashboard/${type}/${id}/edit`)
  }, [type, id, router, user, loading])

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
            Connectez-vous avec l&apos;adresse email qui a reçu l&apos;invitation pour ouvrir ce
            document partagé.
          </p>
          <Button
            onClick={() => {
              window.location.href = accountLoginUrl(window.location.href)
            }}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" /> Se connecter
          </Button>
        </motion.div>
      </div>
    )
  }

  if (status === 'invalid') {
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
          <h2 className="text-xl font-bold text-foreground mb-2">Lien invalide</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Ce lien de document partagé est invalide.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Ouverture du document...</p>
      </motion.div>
    </div>
  )
}
