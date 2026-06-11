'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useOnboardingNav } from '@/lib/onboarding-nav'
import {
  Receipt,
  Zap,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Hash,
  Banknote,
  Coins,
  PenLine,
  FileText,
  Check,
} from '@/components/ui/icons'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

type NumberFormat = 'simple' | 'year' | 'year-month'

const NUMBER_FORMATS: { value: NumberFormat; label: string }[] = [
  { value: 'simple', label: 'Préfixe et numéro' },
  { value: 'year', label: 'Préfixe, année et numéro' },
  { value: 'year-month', label: 'Préfixe, année, mois et numéro' },
]

function buildPattern(prefix: string, format: NumberFormat): string {
  if (format === 'year') return `${prefix}{annee}-{numero}`
  if (format === 'year-month') return `${prefix}{annee}{mois}-{numero}`
  return `${prefix}{numero}`
}

function previewPattern(prefix: string, format: NumberFormat): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return buildPattern(prefix, format)
    .replace('{annee}', String(year))
    .replace('{mois}', month)
    .replace('{numero}', '001')
}

function parsePattern(
  pattern: string | null | undefined,
  fallbackPrefix: string
): { prefix: string; format: NumberFormat } {
  if (!pattern) return { prefix: fallbackPrefix, format: 'simple' }
  let m = pattern.match(/^(.*)\{ann[eé]e\}\{mois\}-\{num[eé]ro\}$/i)
  if (m) return { prefix: m[1], format: 'year-month' }
  m = pattern.match(/^(.*)\{ann[eé]e\}-\{num[eé]ro\}$/i)
  if (m) return { prefix: m[1], format: 'year' }
  m = pattern.match(/^(.*)\{num[eé]ro\}$/i)
  if (m) return { prefix: m[1], format: 'simple' }
  return { prefix: fallbackPrefix, format: 'simple' }
}

const VAT_OPTIONS = [
  { value: 'subject', label: 'TVA applicable (régime réel)' },
  { value: 'exempt', label: 'Franchise en base de TVA (art. 293B du CGI)' },
]

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
]

const PAYMENT_METHODS = [
  {
    id: 'bank_transfer',
    label: 'Virement bancaire',
    description: 'Vos coordonnées bancaires sur la facture',
    icon: Banknote,
  },
  { id: 'cash', label: 'Espèces', description: 'Paiement en espèces accepté', icon: Coins },
  { id: 'custom', label: 'Autre', description: 'Chèque, PayPal, etc.', icon: PenLine },
]

interface LoadedSettings {
  billingType: 'quick' | 'detailed'
  accentColor: string
  paymentMethods: string[]
  customPaymentMethod: string | null
  defaultVatExempt: boolean
  defaultLanguage: string
  invoiceNumberPattern: string
  quoteNumberPattern: string
}

