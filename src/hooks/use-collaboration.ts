'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'


export type CollabRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest'

export interface CollaboratorInfo {
  userId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  permission: 'viewer' | 'editor'
  isOwner: boolean
  role: CollabRole
  color: string
}

export interface CursorPosition {
  userId: string
  anchor: string
  x: number
  y: number
}

export interface DocumentChange {
  userId: string
  path: string
  value: any
  timestamp: number
}

export interface FieldFocus {
  userId: string
  fieldId: string
}

export interface FieldSelection {
  userId: string
  text: string
}

export interface UseCollaborationOptions {
  documentType: 'invoice' | 'quote' | 'credit_note'
  documentId: string | null
  enabled?: boolean
  onDocumentChange?: (change: DocumentChange) => void
  onDocumentSaved?: (savedByUserId: string) => void
  onAccessRevoked?: () => void
  onKicked?: (banned: boolean) => void
}

export interface UseCollaborationReturn {
  collaborators: CollaboratorInfo[]
  cursors: Map<string, CursorPosition>
  focusedFields: Map<string, string>
  selections: Map<string, FieldSelection>
  latencies: Map<string, number>
  myUserId: string | null
  myPermission: 'viewer' | 'editor' | null
  isOwner: boolean
  myRole: CollabRole | null
  isConnected: boolean
  myColor: string | null
  sendCursorMove: (anchor: string, x: number, y: number) => void
  sendDocumentChange: (path: string, value: any) => void
  sendFieldFocus: (fieldId: string) => void
  sendFieldBlur: (fieldId: string) => void
  sendFieldSelection: (fieldId: string, text: string) => void
  kickUser: (userId: string) => void
  banUser: (userId: string) => void
  changePermission: (userId: string, permission: 'viewer' | 'editor') => void
}

