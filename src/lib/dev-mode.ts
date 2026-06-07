'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'faktur_dev_mode'
const EVENT_NAME = 'faktur:dev-mode-change'
const COOKIE_NAME = 'faktur_dev_mode'
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.fakturapp.cc'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readDevCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const cookie of cookies) {
    const eq = cookie.indexOf('=')
    if (eq === -1) continue
    if (cookie.slice(0, eq) === COOKIE_NAME) {
      return decodeURIComponent(cookie.slice(eq + 1))
    }
  }
  return null
}

function writeDevCookie(enabled: boolean): void {
  if (typeof document === 'undefined') return
  if (enabled) {
    document.cookie = `${COOKIE_NAME}=1; domain=${COOKIE_DOMAIN}; path=/; max-age=${COOKIE_MAX_AGE}; secure; samesite=lax`
  } else {
    document.cookie = `${COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; path=/; max-age=0; secure; samesite=lax`
  }
}

export function isDevModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return readDevCookie() === '1' || localStorage.getItem(STORAGE_KEY) === '1'
}

export function setDevMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) localStorage.setItem(STORAGE_KEY, '1')
  else localStorage.removeItem(STORAGE_KEY)
  writeDevCookie(enabled)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }))
}

export function useDevMode(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    setEnabled(isDevModeEnabled())
    function onChange(e: Event) {
      setEnabled(!!(e as CustomEvent<boolean>).detail)
    }
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setEnabled(e.newValue === '1')
    }
    window.addEventListener(EVENT_NAME, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT_NAME, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return [enabled, setDevMode]
}

export interface CapturedApiError {
  url: string
  method: string
  status: number
  body: unknown
  ts: number
}

declare global {
  interface Window {
    __fakturLastApiError?: CapturedApiError
  }
}

export function captureApiError(err: CapturedApiError): void {
  if (typeof window === 'undefined') return
  window.__fakturLastApiError = err
}

export function getLastApiError(): CapturedApiError | undefined {
  if (typeof window === 'undefined') return undefined
  return window.__fakturLastApiError
}
