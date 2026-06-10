'use client'

import { useBroadcast, useBroadcastObject } from '@/components/collaboration/use-broadcast'

interface SyncBroadcasterProps {
  notes: string
  accentColor: string
  lines: any[]
  options: Record<string, any>
  documentNumber: string
  selectedClient: any
  logoUrl?: string | null
  paymentMethod?: string
  bankAccountId?: string
}

export function SyncBroadcaster({
  notes,
  accentColor,
  lines,
  options,
  documentNumber,
  selectedClient,
  logoUrl,
  paymentMethod,
  bankAccountId,
}: SyncBroadcasterProps) {
  useBroadcast('notes', notes)
  useBroadcast('accentColor', accentColor)
  useBroadcast('lines', lines)
  useBroadcast('invoiceNumber', documentNumber)
  useBroadcast('client', selectedClient)
  useBroadcast('logoUrl', logoUrl)
  useBroadcast('paymentMethod', paymentMethod)
  useBroadcast('bankAccountId', bankAccountId)
  useBroadcastObject('options', options)

  return null
}
