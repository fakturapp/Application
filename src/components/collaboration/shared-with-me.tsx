'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Users, Eye, Pencil, Lock, ChevronRight } from '@/components/ui/icons'

type DocumentType = 'invoice' | 'quote' | 'credit_note'

interface SharedDocument {
  documentType: DocumentType
  documentId: string
  permission: 'viewer' | 'editor'
  number: string
  teamName: string | null
  sharedBy: string | null
  locked: boolean
  updatedAt: string | null
}

const ROUTE_MAP: Record<DocumentType, string> = {
  invoice: 'invoices',
  quote: 'quotes',
  credit_note: 'credit-notes',
}

const TYPE_LABEL: Record<DocumentType, string> = {
  invoice: 'Facture',
  quote: 'Devis',
  credit_note: 'Avoir',
}

interface SharedWithMeSectionProps {
  documentType: DocumentType
}

export function SharedWithMeSection({ documentType }: SharedWithMeSectionProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<SharedDocument[]>([])

  useEffect(() => {
    let cancelled = false
    api.get<{ data: SharedDocument[] }>('/collaboration/shared-with-me').then(({ data }) => {
      if (cancelled || !data?.data) return
      setDocuments(data.data.filter((d) => d.documentType === documentType))
    })
    return () => {
      cancelled = true
    }
  }, [documentType])

  if (documents.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <Users className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Partagés avec moi</span>
        <span className="text-xs text-muted-foreground">({documents.length})</span>
      </div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <button
            key={`${doc.documentType}-${doc.documentId}`}
            type="button"
            disabled={doc.locked}
            onClick={() =>
              router.push(`/dashboard/${ROUTE_MAP[doc.documentType]}/${doc.documentId}/edit`)
            }
            className="app-surface group flex w-full items-center gap-4 rounded-lg bg-overlay shadow-surface p-4 text-left transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">
                  {TYPE_LABEL[doc.documentType]} {doc.number}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {doc.permission === 'editor' ? (
                    <Pencil className="h-2.5 w-2.5" />
                  ) : (
                    <Eye className="h-2.5 w-2.5" />
                  )}
                  {doc.permission === 'editor' ? 'Peut modifier' : 'Lecture seule'}
                </span>
                {doc.locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                    <Lock className="h-2.5 w-2.5" />
                    Équipe en mode Privé
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {doc.teamName ? `Équipe ${doc.teamName}` : 'Document externe'}
                {doc.sharedBy ? ` : partagé par ${doc.sharedBy}` : ''}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}
