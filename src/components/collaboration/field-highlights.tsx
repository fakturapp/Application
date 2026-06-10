'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CollaboratorInfo, FieldSelection } from '@/hooks/use-collaboration'
import { getCollabRoots, resolveFieldPath } from '@/components/collaboration/field-path'

interface FieldHighlightsProps {
  focusedFields: Map<string, string>
  selections?: Map<string, FieldSelection>
  collaborators: CollaboratorInfo[]
  editorRef: React.RefObject<HTMLElement | null>
  panelRef?: React.RefObject<HTMLElement | null>
}

interface HighlightBox {
  fieldId: string
  color: string
  name: string
  selection: string | null
  selLeft: number | null
  selWidth: number | null
  top: number
  left: number
  width: number
  height: number
}

let measureCtx: CanvasRenderingContext2D | null = null

function measureSelection(
  el: HTMLInputElement,
  start: number,
  end: number
): { left: number; width: number } | null {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  if (!measureCtx) return null
  const cs = getComputedStyle(el)
  measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const value = el.value
  const x1 = measureCtx.measureText(value.slice(0, start)).width
  const x2 = measureCtx.measureText(value.slice(0, end)).width
  const padLeft = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)
  return { left: padLeft + x1 - el.scrollLeft, width: Math.max(3, x2 - x1) }
}

function getDisplayName(collab: CollaboratorInfo): string {
  if (collab.fullName) return collab.fullName.split(' ')[0]
  return collab.email.split('@')[0]
}

function boxesEqual(a: HighlightBox[], b: HighlightBox[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (
      x.fieldId !== y.fieldId ||
      x.color !== y.color ||
      x.selection !== y.selection ||
      x.selLeft !== y.selLeft ||
      x.selWidth !== y.selWidth ||
      Math.abs(x.top - y.top) > 0.5 ||
      Math.abs(x.left - y.left) > 0.5 ||
      Math.abs(x.width - y.width) > 0.5 ||
      Math.abs(x.height - y.height) > 0.5
    ) {
      return false
    }
  }
  return true
}

const EMPTY_SELECTIONS = new Map<string, FieldSelection>()

export function FieldHighlights({
  focusedFields,
  selections = EMPTY_SELECTIONS,
  collaborators,
  editorRef,
  panelRef,
}: FieldHighlightsProps) {
  const [boxes, setBoxes] = useState<HighlightBox[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const compute = () => {
      if (focusedFields.size === 0 && selections.size === 0) {
        setBoxes((prev) => (prev.length === 0 ? prev : []))
        return
      }

      const roots = getCollabRoots(editorRef.current, panelRef?.current ?? null)
      const next: HighlightBox[] = []
      const fieldIds = new Set([...focusedFields.keys(), ...selections.keys()])

      for (const fieldId of fieldIds) {
        const userId = focusedFields.get(fieldId) ?? selections.get(fieldId)?.userId
        if (!userId) continue
        const collab = collaborators.find((c) => c.userId === userId)
        if (!collab) continue
        const el = resolveFieldPath(fieldId, roots)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue

        const selection = selections.get(fieldId)
        const hasSelection = !!(selection && selection.userId === userId && selection.text)
        let selLeft: number | null = null
        let selWidth: number | null = null
        if (
          hasSelection &&
          el instanceof HTMLInputElement &&
          typeof selection!.start === 'number' &&
          typeof selection!.end === 'number'
        ) {
          const measured = measureSelection(el, selection!.start, selection!.end)
          if (measured && measured.left < rect.width) {
            selLeft = Math.max(0, measured.left)
            selWidth = Math.min(measured.width, rect.width - selLeft - 2)
          }
        }
        next.push({
          fieldId,
          color: collab.color,
          name: getDisplayName(collab),
          selection: hasSelection ? selection!.text : null,
          selLeft,
          selWidth,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
      }

      setBoxes((prev) => (boxesEqual(prev, next) ? prev : next))
    }

    compute()
    const interval = setInterval(compute, 120)
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [focusedFields, selections, collaborators, editorRef, panelRef])

  if (!mounted || boxes.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden">
      {boxes.map((box) => (
        <div
          key={box.fieldId}
          className="absolute transition-all duration-150 ease-out"
          style={{
            top: box.top - 2,
            left: box.left - 2,
            width: box.width + 4,
            height: box.height + 4,
            borderRadius: 6,
            boxShadow: `0 0 0 2px ${box.color}, 0 0 12px 0 ${box.color}33`,
            backgroundColor: box.selection && box.selLeft === null ? `${box.color}2b` : undefined,
          }}
        >
          {box.selection && box.selLeft !== null && (
            <span
              className="absolute rounded-[3px]"
              style={{
                left: box.selLeft + 2,
                width: box.selWidth ?? 0,
                top: 3,
                bottom: 3,
                backgroundColor: `${box.color}45`,
              }}
            />
          )}
          <span
            className="absolute -top-5 left-0 rounded-t-md rounded-br-md px-1.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow-sm select-none"
            style={{ backgroundColor: box.color }}
          >
            {box.name}
          </span>
          {box.selection && (
            <span
              className="absolute top-full left-0 mt-1 block max-w-[280px] truncate rounded-md rounded-tl-none px-1.5 py-0.5 text-[10px] font-medium italic text-white shadow-sm select-none"
              style={{ backgroundColor: box.color }}
            >
              « {box.selection} »
            </span>
          )}
        </div>
      ))}
    </div>,
    document.body
  )
}
