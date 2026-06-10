'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { A4Sheet, type CompanyInfo, type ClientInfo, type DocumentLine } from '@/components/shared/a4-sheet'
import {
  CollaborationProvider,
} from '@/components/collaboration/collaboration-provider'
import {
  CollaborationToolbar,
  CollaborationEditor,
} from '@/components/collaboration/collaboration-toolbar'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Eye, ShieldAlert, LogIn } from '@/components/ui/icons'
import { accountLoginUrl } from '@/lib/account-redirect'

type DocumentType = 'invoice' | 'quote' | 'credit_note'

const TYPE_TITLE: Record<DocumentType, string> = {
  invoice: 'Facture',
  quote: 'Devis',
  credit_note: 'Avoir',
}

const noop = () => {}

export default function GuestLivePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const editorAreaRef = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)

  const [docType, setDocType] = useState<DocumentType>('invoice')
  const [docId, setDocId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [tpl, setTpl] = useState({ template: 'classique', documentFont: 'Lexend', darkMode: false })

  const [documentNumber, setDocumentNumber] = useState('')
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [lines, setLines] = useState<DocumentLine[]>([])
  const [options, setOptions] = useState({
    billingType: 'quick' as 'quick' | 'detailed',
    subject: '',
    issueDate: '',
    validityDate: '',
    deliveryAddress: '',
    clientSiren: '',
    clientVatNumber: '',
    language: 'fr',
    acceptanceConditions: '',
    signatureField: false,
    documentTitle: '',
    freeField: '',
    globalDiscountType: 'none' as 'none' | 'percentage' | 'fixed',
    globalDiscountValue: 0,
    showNotes: true,
    vatExemptReason: 'not_subject' as 'none' | 'not_subject' | 'france_no_vat' | 'outside_france',
    footerText: '',
    showSubject: false,
    showDeliveryAddress: false,
    showAcceptanceConditions: false,
    showFreeField: false,
    showFooterText: false,
    showQuantityColumn: true,
    showUnitColumn: true,
    showUnitPriceColumn: true,
    showVatColumn: true,
    footerMode: 'company_info' as 'company_info' | 'custom',
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error, errorCode } = await api.get<{
        documentType: DocumentType
        documentId: string
        teamName: string | null
        settings: { template: string; documentFont: string; darkMode: boolean }
        document: any
      }>(`/share/guest/${token}`)

      if (cancelled) return
      if (error || !data?.document) {
        setNeedsLogin(errorCode === 'login_required' || errorCode === 'private_team_document')
        setErrorMessage(error || 'Ce lien est invalide ou a été désactivé')
        setStatus('error')
        return
      }

      const doc = data.document
      setDocType(data.documentType)
      setDocId(data.documentId)
      setTeamName(data.teamName ?? '')
      if (data.settings) setTpl(data.settings)

      setDocumentNumber(doc.invoiceNumber ?? doc.quoteNumber ?? doc.creditNoteNumber ?? '')
      setAccentColor(doc.accentColor || '#6366f1')
      setLogoUrl(doc.logoUrl ?? null)
      setNotes(doc.notes || '')
      setPaymentMethod(doc.paymentMethod || '')

      setOptions((prev) => ({
        ...prev,
        billingType: doc.billingType || 'quick',
        subject: doc.subject || '',
        issueDate: doc.issueDate || '',
        validityDate: doc.validityDate || doc.dueDate || '',
        deliveryAddress: doc.deliveryAddress || '',
        clientSiren: doc.clientSiren || '',
        clientVatNumber: doc.clientVatNumber || '',
        language: doc.language || 'fr',
        acceptanceConditions: doc.acceptanceConditions || '',
        signatureField: doc.signatureField || false,
        documentTitle: doc.documentTitle || TYPE_TITLE[data.documentType],
        freeField: doc.freeField || '',
        globalDiscountType: doc.globalDiscountType || 'none',
        globalDiscountValue: Number(doc.globalDiscountValue) || 0,
        showNotes: doc.showNotes !== false,
        vatExemptReason: doc.vatExemptReason || 'not_subject',
        footerText: doc.footerText || '',
        showSubject: !!doc.subject,
        showDeliveryAddress: !!doc.deliveryAddress,
        showAcceptanceConditions: !!doc.acceptanceConditions,
        showFreeField: !!doc.freeField,
        showFooterText: !!doc.footerText,
        showQuantityColumn: doc.showQuantityColumn !== false,
        showUnitColumn: doc.showUnitColumn !== false,
        showUnitPriceColumn: doc.showUnitPriceColumn !== false,
        showVatColumn: doc.showVatColumn !== false,
      }))

      if (doc.clientSnapshot) {
        try {
          setSelectedClient(JSON.parse(doc.clientSnapshot))
        } catch {
          if (doc.client) setSelectedClient(doc.client)
        }
      } else if (doc.client) {
        setSelectedClient(doc.client)
      }

      let loadedCompany: CompanyInfo | null = null
      if (doc.companySnapshot) {
        try {
          loadedCompany = JSON.parse(doc.companySnapshot)
        } catch {}
      }
      setCompany(loadedCompany)

      if (doc.lines && doc.lines.length > 0) {
        setLines(
          doc.lines.map((l: any) => ({
            id: l.id,
            type: l.saleType === 'section' ? ('section' as const) : ('standard' as const),
            description: l.description || '',
            saleType: l.saleType === 'section' ? '' : l.saleType || '',
            quantity: Number(l.quantity) || 1,
            unit: l.unit || '',
            unitPrice: Number(l.unitPrice) || 0,
            vatRate: Number(l.vatRate) || 0,
          }))
        )
      }

      setStatus('ready')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const { subtotal, taxAmount, discountAmount, total, tvaBreakdown } = useMemo(() => {
    let sub = 0
    let tax = 0
    const tvaMap: Record<number, { base: number; amount: number }> = {}

    for (const line of lines) {
      if (line.type === 'section') continue
      const lt = options.billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice
      const lTax = options.billingType === 'detailed' ? lt * (line.vatRate / 100) : 0
      sub += lt
      tax += lTax
      if (options.billingType === 'detailed') {
        if (!tvaMap[line.vatRate]) tvaMap[line.vatRate] = { base: 0, amount: 0 }
        tvaMap[line.vatRate].base += lt
        tvaMap[line.vatRate].amount += lTax
      }
    }

    let disc = 0
    if (options.globalDiscountType === 'percentage' && options.globalDiscountValue > 0) {
      disc = sub * (options.globalDiscountValue / 100)
    } else if (options.globalDiscountType === 'fixed' && options.globalDiscountValue > 0) {
      disc = options.globalDiscountValue
    }

    return {
      subtotal: Math.round(sub * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
      discountAmount: Math.round(disc * 100) / 100,
      total: Math.round((sub + tax - disc) * 100) / 100,
      tvaBreakdown: Object.entries(tvaMap).map(([rate, d]) => ({
        rate: Number(rate),
        base: Math.round(d.base * 100) / 100,
        amount: Math.round(d.amount * 100) / 100,
      })),
    }
  }, [lines, options.billingType, options.globalDiscountType, options.globalDiscountValue])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Ouverture du document...</p>
        </motion.div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm mx-auto px-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-5">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Accès impossible</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{errorMessage}</p>
          {needsLogin && (
            <Button
              onClick={() => {
                window.location.href = accountLoginUrl(`${window.location.origin}/share/${token}`)
              }}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" /> Se connecter
            </Button>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <CollaborationProvider
      documentType={docType}
      documentId={docId}
      enabled={!!docId}
      guestToken={token}
      onDocumentChange={(change) => {
        if (change.path === 'notes') setNotes(change.value)
        else if (change.path === 'accentColor') setAccentColor(change.value)
        else if (change.path === 'logoUrl') setLogoUrl(change.value)
        else if (change.path === 'lines') setLines(change.value)
        else if (change.path === 'invoiceNumber') setDocumentNumber(change.value)
        else if (change.path === 'client') setSelectedClient(change.value)
        else if (change.path === 'paymentMethod') setPaymentMethod(change.value)
        else if (change.path.startsWith('options.')) {
          const key = change.path.replace('options.', '')
          setOptions((prev) => ({ ...prev, [key]: change.value }))
        }
      }}
      onAccessRevoked={() => {
        setErrorMessage('Votre accès à ce document a été révoqué')
        setNeedsLogin(false)
        setStatus('error')
      }}
      onKicked={() => {
        setErrorMessage('Vous avez été expulsé du document')
        setNeedsLogin(false)
        setStatus('error')
      }}
    >
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {TYPE_TITLE[docType]} {documentNumber}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {teamName ? `Équipe ${teamName} : ` : ''}vous consultez ce document en tant
                qu&apos;invité
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Eye className="h-3 w-3" />
                Lecture seule
              </span>
              <CollaborationToolbar
                documentType={docType}
                documentId={docId}
                canShare={false}
                className="flex items-center gap-2"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/share/${token}`)}
                className="gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                Se connecter
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <CollaborationEditor editorRef={editorAreaRef}>
            <A4Sheet
              mode="edit"
              paginate
              logoUrl={logoUrl}
              accentColor={accentColor}
              documentTitle={options.documentTitle}
              documentType={docType}
              quoteNumber={documentNumber}
              issueDate={options.issueDate}
              validityDate={options.validityDate}
              billingType={options.billingType}
              company={company}
              client={selectedClient}
              onQuoteNumberChange={noop}
              onCompanyFieldChange={noop}
              onClientClick={noop}
              onClearClient={noop}
              onClientFieldChange={noop}
              lines={lines}
              onUpdateLine={noop}
              onAddLine={noop}
              onReorderLine={noop}
              onCatalogClick={noop}
              onRemoveLine={noop}
              subtotal={subtotal}
              taxAmount={taxAmount}
              discountAmount={discountAmount}
              total={total}
              tvaBreakdown={tvaBreakdown}
              notes={notes}
              onNotesChange={noop}
              acceptanceConditions={options.acceptanceConditions}
              signatureField={options.signatureField}
              freeField={options.freeField}
              deliveryAddress={options.deliveryAddress}
              showDeliveryAddress={options.showDeliveryAddress}
              clientSiren={options.clientSiren}
              showClientSiren={!!options.clientSiren}
              clientVatNumber={options.clientVatNumber}
              showClientVatNumber={!!options.clientVatNumber}
              paymentMethod={paymentMethod}
              paymentMethods={[]}
              customPaymentMethod=""
              subject={options.subject}
              onSubjectChange={noop}
              template={tpl.template}
              darkMode={tpl.darkMode}
              language={options.language}
              showNotes={options.showNotes}
              vatExemptReason={options.vatExemptReason}
              footerText={options.footerText}
              documentFont={tpl.documentFont}
              showSubject={options.showSubject}
              showAcceptanceConditions={options.showAcceptanceConditions}
              showFreeField={options.showFreeField}
              showFooterText={options.showFooterText}
              showQuantityColumn={options.showQuantityColumn}
              showUnitColumn={options.showUnitColumn}
              showUnitPriceColumn={options.showUnitPriceColumn}
              showVatColumn={options.showVatColumn}
              footerMode={options.footerMode}
              onAcceptanceConditionsChange={noop}
              onFreeFieldChange={noop}
              onFooterTextChange={noop}
              onDeliveryAddressChange={noop}
              onIssueDateChange={noop}
              onValidityDateChange={noop}
            />
          </CollaborationEditor>
        </main>
      </div>
    </CollaborationProvider>
  )
}
