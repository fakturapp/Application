'use client'

import { useEffect } from 'react'
import { accountUrl, ACCOUNT_URL } from '@/lib/account-redirect'

export default function OauthAuthorizePage() {
  useEffect(() => {
    if (!ACCOUNT_URL) return
    window.location.replace(
      accountUrl('/oauth/authorize') + window.location.search + window.location.hash
    )
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Redirection...</p>
      </div>
    </div>
  )
}
