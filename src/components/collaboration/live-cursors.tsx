'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CollaboratorInfo, CursorPosition } from '@/hooks/use-collaboration'
import { getCollabRoots, resolveFieldPath } from '@/components/collaboration/field-path'

const STIFFNESS = 380
const DAMPING = 36
const EPSILON = 0.05

interface SpringState {
  x: number
  y: number
  vx: number
  vy: number
  initialized: boolean
}

interface LiveCursorsProps {
  cursors: Map<string, CursorPosition>
  collaborators: CollaboratorInfo[]
  editorRef: React.RefObject<HTMLElement | null>
  panelRef?: React.RefObject<HTMLElement | null>
}

function getDisplayName(collab: CollaboratorInfo): string {
  if (collab.fullName) return collab.fullName.split(' ')[0]
  return collab.email.split('@')[0]
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function LiveCursors({ cursors, collaborators, editorRef, panelRef }: LiveCursorsProps) {
  const collabMap = new Map(collaborators.map((c) => [c.userId, c]))
  const targetsRef = useRef(new Map<string, { anchor: string; x: number; y: number }>())
  const springsRef = useRef(new Map<string, SpringState>())
  const elementsRef = useRef(new Map<string, HTMLDivElement>())
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const windowFocusedRef = useRef(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(
    (currentTime: number) => {
      rafRef.current = null
      const roots = getCollabRoots(editorRef.current, panelRef?.current ?? null)

      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = currentTime

      let anyVisible = false

      for (const [userId, target] of targetsRef.current) {
        const el = elementsRef.current.get(userId)
        if (!el) continue

        const anchorEl = target.anchor ? resolveFieldPath(target.anchor, roots) : null
        if (!anchorEl || !windowFocusedRef.current) {
          el.style.opacity = '0'
          continue
        }

        const rect = anchorEl.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          el.style.opacity = '0'
          continue
        }

        anyVisible = true

        const isFreeAnchor = target.anchor === 'ed:'
        const ax = isFreeAnchor ? target.x : clamp01(target.x)
        const ay = isFreeAnchor ? target.y : clamp01(target.y)
        let tx = rect.left + ax * rect.width
        let ty = rect.top + ay * rect.height

        const minX = 8
        const minY = 8
        const maxX = window.innerWidth - 30
        const maxY = window.innerHeight - 30
        const cx = Math.min(Math.max(tx, minX), maxX)
        const cy = Math.min(Math.max(ty, minY), maxY)
        const offscreen = cx !== tx || cy !== ty
        tx = cx
        ty = cy

        let spring = springsRef.current.get(userId)
        if (!spring || !spring.initialized) {
          spring = { x: tx, y: ty, vx: 0, vy: 0, initialized: true }
          springsRef.current.set(userId, spring)
        }

        spring.vx += (-STIFFNESS * (spring.x - tx) - DAMPING * spring.vx) * dt
        spring.vy += (-STIFFNESS * (spring.y - ty) - DAMPING * spring.vy) * dt
        spring.x += spring.vx * dt
        spring.y += spring.vy * dt

        const settled =
          Math.abs(spring.vx) < EPSILON &&
          Math.abs(spring.vy) < EPSILON &&
          Math.abs(spring.x - tx) < EPSILON &&
          Math.abs(spring.y - ty) < EPSILON

        if (settled) {
          spring.x = tx
          spring.y = ty
          spring.vx = 0
          spring.vy = 0
        }

        el.style.transform = `translate3d(${spring.x}px, ${spring.y}px, 0)`
        el.style.opacity = offscreen ? '0.55' : '1'
      }

      if (anyVisible) {
        rafRef.current = requestAnimationFrame(tick)
      }
    },
    [editorRef, panelRef]
  )

  const ensureLoop = useCallback(() => {
    if (rafRef.current === null) {
      lastTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  useEffect(() => {
    for (const [userId, pos] of cursors) {
      targetsRef.current.set(userId, { anchor: pos.anchor ?? '', x: pos.x, y: pos.y })
    }
    for (const userId of targetsRef.current.keys()) {
      if (!cursors.has(userId)) {
        targetsRef.current.delete(userId)
        springsRef.current.delete(userId)
        const el = elementsRef.current.get(userId)
        if (el) el.style.opacity = '0'
      }
    }
    ensureLoop()
  }, [cursors, ensureLoop])

  useEffect(() => {
    const handleBlur = () => {
      windowFocusedRef.current = false
      for (const el of elementsRef.current.values()) {
        el.style.opacity = '0'
      }
    }
    const handleFocus = () => {
      windowFocusedRef.current = true
      ensureLoop()
    }
    const handleResize = () => ensureLoop()

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [ensureLoop])

  useEffect(() => stopLoop, [stopLoop])

  const setRef = useCallback((userId: string, el: HTMLDivElement | null) => {
    if (el) {
      elementsRef.current.set(userId, el)
    } else {
      elementsRef.current.delete(userId)
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {Array.from(cursors.keys()).map((userId) => {
        const collab = collabMap.get(userId)
        if (!collab) return null

        return (
          <div
            key={userId}
            ref={(el) => setRef(userId, el)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0,
              willChange: 'transform',
              transition: 'opacity 0.15s ease',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="20"
              height="20"
              fill="none"
              style={{ color: collab.color, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
            >
              <path
                fill="currentColor"
                d="m.088 1.75 11.25 29.422c.409 1.07 1.908 1.113 2.377.067l5.223-11.653c.13-.288.36-.518.648-.648l11.653-5.223c1.046-.47 1.004-1.968-.067-2.377L1.75.088C.71-.31-.31.71.088 1.75Z"
              />
            </svg>
            <div
              className="ml-4 -mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow-md select-none"
              style={{ backgroundColor: collab.color }}
            >
              {getDisplayName(collab)}
            </div>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
