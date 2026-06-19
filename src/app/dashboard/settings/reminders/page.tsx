'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { SaveBar } from '@/components/ui/save-bar'
import { useToast } from '@/components/ui/toast'
import { useEmail } from '@/lib/email-context'
import { useAuth } from '@/lib/auth'
import { ProGate } from '@/components/billing/pro-gate'
import { api } from '@/lib/api'
import { Bell, Info } from '@/components/ui/icons'
import { SettingsPage, SettingsHero, SettingsSection, SettingsRow } from '@/components/settings/settings-shell'

interface ReminderSettings {
  enabled: boolean
  daysBeforeDue: number | null
  daysAfterDue: number | null
  repeatIntervalDays: number | null
  emailSubjectTemplate: string | null
  emailBodyTemplate: string | null
  autoSend: boolean
  emailAccountId: string | null
}

function ReminderTimeline({
  before,
  after,
  repeat,
}: {
  before: string
  after: string
  repeat: string
}) {
  const reduce = useReducedMotion()
  const steps = [
    before ? { label: `J−${before}`, sub: 'Rappel préventif', tone: 'muted' as const } : null,
    { label: 'Échéance', sub: 'Date limite', tone: 'accent' as const },
    after ? { label: `J+${after}`, sub: '1ʳᵉ relance', tone: 'solid' as const } : null,
    repeat ? { label: `tous les ${repeat}j`, sub: 'Répétition', tone: 'muted' as const } : null,
  ].filter(Boolean) as { label: string; sub: string; tone: 'muted' | 'accent' | 'solid' }[]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background:radial-gradient(120%_120%_at_50%_-10%,var(--color-accent-soft),transparent_60%)]" />
      <div className="relative">
        <div className="absolute left-4 right-4 top-3 h-px bg-border" />
        <div className="relative flex justify-between">
          {steps.map((s, i) => (
            <motion.div
              key={s.label + i}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <span
                className={`mb-2 h-3 w-3 rounded-full ring-4 ring-surface ${
                  s.tone === 'accent' ? 'bg-accent' : s.tone === 'solid' ? 'bg-foreground' : 'bg-muted-foreground/40'
                }`}
              />
              <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
              <span className="text-[10px] text-muted-foreground">{s.sub}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ReminderSettingsPage() {
  const { toast } = useToast()
  const { accounts, loading: accountsLoading } = useEmail()
  const { user } = useAuth()
  const locked = !(user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState('')

  const [enabled, setEnabled] = useState(false)
  const [daysBeforeDue, setDaysBeforeDue] = useState('')
  const [daysAfterDue, setDaysAfterDue] = useState('7')
  const [repeatIntervalDays, setRepeatIntervalDays] = useState('')
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState('Rappel : Facture {numero} en attente de paiement')
  const [emailBodyTemplate, setEmailBodyTemplate] = useState(
    "Bonjour,\n\nNous vous rappelons que la facture {numero} d'un montant de {montant} est arrivée à échéance le {date_echeance}.\n\nMerci de bien vouloir procéder au règlement.\n\nCordialement"
  )
  const [autoSend, setAutoSend] = useState(false)
  const [emailAccountId, setEmailAccountId] = useState('')

  const formState = {
    enabled,
    daysBeforeDue,
    daysAfterDue,
    repeatIntervalDays,
    emailSubjectTemplate,
    emailBodyTemplate,
    autoSend,
    emailAccountId,
  }
  const hasChanges = JSON.stringify(formState) !== saved

  useEffect(() => {
    async function load() {
      const { data } = await api.get<{ reminderSettings: ReminderSettings }>('/reminders/settings')
      const s = data?.reminderSettings
      if (s) {
        const loaded = {
          enabled: s.enabled,
          daysBeforeDue: s.daysBeforeDue ? String(s.daysBeforeDue) : '',
          daysAfterDue: s.daysAfterDue ? String(s.daysAfterDue) : '',
          repeatIntervalDays: s.repeatIntervalDays ? String(s.repeatIntervalDays) : '',
          emailSubjectTemplate: s.emailSubjectTemplate || '',
          emailBodyTemplate: s.emailBodyTemplate || '',
          autoSend: s.autoSend,
          emailAccountId: s.emailAccountId || '',
        }
        setEnabled(loaded.enabled)
        setDaysBeforeDue(loaded.daysBeforeDue)
        setDaysAfterDue(loaded.daysAfterDue)
        setRepeatIntervalDays(loaded.repeatIntervalDays)
        setEmailSubjectTemplate(loaded.emailSubjectTemplate)
        setEmailBodyTemplate(loaded.emailBodyTemplate)
        setAutoSend(loaded.autoSend)
        setEmailAccountId(loaded.emailAccountId)
        setSaved(JSON.stringify(loaded))
      } else {
        setSaved(JSON.stringify(formState))
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const { error } = await api.put('/reminders/settings', {
      enabled,
      daysBeforeDue: daysBeforeDue ? parseInt(daysBeforeDue) : null,
      daysAfterDue: daysAfterDue ? parseInt(daysAfterDue) : null,
      repeatIntervalDays: repeatIntervalDays ? parseInt(repeatIntervalDays) : null,
      emailSubjectTemplate: emailSubjectTemplate.trim() || null,
      emailBodyTemplate: emailBodyTemplate.trim() || null,
      autoSend,
      emailAccountId: emailAccountId || null,
    })
    setSaving(false)
    if (error) {
      setSaveError(error)
      toast(error, 'error')
      return
    }
    setSaved(JSON.stringify(formState))
    toast('Paramètres de relance mis à jour', 'success')
  }

  function handleReset() {
    try {
      const s = JSON.parse(saved)
      setEnabled(s.enabled)
      setDaysBeforeDue(s.daysBeforeDue)
      setDaysAfterDue(s.daysAfterDue)
      setRepeatIntervalDays(s.repeatIntervalDays)
      setEmailSubjectTemplate(s.emailSubjectTemplate)
      setEmailBodyTemplate(s.emailBodyTemplate)
      setAutoSend(s.autoSend)
      setEmailAccountId(s.emailAccountId)
      setSaveError(null)
    } catch {}
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="mt-6 space-y-7">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <SettingsPage>
      <SettingsHero
        icon={<Bell className="h-6 w-6" />}
        title="Relances automatiques"
        tagline="Les rappels de paiement de vos factures en retard."
        description="Définissez le calendrier et le message — Faktur s’occupe de l’envoi."
      />

      <div className="mt-6">
        <ProGate locked={locked} description="Passez à Pro pour activer les relances automatiques.">
          <SettingsSection index={1}>
            <SettingsRow
              icon={<Bell className="h-4 w-4" />}
              title="Activer les relances"
              desc="Disponibles pour les factures envoyées et en retard."
              control={<Switch checked={enabled} onChange={setEnabled} />}
            />
          </SettingsSection>
        </ProGate>

        {enabled && (
          <>
            <SettingsSection index={2}>
              <ReminderTimeline before={daysBeforeDue} after={daysAfterDue} repeat={repeatIntervalDays} />
            </SettingsSection>

            <SettingsSection index={3} title="Calendrier des relances" desc="Quand les rappels sont envoyés.">
              <FieldGroup className="mt-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="daysBefore">Jours avant échéance</FieldLabel>
                    <Input id="daysBefore" type="number" min="1" max="90" value={daysBeforeDue} onChange={(e) => setDaysBeforeDue(e.target.value)} placeholder="Ex : 3" />
                    <FieldDescription>Rappel préventif</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="daysAfter">Jours après échéance</FieldLabel>
                    <Input id="daysAfter" type="number" min="1" max="90" value={daysAfterDue} onChange={(e) => setDaysAfterDue(e.target.value)} placeholder="Ex : 7" />
                    <FieldDescription>Première relance</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="repeatInterval">Répéter tous les (jours)</FieldLabel>
                    <Input id="repeatInterval" type="number" min="1" max="90" value={repeatIntervalDays} onChange={(e) => setRepeatIntervalDays(e.target.value)} placeholder="Ex : 7" />
                    <FieldDescription>Après la 1ʳᵉ relance</FieldDescription>
                  </Field>
                </div>
              </FieldGroup>
            </SettingsSection>

            <SettingsSection index={4} title="Compte email" desc="Le compte utilisé pour envoyer les relances.">
              <Field className="mt-3">
                <FormSelect
                  id="emailAccount"
                  value={emailAccountId}
                  onChange={setEmailAccountId}
                  placeholder="Sélectionner un compte"
                  options={[
                    { value: '', label: 'Sélectionner un compte' },
                    ...accounts.map((a) => ({ value: a.id, label: `${a.email} (${a.provider})` })),
                  ]}
                />
                {accounts.length === 0 && !accountsLoading && (
                  <p className="mt-1 text-xs text-amber-500">
                    Aucun compte email configuré. Ajoutez-en un dans Paramètres &gt; Email.
                  </p>
                )}
              </Field>
            </SettingsSection>

            <SettingsSection index={5} title="Modèle d’email" desc="Le contenu envoyé à vos clients.">
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/20 bg-accent-soft/40 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-xs text-muted-foreground">
                  Variables : <code className="text-accent">{'{numero}'}</code>, <code className="text-accent">{'{montant}'}</code>,{' '}
                  <code className="text-accent">{'{date_echeance}'}</code>, <code className="text-accent">{'{date_emission}'}</code>,{' '}
                  <code className="text-accent">{'{client}'}</code>
                </p>
              </div>
              <FieldGroup className="mt-4">
                <Field>
                  <FieldLabel htmlFor="subjectTemplate">Objet de l’email</FieldLabel>
                  <Input id="subjectTemplate" value={emailSubjectTemplate} onChange={(e) => setEmailSubjectTemplate(e.target.value)} placeholder="Rappel : Facture {numero}" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="bodyTemplate">Corps de l’email</FieldLabel>
                  <Textarea id="bodyTemplate" value={emailBodyTemplate} onChange={(e) => setEmailBodyTemplate(e.target.value)} rows={6} placeholder="Bonjour, …" />
                </Field>
              </FieldGroup>
            </SettingsSection>
          </>
        )}
      </div>

      <SaveBar
        hasChanges={hasChanges}
        saving={saving}
        error={saveError}
        onSave={() => void handleSave()}
        onReset={handleReset}
      />
    </SettingsPage>
  )
}
