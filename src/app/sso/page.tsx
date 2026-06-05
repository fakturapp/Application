'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function safeNext(next: string | null): string {
  if (!next) return '/dashboard'
  try {
    if (next.startsWith('/') && !next.startsWith('//')) {
      return next === '/' ? '/dashboard' : next
    }
    const url = new URL(next)
    if (url.origin === window.location.origin) {
      const path = url.pathname + url.search + url.hash
      return path === '/' ? '/dashboard' : path
    }
  } catch {}
  return '/dashboard'
}

function SsoContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    let cancelled = false
    const next = safeNext(searchParams.get('next'))
    api.get('/auth/me').finally(() => {
      if (!cancelled) window.location.replace(next)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function SsoPage() {
  return (
    <Suspense>
      <SsoContent />
    </Suspense>
  )
}
