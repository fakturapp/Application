'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShareModal } from '@/components/collaboration/share-modal'
import { PresenceBar } from '@/components/collaboration/presence-bar'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { FieldHighlights } from '@/components/collaboration/field-highlights'
import {
  getCollabRoots,
  getCursorAnchor,
  getFieldPath,
  isEditableElement,
} from '@/components/collaboration/field-path'
import { ReadOnlyBanner } from '@/components/collaboration/read-only-banner'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import { Share2, Wifi, WifiOff, FlaskConical } from '@/components/ui/icons'


type DocumentType = 'invoice' | 'quote' | 'credit_note'

interface CollaborationToolbarProps {
  documentType: DocumentType
  documentId: string | null
  canShare?: boolean
  className?: string
}

export function CollaborationToolbar({
  documentType,
  documentId,
  canShare = true,
  className,
}: CollaborationToolbarProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const collab = useCollaborationContext()

  const collaborators = collab?.collaborators ?? []
  const isConnected = collab?.isConnected ?? false
  const canModerate = collab?.myRole === 'owner' || collab?.myRole === 'admin'

  return (
    <>
      <div className={className}>
        {}
        {documentId && (
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mr-1"
            title={isConnected ? 'Connecté en temps réel' : 'Connexion au serveur de collaboration...'}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="hidden sm:inline">En direct</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Connexion...</span>
              </>
            )}
          </div>
        )}

        {}
        <PresenceBar
          collaborators={collaborators}
          latencies={collab?.latencies}
          myUserId={collab?.myUserId}
          myRole={collab?.myRole ?? null}
          canModerate={canModerate}
          onKick={(id) => collab?.kickUser(id)}
          onBan={(id) => collab?.banUser(id)}
          onChangePermission={(id, permission) => collab?.changePermission(id, permission)}
        />

        {}
        {documentId && canShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5 relative"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager
            <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-1.5 py-px text-[9px] font-bold text-purple-500 uppercase tracking-wider">
              <FlaskConical className="h-2.5 w-2.5" />
              Beta
            </span>
          </Button>
        )}
      </div>

      {}
      {documentId && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          documentType={documentType}
          documentId={documentId}
        />
      )}
    </>
  )
}


export function CollaborationReadOnlyBanner() {
  const collab = useCollaborationContext()
  if (!collab || collab.myPermission !== 'viewer') return null
  return <ReadOnlyBanner />
}


interface CollaborationEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  panelRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

const CLICKABLE_SELECTOR = 'button, a, [role="button"], .cursor-pointer'
const CLICK_HIGHLIGHT_MS = 2500
const CURSOR_THROTTLE_MS = 33

