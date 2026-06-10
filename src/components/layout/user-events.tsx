'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export function UserEvents() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('faktur_token')
    const socket = io(`${WS_URL}/user`, {
      path: '/ws',
      withCredentials: true,
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('team-role-updated', (data: { role?: string; teamName?: string | null }) => {
      const labels: Record<string, string> = {
        admin: 'Administrateur',
        member: 'Membre',
        viewer: 'Lecteur',
      }
      const roleLabel = data?.role ? labels[data.role] ?? data.role : null
      toast(
        roleLabel
          ? `Félicitations, votre rôle dans l'équipe a été mis à jour : ${roleLabel}`
          : "Félicitations, votre rôle dans l'équipe a été mis à jour",
        'success'
      )
      refreshUser()
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id, refreshUser, toast])

  return null
}
