'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { accountLoginUrl, ACCOUNT_URL } from '@/lib/account-redirect'
import { Spinner } from '@/components/ui/spinner'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace('/dashboard')
    } else if (ACCOUNT_URL) {
      window.location.href = accountLoginUrl(window.location.origin)
    } else {
      router.replace('/login')
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" className="text-primary" />
    </div>
  )
}
