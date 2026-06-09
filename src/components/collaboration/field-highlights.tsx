'use client'

import { useEffect, useState } from 'react'
import type { CollaboratorInfo, FieldSelection } from '@/hooks/use-collaboration'
import { resolveFieldPath } from '@/components/collaboration/field-path'

interface FieldHighlightsProps {
  focusedFields: Map<string, string>
  selections?: Map<string, FieldSelection>
  collaborators: CollaboratorInfo[]
  containerRef: React.RefObject<HTMLElement | null>
  sheetRef: React.RefObject<HTMLElement | null>
}

interface HighlightBox {
  fieldId: string
  color: string
  name: string
  selection: string | null
  top: number
  left: number
  width: number
  height: number
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
  containerRef,
  sheetRef,
}: FieldHighlightsProps) {
  const [boxes, setBoxes] = useState<HighlightBox[]>([])

  useEffect(() => {
    const compute = () => {
      const container = containerRef.current
      const sheet = sheetRef.current
      if (!container || !sheet || (focusedFields.size === 0 && selections.size === 0)) {
        setBoxes((prev) => (prev.length === 0 ? prev : []))
        return
      }

      const containerRect = container.getBoundingClientRect()
      const next: HighlightBox[] = []
      const fieldIds = new Set([...focusedFields.keys(), ...selections.keys()])

      for (const fieldId of fieldIds) {
        const userId = focusedFields.get(fieldId) ?? selections.get(fieldId)?.userId
        if (!userId) continue
        const collab = collaborators.find((c) => c.userId === userId)
        if (!collab) continue
        const el = resolveFieldPath(fieldId, sheet)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue

        const selection = selections.get(fieldId)
        next.push({
          fieldId,
          color: collab.color,
          name: getDisplayName(collab),
          selection:
            selection && selection.userId === userId && selection.text ? selection.text : null,
          top: rect.top - containerRect.top,
          left: rect.left - containerRect.left,
          width: rect.width,
          height: rect.height,
        })
      }

      setBoxes((prev) => (boxesEqual(prev, next) ? prev : next))
    }

    compute()
    const interval = setInterval(compute, 150)
    window.addEventListener('resize', compute)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', compute)
    }
  }, [focusedFields, selections, collaborators, containerRef, sheetRef])

  if (boxes.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
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
          }}
        >
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
    </div>
  )
}
