'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { applyUiTheme, bootCachedAccent, parseUiTheme } from '@/lib/ui-theme'

export function UiThemeSync() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const appliedRef = useRef<string | null>(null)
  const bootedRef = useRef(false)

  useEffect(() => {
    if (!bootedRef.current) {
      bootedRef.current = true
      bootCachedAccent()
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const raw = (user as { uiTheme?: string | null }).uiTheme ?? null
    if (!raw || appliedRef.current === raw) return
    appliedRef.current = raw
    applyUiTheme(parseUiTheme(raw), setTheme)
  }, [user, setTheme])

  return null
}