export function useCollaboration({
  documentType,
  documentId,
  enabled = true,
  onDocumentChange,
  onDocumentSaved,
  onAccessRevoked,
  onKicked,
}: UseCollaborationOptions): UseCollaborationReturn {
  const socketRef = useRef<Socket | null>(null)
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([])
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())
  const [focusedFields, setFocusedFields] = useState<Map<string, string>>(new Map())
  const [selections, setSelections] = useState<Map<string, FieldSelection>>(new Map())
  const [latencies, setLatencies] = useState<Map<string, number>>(new Map())
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myPermission, setMyPermission] = useState<'viewer' | 'editor' | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [myRole, setMyRole] = useState<CollabRole | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [myColor, setMyColor] = useState<string | null>(null)

  const onDocumentChangeRef = useRef(onDocumentChange)
  onDocumentChangeRef.current = onDocumentChange
  const onDocumentSavedRef = useRef(onDocumentSaved)
  onDocumentSavedRef.current = onDocumentSaved
  const onAccessRevokedRef = useRef(onAccessRevoked)
  onAccessRevokedRef.current = onAccessRevoked
  const onKickedRef = useRef(onKicked)
  onKickedRef.current = onKicked

  useEffect(() => {
    if (!enabled || !documentId) return

    const token = localStorage.getItem('faktur_token')

    const socket = io(`${WS_URL}/collaboration`, {
      path: '/ws',
      withCredentials: true,
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-document', { documentType, documentId })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setCursors(new Map()) // Clear cursors on disconnect
    })

    socket.on('connect_error', (err) => {
      console.warn('[collaboration] connection error:', err.message)
    })

    socket.on('room-joined', (data: {
      userId?: string
      permission: 'viewer' | 'editor'
      isOwner: boolean
      role?: CollabRole
      color: string
      collaborators: CollaboratorInfo[]
    }) => {
      setMyUserId(data.userId ?? null)
      setMyPermission(data.permission)
      setIsOwner(data.isOwner)
      setMyRole(data.role ?? (data.isOwner ? 'owner' : 'guest'))
      setMyColor(data.color)
      setCollaborators(data.collaborators)
    })

    socket.on('collaborator-joined', (collab: CollaboratorInfo) => {
      setCollaborators((prev) => {
        if (prev.some((c) => c.userId === collab.userId)) return prev
        return [...prev, collab]
      })
    })

    socket.on('collaborator-left', (data: { userId: string }) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== data.userId))
      setCursors((prev) => {
        const next = new Map(prev)
        next.delete(data.userId)
        return next
      })
      setFocusedFields((prev) => {
        const next = new Map(prev)
        for (const [fieldId, userId] of next) {
          if (userId === data.userId) next.delete(fieldId)
        }
        return next
      })
      setSelections((prev) => {
        const next = new Map(prev)
        for (const [fieldId, sel] of next) {
          if (sel.userId === data.userId) next.delete(fieldId)
        }
        return next
      })
      setLatencies((prev) => {
        const next = new Map(prev)
        next.delete(data.userId)
        return next
      })
    })

    socket.on('cursor-moved', (data: CursorPosition) => {
      setCursors((prev) => {
        const next = new Map(prev)
        next.set(data.userId, { ...data, _ts: Date.now() } as any)
        return next
      })
    })

    socket.on('document-changed', (change: DocumentChange) => {
      onDocumentChangeRef.current?.(change)
    })

    socket.on('field-focused', (data: FieldFocus) => {
      setFocusedFields((prev) => {
        const next = new Map(prev)
        next.set(data.fieldId, data.userId)
        return next
      })
    })

    socket.on('field-blurred', (data: FieldFocus) => {
      setFocusedFields((prev) => {
        const next = new Map(prev)
        if (next.get(data.fieldId) === data.userId) {
          next.delete(data.fieldId)
        }
        return next
      })
      setSelections((prev) => {
        if (prev.get(data.fieldId)?.userId !== data.userId) return prev
        const next = new Map(prev)
        next.delete(data.fieldId)
        return next
      })
    })

    socket.on('field-selection-changed', (data: { userId: string; fieldId: string; text: string }) => {
      setSelections((prev) => {
        const next = new Map(prev)
        if (!data.text) {
          if (next.get(data.fieldId)?.userId !== data.userId) return prev
          next.delete(data.fieldId)
        } else {
          next.set(data.fieldId, { userId: data.userId, text: data.text })
        }
        return next
      })
    })

    socket.on('collaborator-latency', (data: { userId: string; latencyMs: number }) => {
      setLatencies((prev) => {
        const next = new Map(prev)
        next.set(data.userId, data.latencyMs)
        return next
      })
    })

    socket.on('kicked', (data: { banned?: boolean }) => {
      if (onKickedRef.current) {
        onKickedRef.current(!!data?.banned)
      } else {
        onAccessRevokedRef.current?.()
      }
    })

    socket.on('permission-changed', (data: { permission: 'viewer' | 'editor' }) => {
      setMyPermission(data.permission)
    })

    socket.on('collaborator-updated', (data: { userId: string; permission: 'viewer' | 'editor' }) => {
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === data.userId ? { ...c, permission: data.permission } : c))
      )
    })

    socket.on('document-saved', (data: { savedByUserId: string }) => {
      onDocumentSavedRef.current?.(data.savedByUserId)
    })

    socket.on('document-deleted', () => {
      onAccessRevokedRef.current?.()
    })

    socket.on('access-revoked', () => {
      onAccessRevokedRef.current?.()
    })

    socket.on('access-denied', () => {
      onAccessRevokedRef.current?.()
    })

    socket.on('error', (data: { message: string }) => {
      console.error('[collaboration]', data.message)
    })

    const pingLoop = setInterval(() => {
      if (!socket.connected) return
      const t0 = Date.now()
      socket.emit('ping-check', () => {
        const ms = Date.now() - t0
        socket.emit('latency-report', { ms })
      })
    }, 5000)

    // Clean up stale cursors every 5s (remove if no update for 5s)
    const cursorCleanup = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now()
        let changed = false
        const next = new Map(prev)
        for (const [userId, pos] of next) {
          if (now - ((pos as any)._ts || 0) > 5000) {
            next.delete(userId)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 5000)

    return () => {
      clearInterval(cursorCleanup)
      clearInterval(pingLoop)
      socket.emit('leave-document')
      socket.disconnect()
      socketRef.current = null
      setCollaborators([])
      setCursors(new Map())
      setFocusedFields(new Map())
      setSelections(new Map())
      setLatencies(new Map())
      setMyUserId(null)
      setMyPermission(null)
      setIsOwner(false)
      setMyRole(null)
      setIsConnected(false)
      setMyColor(null)
    }
  }, [documentType, documentId, enabled])

  // Throttle cursor moves to ~30fps to avoid flooding
  const lastCursorSend = useRef(0)
  const sendCursorMove = useCallback((anchor: string, x: number, y: number) => {
    const isHideSignal = anchor === ''
    const now = Date.now()
    if (!isHideSignal && now - lastCursorSend.current < 33) return
    lastCursorSend.current = now
    socketRef.current?.emit('cursor-move', { anchor, x, y })
  }, [])

  const sendDocumentChange = useCallback((path: string, value: any) => {
    socketRef.current?.emit('document-change', { path, value })
  }, [])

  const sendFieldFocus = useCallback((fieldId: string) => {
    socketRef.current?.emit('field-focus', { fieldId })
  }, [])

  const sendFieldBlur = useCallback((fieldId: string) => {
    socketRef.current?.emit('field-blur', { fieldId })
  }, [])

  const sendFieldSelection = useCallback((fieldId: string, text: string) => {
    socketRef.current?.emit('field-selection', { fieldId, text: text.slice(0, 200) })
  }, [])

  const kickUser = useCallback((userId: string) => {
    socketRef.current?.emit('kick-user', { userId })
  }, [])

  const banUser = useCallback((userId: string) => {
    socketRef.current?.emit('ban-user', { userId })
  }, [])

  const changePermission = useCallback((userId: string, permission: 'viewer' | 'editor') => {
    socketRef.current?.emit('change-permission', { userId, permission })
  }, [])

  return {
    collaborators,
    cursors,
    focusedFields,
    selections,
    latencies,
    myUserId,
    myPermission,
    isOwner,
    myRole,
    isConnected,
    myColor,
    sendCursorMove,
    sendDocumentChange,
    sendFieldFocus,
    sendFieldBlur,
    sendFieldSelection,
    kickUser,
    banUser,
    changePermission,
  }
}
