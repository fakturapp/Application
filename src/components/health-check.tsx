'use client'

import { useEffect, useRef, useState } from 'react'
import { onConnectionStatus } from '@/lib/api'
import { toast } from '@/components/ui/toast'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WifiOff } from '@/components/ui/icons'

export function HealthCheckProvider({ children }: { children: React.ReactNode }) {
  const [showError, setShowError] = useState(false)
  const connectingToastRef = useRef<string | null>(null)

  useEffect(() => {
    const closeConnectingToast = () => {
      if (connectingToastRef.current) {
        toast.close(connectingToastRef.current)
        connectingToastRef.current = null
      }
    }

    const unsubscribe = onConnectionStatus((status) => {
      if (status === 'connecting') {
        if (!connectingToastRef.current) {
          connectingToastRef.current = toast('Tentative de connexion au serveur…', {
            isLoading: true,
            timeout: 0,
          })
        }
        return
      }

      if (status === 'offline') {
        closeConnectingToast()
        setShowError(true)
        return
      }

      closeConnectingToast()
      setShowError(false)
    })

    return () => {
      unsubscribe()
      closeConnectingToast()
    }
  }, [])

  return (
    <>
      {children}

      <Dialog open={showError} onClose={() => setShowError(false)} className="max-w-sm">
        <div className="flex flex-col items-center px-2 pb-1 pt-1 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <WifiOff className="h-7 w-7" />
          </div>
          <DialogTitle className="text-lg font-bold">Erreur de connexion au serveur</DialogTitle>
          <DialogDescription className="mt-1.5 max-w-xs">
            Impossible de joindre le serveur Faktur pour le moment. Vérifiez votre connexion internet
            puis réessayez dans quelques instants.
          </DialogDescription>
          <div className="mt-6 w-full">
            <Button className="w-full" onClick={() => setShowError(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
