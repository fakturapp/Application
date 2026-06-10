const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export interface CollabRoots {
  editor: HTMLElement | null
  content: HTMLElement | null
  panel: HTMLElement | null
  pages: HTMLElement[]
}

export function isEditableElement(el: unknown): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (EDITABLE_TAGS.has(el.tagName)) return true
  return el.isContentEditable
}

export function getCollabRoots(
  editorEl: HTMLElement | null,
  panelEl: HTMLElement | null
): CollabRoots {
  return {
    editor: editorEl,
    content: editorEl?.querySelector<HTMLElement>('[data-collab-root]') ?? null,
    panel: panelEl,
    pages: editorEl
      ? Array.from(editorEl.querySelectorAll<HTMLElement>('[data-collab-page]'))
      : [],
  }
}

function segmentsBetween(el: Element, ancestor: Element): string[] | null {
  const segments: string[] = []
  let node: Element | null = el
  while (node && node !== ancestor) {
    const parent: Element | null = node.parentElement
    if (!parent) return null
    const index = Array.prototype.indexOf.call(parent.children, node)
    segments.unshift(`${node.tagName.toLowerCase()}:${index}`)
    node = parent
  }
  return node === ancestor ? segments : null
}

function walkSegments(root: Element, segments: string[]): Element | null {
  let node: Element = root
  for (const segment of segments) {
    if (!segment) continue
    const [tag, indexStr] = segment.split(':')
    const index = Number(indexStr)
    if (!Number.isInteger(index) || index < 0) return null
    const child = node.children[index]
    if (!child || child.tagName.toLowerCase() !== tag) return null
    node = child
  }
  return node
}

export function getFieldPath(el: Element, roots: CollabRoots): string | null {
  const anchorEl = el.closest('[data-collab-id], [data-a4-block]')
  if (anchorEl) {
    const inContent = roots.content?.contains(anchorEl)
    const inPanel = roots.panel?.contains(anchorEl)
    if (inContent || inPanel) {
      const collabId = anchorEl.getAttribute('data-collab-id')
      const blockKey = anchorEl.getAttribute('data-a4-block')
      const prefix = collabId ? `@${collabId}` : blockKey ? `#${blockKey}` : null
      const sub = segmentsBetween(el, anchorEl)
      if (prefix && sub !== null) {
        return sub.length > 0 ? `${prefix}/${sub.join('/')}` : prefix
      }
    }
  }

  if (roots.content?.contains(el)) {
    const segments = segmentsBetween(el, roots.content)
    if (segments !== null) return `c:${segments.join('/')}`
  }

  if (roots.panel?.contains(el)) {
    const segments = segmentsBetween(el, roots.panel)
    if (segments !== null) return `p:${segments.join('/')}`
  }

  return null
}

export function resolveFieldPath(fieldId: string, roots: CollabRoots): Element | null {
  if (fieldId.startsWith('@') || fieldId.startsWith('#')) {
    const attr = fieldId.startsWith('@') ? 'data-collab-id' : 'data-a4-block'
    const slash = fieldId.indexOf('/')
    const id = slash === -1 ? fieldId.slice(1) : fieldId.slice(1, slash)
    const rest = slash === -1 ? [] : fieldId.slice(slash + 1).split('/')
    const selector = `[${attr}="${CSS.escape(id)}"]`
    const anchorEl =
      roots.content?.querySelector(selector) ?? roots.panel?.querySelector(selector) ?? null
    if (!anchorEl) return null
    return walkSegments(anchorEl, rest)
  }

  if (fieldId.startsWith('c:')) {
    if (!roots.content) return null
    const rest = fieldId.slice(2)
    return walkSegments(roots.content, rest ? rest.split('/') : [])
  }

  if (fieldId.startsWith('p:')) {
    if (!roots.panel) return null
    const rest = fieldId.slice(2)
    return walkSegments(roots.panel, rest ? rest.split('/') : [])
  }

  if (fieldId.startsWith('pg:')) {
    const index = Number(fieldId.slice(3))
    if (!Number.isInteger(index) || index < 0) return null
    return roots.pages[index] ?? null
  }

  if (fieldId === 'ed:') {
    return roots.editor
  }

  return null
}

function rectContains(rect: DOMRect, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function deepestElementAt(root: Element, x: number, y: number): Element {
  let node: Element = root
  let descended = true
  while (descended) {
    descended = false
    const children = node.children
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]
      const rect = child.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      if (rectContains(rect, x, y)) {
        node = child
        descended = true
        break
      }
    }
  }
  return node
}

export interface CursorAnchor {
  anchor: string
  x: number
  y: number
}

function offsetsIn(el: Element, x: number, y: number): { x: number; y: number } | null {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  return { x: (x - rect.left) / rect.width, y: (y - rect.top) / rect.height }
}

const MAX_ANCHOR_LENGTH = 280

function anchorWithin(
  root: Element,
  roots: CollabRoots,
  x: number,
  y: number
): CursorAnchor | null {
  let node: Element | null = deepestElementAt(root, x, y)
  while (node) {
    const anchor = node === root && root === roots.panel ? 'p:' : getFieldPath(node, roots)
    if (anchor && anchor.length <= MAX_ANCHOR_LENGTH) {
      const offsets = offsetsIn(node, x, y)
      if (offsets) return { anchor, ...offsets }
    }
    if (node === root) return null
    node = node.parentElement
  }
  return null
}

export function getCursorAnchor(roots: CollabRoots, x: number, y: number): CursorAnchor | null {
  if (roots.panel) {
    const rect = roots.panel.getBoundingClientRect()
    if (rect.width > 0 && rectContains(rect, x, y)) {
      const anchor = anchorWithin(roots.panel, roots, x, y)
      if (anchor) return anchor
    }
  }

  if (roots.content) {
    const rect = roots.content.getBoundingClientRect()
    if (rect.width > 0 && rectContains(rect, x, y)) {
      const el = deepestElementAt(roots.content, x, y)
      if (el !== roots.content) {
        const anchor = anchorWithin(roots.content, roots, x, y)
        if (anchor) return anchor
      }
    }
  }

  for (let i = 0; i < roots.pages.length; i++) {
    const rect = roots.pages[i].getBoundingClientRect()
    if (rect.width > 0 && rectContains(rect, x, y)) {
      const offsets = offsetsIn(roots.pages[i], x, y)
      if (offsets) return { anchor: `pg:${i}`, ...offsets }
    }
  }

  if (roots.editor) {
    const rect = roots.editor.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      const ox = (x - rect.left) / rect.width
      const oy = (y - rect.top) / rect.height
      if (ox >= -1 && ox <= 2 && oy >= -1 && oy <= 2) {
        return { anchor: 'ed:', x: ox, y: oy }
      }
    }
  }

  return null
}
