'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

type Status = 'creating' | 'waiting' | 'denied' | 'expired' | 'error'

interface Props {
  onVerified: () => void
  onNoDevice?: () => void
}

export function AppSecurityWaiting({ onVerified, onNoDevice }: Props) {
  const [matchCode, setMatchCode] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('creating')
  const challengeIdRef = useRef<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  function start() {
    setStatus('creating')
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    let deadline = Date.now() + 130_000

    const poll = async () => {
      if (cancelled || !challengeIdRef.current) return
      if (Date.now() > deadline) return setStatus('expired')
      const { data } = await api.get<{ status: string; verified?: boolean }>(
        `/account/security/app-challenge/${challengeIdRef.current}`
      )
      if (cancelled) return
      if (data?.status === 'approved' && data.verified) {
        onVerified()
        return
      }
      if (data?.status === 'denied') return setStatus('denied')
      if (data?.status === 'expired' || data?.status === 'consumed') return setStatus('expired')
      pollTimer = setTimeout(poll, 2000)
    }

    const create = async () => {
      const { data, error } = await api.post<{
        challengeId: string
        requireMatch: boolean
        matchCode: string | null
        expiresIn?: number
      }>('/account/security/app-challenge', {})
      if (cancelled) return
      if (error || !data?.challengeId) {
        if (onNoDevice) onNoDevice()
        setStatus('error')
        return
      }
      challengeIdRef.current = data.challengeId
      if (data.expiresIn && data.expiresIn > 0) deadline = Date.now() + (data.expiresIn + 5) * 1000
      setMatchCode(data.matchCode)
      setStatus('waiting')
      poll()
    }

    create()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }

  useEffect(() => {
    cleanupRef.current = start()
    return () => cleanupRef.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = () => {
    cleanupRef.current?.()
    challengeIdRef.current = null
    cleanupRef.current = start()
  }

  if (status === 'denied' || status === 'expired' || status === 'error') {
    const msg =
      status === 'denied'
        ? 'Action refusée depuis votre téléphone.'
        : status === 'expired'
          ? 'La demande a expiré.'
          : 'Aucun appareil disponible. Utilisez une autre méthode.'
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-semibold text-foreground">{msg}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="py-6 text-center">
      <p className="text-sm font-semibold text-foreground">Ouvrez Faktur sur votre téléphone</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Confirmez votre identité en appuyant sur «&nbsp;Oui, c&apos;est moi&nbsp;».
      </p>

      {matchCode && (
        <div className="mt-5">
          <p className="text-[13px] text-muted-foreground">
            Sélectionnez ce numéro dans l&apos;application&nbsp;:
          </p>
          <div className="mt-2 text-5xl font-extrabold tabular-nums tracking-widest text-primary">
            {matchCode}
          </div>
        </div>
      )}

      <div className="mt-5 inline-flex items-center gap-2 text-muted-foreground">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">En attente d&apos;approbation...</span>
      </div>
    </div>
  )
}
