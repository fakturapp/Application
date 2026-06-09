'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShareModal } from '@/components/collaboration/share-modal'
import { PresenceBar } from '@/components/collaboration/presence-bar'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { FieldHighlights } from '@/components/collaboration/field-highlights'
import { getFieldPath, isEditableElement } from '@/components/collaboration/field-path'
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
          canModerate={collab?.isOwner ?? false}
          onKick={(id) => collab?.kickUser(id)}
          onBan={(id) => collab?.banUser(id)}
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
  sheetRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

const CLICKABLE_SELECTOR = 'button, a, [role="button"], [data-collab-target], .cursor-pointer'
const CLICK_HIGHLIGHT_MS = 2500

export function CollaborationEditor({
  editorRef,
  sheetRef,
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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!sheetRef.current || !isConnected || !sendCursorMove) return
      const rect = sheetRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const xPct = (e.clientX - rect.left) / rect.width
      const yPct = (e.clientY - rect.top) / rect.height
      sendCursorMove(xPct, yPct)
    },
    [sheetRef, isConnected, sendCursorMove]
  )

  const handlePointerLeave = useCallback(() => {
    sendCursorMove?.(-10, -10)
  }, [sendCursorMove])

  useEffect(() => {
    const container = editorRef.current
    if (!container || !isConnected || !sendFieldFocus || !sendFieldBlur) return

    const pathFor = (target: EventTarget | null): string | null => {
      const sheet = sheetRef.current
      if (!sheet || !isEditableElement(target)) return null
      if (!sheet.contains(target)) return null
      return getFieldPath(target, sheet)
    }

    const handleFocusIn = (e: FocusEvent) => {
      const path = pathFor(e.target)
      if (path) sendFieldFocus(path)
    }
    const handleFocusOut = (e: FocusEvent) => {
      const path = pathFor(e.target)
      if (path) sendFieldBlur(path)
    }

    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)
    return () => {
      container.removeEventListener('focusin', handleFocusIn)
      container.removeEventListener('focusout', handleFocusOut)
    }
  }, [editorRef, sheetRef, isConnected, sendFieldFocus, sendFieldBlur])

  const selectedFieldRef = useRef<string | null>(null)
  const lastSelectionKeyRef = useRef('')

  useEffect(() => {
    if (!isConnected || !sendFieldSelection) return

    let raf = 0
    const broadcastSelection = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const sheet = sheetRef.current
        if (!sheet) return

        const el = document.activeElement
        let fieldId: string | null = null
        let text = ''

        if (
          el &&
          (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
          sheet.contains(el)
        ) {
          const start = el.selectionStart ?? 0
          const end = el.selectionEnd ?? 0
          if (end > start) {
            fieldId = getFieldPath(el, sheet)
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
  }, [isConnected, sendFieldSelection, sheetRef])

  const clickedPathRef = useRef<string | null>(null)
  const clickBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const container = editorRef.current
    if (!container || !isConnected || !sendFieldFocus || !sendFieldBlur) return

    const handlePointerDown = (e: PointerEvent) => {
      const sheet = sheetRef.current
      if (!sheet) return
      const origin = e.target instanceof Element ? e.target : null
      const target = origin?.closest(CLICKABLE_SELECTOR)
      if (!(target instanceof HTMLElement) || !sheet.contains(target)) return
      if (isEditableElement(target)) return

      const path = getFieldPath(target, sheet)
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

    container.addEventListener('pointerdown', handlePointerDown)
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown)
      if (clickBlurTimerRef.current) clearTimeout(clickBlurTimerRef.current)
    }
  }, [editorRef, sheetRef, isConnected, sendFieldFocus, sendFieldBlur])

  const isReadOnly = myPermission === 'viewer'

  return (
    <div
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      ref={editorRef as React.RefObject<HTMLDivElement>}
    >
      {isConnected && (
        <>
          <LiveCursors
            cursors={cursors}
            collaborators={collaborators}
            containerRef={editorRef}
            sheetRef={sheetRef}
          />
          <FieldHighlights
            focusedFields={focusedFields}
            selections={selections}
            collaborators={collaborators}
            containerRef={editorRef}
            sheetRef={sheetRef}
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
