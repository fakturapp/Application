'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

export default function OnboardingPersonalizationRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/onboarding/interface')
  }, [router])

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Spinner size="lg" className="text-accent" />
      <p className="text-sm text-muted-foreground">Redirection…</p>
    </div>
  )
}