export default function OnboardingBillingPage() {
  const nav = useOnboardingNav()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [accentColor, setAccentColor] = useState('#6366f1')
  const [billingType, setBillingType] = useState<'quick' | 'detailed'>('quick')
  const [vat, setVat] = useState<'subject' | 'exempt'>('exempt')
  const [language, setLanguage] = useState('fr')
  const [invoicePrefix, setInvoicePrefix] = useState('FAC-')
  const [quotePrefix, setQuotePrefix] = useState('DEV-')
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('year')
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['bank_transfer'])
  const [customPaymentMethod, setCustomPaymentMethod] = useState('')
  const [paymentConditions, setPaymentConditions] = useState('Paiement à 30 jours')
  const [hasCompany, setHasCompany] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [settingsRes, companyRes] = await Promise.all([
        api.get<{ settings: LoadedSettings }>('/settings/invoices'),
        api.get<{ company: { paymentConditions: string | null } }>('/company'),
      ])
      if (cancelled) return

      const settings = settingsRes.data?.settings
      if (settings) {
        setBillingType(settings.billingType === 'detailed' ? 'detailed' : 'quick')
        setAccentColor(settings.accentColor || '#6366f1')
        setVat(settings.defaultVatExempt ? 'exempt' : 'subject')
        setLanguage(settings.defaultLanguage || 'fr')
        if (settings.paymentMethods?.length) setPaymentMethods(settings.paymentMethods)
        setCustomPaymentMethod(settings.customPaymentMethod || '')
        const invoice = parsePattern(settings.invoiceNumberPattern, 'FAC-')
        const quote = parsePattern(settings.quoteNumberPattern, 'DEV-')
        setInvoicePrefix(invoice.prefix || 'FAC-')
        setQuotePrefix(quote.prefix || 'DEV-')
        setNumberFormat(invoice.format)
      }

      if (companyRes.data?.company) {
        setHasCompany(true)
        if (companyRes.data.company.paymentConditions) {
          setPaymentConditions(companyRes.data.company.paymentConditions)
        }
      }

      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function togglePaymentMethod(id: string) {
    setPaymentMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    setError('')
    setSaving(true)

    const { error: settingsError } = await api.put('/settings/invoices', {
      billingType,
      accentColor,
      paymentMethods,
      customPaymentMethod: customPaymentMethod.trim() || undefined,
      defaultVatExempt: vat === 'exempt',
      defaultLanguage: language,
      invoiceNumberPattern: buildPattern(invoicePrefix, numberFormat),
      quoteNumberPattern: buildPattern(quotePrefix, numberFormat),
      invoiceFilenamePattern: buildPattern(invoicePrefix, numberFormat),
      quoteFilenamePattern: buildPattern(quotePrefix, numberFormat),
    })

    if (settingsError) {
      setSaving(false)
      setError(settingsError)
      return
    }

    if (hasCompany && paymentConditions.trim()) {
      await api.put('/company', { paymentConditions: paymentConditions.trim() })
    }

    nav('/onboarding/interface')
  }

  if (loading) {
    return (
      <Card className="overflow-hidden border-border/50">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="h-6 w-56 rounded" />
            <Skeleton className="h-3 w-72 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-6 flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
              <Receipt className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Votre facturation</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Définissez vos préférences par défaut. Tout reste modifiable dans les paramètres.
              </p>
            </div>
          </motion.div>

          {error && (
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={fadeUp} custom={1} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Mode de facturation</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setBillingType('quick')}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                  billingType === 'quick'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <Zap
                  className={`h-6 w-6 ${billingType === 'quick' ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Rapide</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Un montant, un client, c&apos;est facturé
                  </p>
                </div>
              </button>
              <button
                onClick={() => setBillingType('detailed')}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                  billingType === 'detailed'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <ClipboardList
                  className={`h-6 w-6 ${billingType === 'detailed' ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Détaillé</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lignes, quantités et TVA par article
                  </p>
                </div>
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Régime de TVA</FieldLabel>
              <FormSelect
                value={vat}
                onChange={(v) => setVat(v === 'exempt' ? 'exempt' : 'subject')}
                options={VAT_OPTIONS}
              />
            </Field>
            <Field>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Langue des documents
                </span>
              </FieldLabel>
              <FormSelect value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
            </Field>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Numérotation
              </span>
            </h2>
            <div className="space-y-4 rounded-xl border border-border p-4">
              <Field>
                <FieldLabel>Format des numéros</FieldLabel>
                <FormSelect
                  value={numberFormat}
                  onChange={(v) => setNumberFormat(v as NumberFormat)}
                  options={NUMBER_FORMATS}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="invoicePrefix">Préfixe factures</FieldLabel>
                  <Input
                    id="invoicePrefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="FAC-"
                  />
                  <FieldDescription>
                    Aperçu :{' '}
                    <span className="font-mono text-foreground/80">
                      {previewPattern(invoicePrefix, numberFormat)}
                    </span>
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="quotePrefix">Préfixe devis</FieldLabel>
                  <Input
                    id="quotePrefix"
                    value={quotePrefix}
                    onChange={(e) => setQuotePrefix(e.target.value)}
                    placeholder="DEV-"
                  />
                  <FieldDescription>
                    Aperçu :{' '}
                    <span className="font-mono text-foreground/80">
                      {previewPattern(quotePrefix, numberFormat)}
                    </span>
                  </FieldDescription>
                </Field>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Moyens de paiement acceptés
            </h2>
            <div className="space-y-2.5">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethods.includes(method.id)
                const Icon = method.icon
                return (
                  <div key={method.id}>
                    <button
                      onClick={() => togglePaymentMethod(method.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-accent-soft' : 'bg-muted'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{method.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {method.description}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-accent-foreground" />}
                      </span>
                    </button>
                    {method.id === 'custom' && isSelected && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-12 pt-2"
                        >
                          <Input
                            placeholder="Ex : Chèque, PayPal…"
                            value={customPaymentMethod}
                            onChange={(e) => setCustomPaymentMethod(e.target.value)}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="mb-6">
            <Field>
              <FieldLabel htmlFor="paymentConditions">Conditions de paiement</FieldLabel>
              <Input
                id="paymentConditions"
                value={paymentConditions}
                onChange={(e) => setPaymentConditions(e.target.value)}
                placeholder="Paiement à 30 jours"
                disabled={!hasCompany}
              />
              <FieldDescription>
                {hasCompany
                  ? 'Ce texte apparaîtra en pied de page de vos factures.'
                  : 'Disponible après la création de votre entreprise dans les paramètres.'}
              </FieldDescription>
            </Field>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => nav('/onboarding/company')}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => nav('/onboarding/interface')}
              disabled={saving}
            >
              Passer cette étape
            </Button>
            <Button className="flex-1 gap-1.5" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Spinner /> Enregistrement…
                </>
              ) : (
                <>
                  Continuer <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={7} className="mt-4">
            <p className="text-center text-xs text-muted-foreground">
              Vous pourrez modifier ces paramètres à tout moment dans les réglages.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