export function CollaborationEditor({
  editorRef,
  panelRef,
  children,
}: CollaborationEditorProps) {
  const collab = useCollaborationContext()

  const collaborators = collab?.collaborators ?? []
  const cursors = collab?.cursors ?? new Map()
  const focusedFields = collab?.focusedFields ?? new Map()
  const selections = collab?.selections ?? new Map()
  const isConnected = collab?.isConnected ?? false
  const myPermission = collab?.myPermission
  const sendCursorMove = collab?.sendCursorMove
  const sendFieldFocus = collab?.sendFieldFocus
  const sendFieldBlur = collab?.sendFieldBlur
  const sendFieldSelection = collab?.sendFieldSelection

  const cursorVisibleRef = useRef(false)
  const lastCursorComputeRef = useRef(0)

  useEffect(() => {
    if (!isConnected || !sendCursorMove) return

    const hideCursor = () => {
      if (!cursorVisibleRef.current) return
      cursorVisibleRef.current = false
      sendCursorMove('', -1, -1)
    }

    const handlePointerMove = (e: PointerEvent) => {
      const now = Date.now()
      if (now - lastCursorComputeRef.current < CURSOR_THROTTLE_MS) return
      lastCursorComputeRef.current = now

      const roots = getCollabRoots(editorRef.current, panelRef?.current ?? null)
      const anchor = getCursorAnchor(roots, e.clientX, e.clientY)
      if (anchor) {
        cursorVisibleRef.current = true
        sendCursorMove(anchor.anchor, anchor.x, anchor.y)
      } else {
        hideCursor()
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('mouseleave', hideCursor)
    window.addEventListener('blur', hideCursor)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('mouseleave', hideCursor)
      window.removeEventListener('blur', hideCursor)
    }
  }, [editorRef, panelRef, isConnected, sendCursorMove])

  useEffect(() => {
    if (!isConnected || !sendFieldFocus || !sendFieldBlur) return

    const pathFor = (target: EventTarget | null): string | null => {
      if (!isEditableElement(target)) return null
      const roots = getCollabRoots(editorRef.current, panelRef?.current ?? null)
      return getFieldPath(target, roots)
    }

    const handleFocusIn = (e: FocusEvent) => {
      const path = pathFor(e.target)
      if (path) sendFieldFocus(path)
    }
    const handleFocusOut = (e: FocusEvent) => {
      const path = pathFor(e.target)
      if (path) sendFieldBlur(path)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [editorRef, panelRef, isConnected, sendFieldFocus, sendFieldBlur])

  const selectedFieldRef = useRef<string | null>(null)
  const lastSelectionKeyRef = useRef('')

  useEffect(() => {
    if (!isConnected || !sendFieldSelection) return

    let raf = 0
    const broadcastSelection = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const roots = getCollabRoots(editorRef.current, panelRef?.current ?? null)

        const el = document.activeElement
        let fieldId: string | null = null
        let text = ''

        if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          const start = el.selectionStart ?? 0
          const end = el.selectionEnd ?? 0
          if (end > start) {
            fieldId = getFieldPath(el, roots)
            text = el.value.slice(start, end).slice(0, 120)
          }
        }

        const key = fieldId ? `${fieldId}::${text}` : ''
        if (key === lastSelectionKeyRef.current) return
        lastSelectionKeyRef.current = key

        if (selectedFieldRef.current && selectedFieldRef.current !== fieldId) {
          sendFieldSelection(selectedFieldRef.current, '')
        }
        if (fieldId) {
          sendFieldSelection(fieldId, text)
        }
        selectedFieldRef.current = fieldId
      })
    }

    document.addEventListener('selectionchange', broadcastSelection)
    return () => {
      document.removeEventListener('selectionchange', broadcastSelection)
      cancelAnimationFrame(raf)
    }
  }, [editorRef, panelRef, isConnected, sendFieldSelection])

  const clickedPathRef = useRef<string | null>(null)
  const clickBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isConnected || !sendFieldFocus || !sendFieldBlur) return

    const handlePointerDown = (e: PointerEvent) => {
      const origin = e.target instanceof Element ? e.target : null
      if (!origin) return
      const roots = getCollabRoots(editorRef.current, panelRef?.current ?? null)
      const inScope = (el: Element) =>
        (roots.content?.contains(el) ?? false) || (roots.panel?.contains(el) ?? false)

      const target =
        origin.closest('[data-collab-target]') ?? origin.closest(CLICKABLE_SELECTOR)
      if (!(target instanceof HTMLElement) || !inScope(target)) return
      if (isEditableElement(target)) return

      const path = getFieldPath(target, roots)
      if (!path) return

      if (clickBlurTimerRef.current) clearTimeout(clickBlurTimerRef.current)
      if (clickedPathRef.current && clickedPathRef.current !== path) {
        sendFieldBlur(clickedPathRef.current)
      }

      sendFieldFocus(path)
      clickedPathRef.current = path
      clickBlurTimerRef.current = setTimeout(() => {
        sendFieldBlur(path)
        clickedPathRef.current = null
      }, CLICK_HIGHLIGHT_MS)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      if (clickBlurTimerRef.current) clearTimeout(clickBlurTimerRef.current)
    }
  }, [editorRef, panelRef, isConnected, sendFieldFocus, sendFieldBlur])

  const isReadOnly = myPermission === 'viewer'

  return (
    <div className="relative" ref={editorRef as React.RefObject<HTMLDivElement>}>
      {isConnected && (
        <>
          <LiveCursors
            cursors={cursors}
            collaborators={collaborators}
            editorRef={editorRef}
            panelRef={panelRef}
          />
          <FieldHighlights
            focusedFields={focusedFields}
            selections={selections}
            collaborators={collaborators}
            editorRef={editorRef}
            panelRef={panelRef}
          />
        </>
      )}

      {isReadOnly ? (
        <div className="cursor-not-allowed" title="Lecture seule : vous ne pouvez pas modifier ce document">
          <div className="pointer-events-none select-none">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
