const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function isEditableElement(el: unknown): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (EDITABLE_TAGS.has(el.tagName)) return true
  return el.isContentEditable
}

export function getFieldPath(el: HTMLElement, root: HTMLElement): string | null {
  const segments: string[] = []
  let node: HTMLElement | null = el
  while (node && node !== root) {
    const parent: HTMLElement | null = node.parentElement
    if (!parent) return null
    const index = Array.prototype.indexOf.call(parent.children, node)
    segments.unshift(`${node.tagName.toLowerCase()}:${index}`)
    node = parent
  }
  if (node !== root) return null
  return segments.join('/')
}

export function resolveFieldPath(path: string, root: HTMLElement): HTMLElement | null {
  let node: Element = root
  for (const segment of path.split('/')) {
    const [tag, indexStr] = segment.split(':')
    const index = Number(indexStr)
    if (!Number.isInteger(index) || index < 0) return null
    const child = node.children[index]
    if (!child || child.tagName.toLowerCase() !== tag) return null
    node = child
  }
  return node instanceof HTMLElement ? node : null
}
