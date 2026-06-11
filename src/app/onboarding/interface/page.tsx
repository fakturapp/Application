'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingInterfaceRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/onboarding/plan')
  }, [router])
  return null
}
