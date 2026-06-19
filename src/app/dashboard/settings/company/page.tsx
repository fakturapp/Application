'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PhoneInput } from '@/components/ui/phone-input'
import { useCompanySettings, type Company } from '@/lib/company-settings-context'
import { api } from '@/lib/api'
import { SettingsPage, SettingsHero, SettingsSection, settingsFade } from '@/components/settings/settings-shell'
import {
  Building2, Plus, Pencil, AlertCircle, MapPin, Phone, Globe,
  ChevronLeft, ChevronRight as ChevronRightIcon, ImagePlus, Trash2,
} from '@/components/ui/icons'

const editSteps = [
  { id: 'identity', label: 'Identité', icon: Building2, tooltip: 'Raison sociale, SIREN, N° TVA, forme juridique' },
  { id: 'address', label: 'Adresse', icon: MapPin, tooltip: 'Adresse complète de votre entreprise' },
  { id: 'contact', label: 'Contact', icon: Phone, tooltip: 'Téléphone, email et site web' },
  { id: 'logo', label: 'Logo', icon: ImagePlus, tooltip: 'Logo affiché sur vos documents' },
]

interface LookupResult {
  siren: string
  siret: string | null
  legalName: string
  tradeName: string | null
  legalForm: string | null
  vatNumber: string | null
  addressLine1: string | null
  city: string | null
  postalCode: string | null
}

export default function CompanyInfoPage() {
  const { toast } = useToast()
  const { loading, noCompany, logoUrl, form, setCompany, setNoCompany, setForm, setLogoUrl } = useCompanySettings()

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [editForm, setEditForm] = useState({ ...form })
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null)
  const [stepErrors, setStepErrors] = useState<string[]>([])
  const editLogoRef = useRef<HTMLInputElement>(null)
  const [siretQuery, setSiretQuery] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupResults, setLookupResults] = useState<LookupResult[]>([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function openEditModal() {
    setEditForm({ ...form })
    setEditLogoUrl(logoUrl)
    setEditStep(0)
    setStepErrors([])
    setEditModalOpen(true)
  }

  function validateStep(step: number): string[] {
    const errors: string[] = []
    if (step === 0) {
      if (!editForm.legalName.trim()) errors.push('Raison sociale')
      if (!editForm.siren.trim()) errors.push('SIREN')
      if (!editForm.siret.trim()) errors.push('SIRET')
    }
    if (step === 1) {
      if (!editForm.addressLine1.trim()) errors.push('Adresse')
      if (!editForm.postalCode.trim()) errors.push('Code postal')
      if (!editForm.city.trim()) errors.push('Ville')
    }
    return errors
  }

  function handleEditNext() {
    const errors = validateStep(editStep)
    if (errors.length > 0) { setStepErrors(errors); return }
    setStepErrors([])
    if (editStep < editSteps.length - 1) setEditStep(editStep + 1)
  }

  function handleEditPrev() {
    setStepErrors([])
    if (editStep > 0) setEditStep(editStep - 1)
  }

  async function handleEditSave() {
    const errors = validateStep(editStep)
    if (errors.length > 0) { setStepErrors(errors); return }
    setStepErrors([])
    setSaving(true)
    if (noCompany) {
      const { data, error } = await api.post<{ company: Company }>('/onboarding/company', editForm)
      setSaving(false)
      if (error) return toast(error, 'error')
      setNoCompany(false)
      setCompany(data?.company || null)
      toast('Entreprise créée', 'success')
    } else {
      const { error } = await api.put('/company', editForm)
      setSaving(false)
      if (error) return toast(error, 'error')
      toast('Informations mises à jour', 'success')
    }
    setForm({ ...editForm })
    setLogoUrl(editLogoUrl)
    setEditModalOpen(false)
  }

  async function handleLookup() {
    const q = siretQuery.trim()
    if (q.length < 2) return
    setLookingUp(true)
    const { data, error } = await api.get<{ results: LookupResult[] }>(
      `/company/lookup?q=${encodeURIComponent(q)}`
    )
    setLookingUp(false)
    if (error) return toast(error, 'error')
    const results = data?.results ?? []
    if (results.length === 0) return toast('Aucune entreprise trouvée.', 'info')
    if (results.length === 1) return fillFromResult(results[0])
    setLookupResults(results)
  }

  function fillFromResult(c: LookupResult) {
    setEditForm((prev) => ({
      ...prev,
      legalName: c.legalName || prev.legalName,
      tradeName: c.tradeName || prev.tradeName,
      siren: c.siren || prev.siren,
      siret: c.siret || prev.siret,
      vatNumber: c.vatNumber || prev.vatNumber,
      legalForm: c.legalForm || prev.legalForm,
      addressLine1: c.addressLine1 || prev.addressLine1,
      postalCode: c.postalCode || prev.postalCode,
      city: c.city || prev.city,
    }))
    setLookupResults([])
    setStepErrors([])
    toast('Informations récupérées', 'success')
  }

  async function handleDeleteCompany() {
    setDeleting(true)
    const { error } = await api.delete('/company')
    setDeleting(false)
    if (error) return toast(error, 'error')
    setForm({
      ...form,
      legalName: '',
      tradeName: '',
      siren: '',
      siret: '',
      vatNumber: '',
      legalForm: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      city: '',
      phone: '',
      email: '',
      website: '',
    })
    setLogoUrl(null)
    setNoCompany(true)
    setConfirmDeleteOpen(false)
    toast('Informations supprimées', 'success')
  }

  function updateEditForm(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
    setStepErrors([])
  }

  async function handleEditLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('logo', file)
    const { data, error } = await api.upload<{ logoUrl: string }>('/company/logo', formData)
    setUploading(false)
    if (error) return toast(error, 'error')
    if (data?.logoUrl) { setEditLogoUrl(data.logoUrl); toast('Logo mis à jour', 'success') }
  }

  async function handleEditRemoveLogo() {
    const { error } = await api.put('/company', { logoUrl: null })
    if (error) return toast(error, 'error')
    setEditLogoUrl(null)
    toast('Logo supprimé', 'success')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start gap-4 pb-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mt-6 space-y-7">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const infoItems = [
    { label: 'SIREN', value: form.siren },
    { label: 'SIRET', value: form.siret },
    { label: 'N° TVA', value: form.vatNumber },
    { label: 'Forme juridique', value: form.legalForm },
  ]

  return (
    <SettingsPage>
      <SettingsHero
        icon={<Building2 className="h-6 w-6" />}
        title="Informations"
        tagline="L’identité de votre entreprise."
        description="Ces informations apparaissent sur vos factures et devis."
        action={
          !noCompany && (
            <Button variant="outline" size="sm" onClick={openEditModal}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Modifier
            </Button>
          )
        }
      />

      {noCompany ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-foreground">Aucune entreprise</p>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">Créez votre entreprise pour commencer à facturer.</p>
          <Button onClick={openEditModal}>
            <Plus className="mr-1.5 h-4 w-4" /> Créer mon entreprise
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <motion.div
            variants={settingsFade}
            custom={0}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.12)]"
          >
            <div className="relative px-6 pt-6 pb-5">
              <div className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(120%_140%_at_0%_-20%,var(--color-accent-soft),transparent_55%)]" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-card ring-1 ring-inset ring-border shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <Building2 className="h-7 w-7 text-accent" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-foreground">{form.legalName || 'Mon entreprise'}</h2>
                  {form.tradeName && <p className="text-sm text-muted-foreground">{form.tradeName}</p>}
                  {form.legalForm && <p className="text-xs text-muted-foreground">{form.legalForm}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-border px-6 py-5">
              <h3 className="text-[13px] font-bold text-foreground">Identité légale</h3>
              <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {infoItems.map((item) => (
                  <div key={item.label}>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</span>
                    <p className="mt-0.5 text-sm text-foreground">
                      {item.value || <span className="italic text-muted-foreground/60">Non renseigné</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border px-6 py-5">
              <h3 className="text-[13px] font-bold text-foreground">Adresse</h3>
              <div className="mt-3 flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-foreground">
                  {form.addressLine1 || form.city ? (
                    <>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ''}<br />{form.postalCode} {form.city}</>
                  ) : (
                    <span className="italic text-muted-foreground/60">Non renseignée</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-border px-6 py-5">
              <h3 className="text-[13px] font-bold text-foreground">Contact</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { icon: <Phone className="h-4 w-4" />, label: 'Téléphone', value: form.phone },
                  { icon: <Building2 className="h-4 w-4" />, label: 'Email', value: form.email },
                  { icon: <Globe className="h-4 w-4" />, label: 'Site web', value: form.website },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{c.icon}</div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</span>
                      <p className="mt-0.5 truncate text-sm text-foreground">{c.value || <span className="italic text-muted-foreground/60">—</span>}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteOpen(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer les informations
            </Button>
          </div>
        </div>
      )}

      {/* Multi-step edit modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-lg">
        <DialogHeader onClose={() => setEditModalOpen(false)}>
          <DialogTitle>Modifier les informations</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1 mt-4 mb-6">
          {editSteps.map((step, i) => (
            <div key={step.id} className="flex-1 group relative">
              <button
                onClick={() => {
                  const errors = validateStep(editStep)
                  if (i > editStep && errors.length > 0) { setStepErrors(errors); return }
                  setStepErrors([])
                  setEditStep(i)
                }}
                className={`w-full h-2 rounded-full transition-colors cursor-pointer ${
                  i <= editStep ? 'bg-primary' : 'bg-muted'
                } ${i < editStep ? 'bg-primary/80' : ''}`}
              />
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] shadow-lg">
                {step.label} — {step.tooltip}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {(() => { const StepIcon = editSteps[editStep].icon; return <StepIcon className="h-4 w-4 text-primary" /> })()}
          <span className="text-sm font-semibold text-foreground">{editSteps[editStep].label}</span>
          <span className="text-xs text-muted-foreground ml-auto">Étape {editStep + 1} sur {editSteps.length}</span>
        </div>

        <div className="space-y-4 min-h-[200px]">
          {editStep === 0 && (
            <FieldGroup>
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Remplir automatiquement</p>
                <div className="flex gap-2">
                  <Input
                    value={siretQuery}
                    onChange={(e) => setSiretQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleLookup()
                      }
                    }}
                    placeholder="Nom d'entreprise, SIREN ou SIRET"
                  />
                  <Button type="button" variant="outline" onClick={handleLookup} disabled={lookingUp}>
                    {lookingUp ? <Spinner className="h-4 w-4" /> : 'Rechercher'}
                  </Button>
                </div>
                {lookupResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border">
                    {lookupResults.map((r) => (
                      <button
                        key={`${r.siren}-${r.siret ?? ''}`}
                        type="button"
                        onClick={() => fillFromResult(r)}
                        className="w-full px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                      >
                        <p className="truncate text-xs font-medium text-foreground">{r.legalName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {r.siren}
                          {r.city ? ` · ${r.city}` : ''}
                          {r.postalCode ? ` (${r.postalCode})` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Recherche par nom, SIREN ou SIRET. Ou saisissez manuellement ci-dessous.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="editLegalName">Raison sociale *</FieldLabel>
                <Input id="editLegalName" value={editForm.legalName} onChange={(e) => updateEditForm('legalName', e.target.value)} className={stepErrors.includes('Raison sociale') ? 'border-red-500' : ''} />
              </Field>
              <Field>
                <FieldLabel htmlFor="editTradeName">Nom commercial</FieldLabel>
                <Input id="editTradeName" value={editForm.tradeName} onChange={(e) => updateEditForm('tradeName', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editSiren">SIREN *</FieldLabel>
                  <Input id="editSiren" value={editForm.siren} onChange={(e) => updateEditForm('siren', e.target.value)} maxLength={9} className={stepErrors.includes('SIREN') ? 'border-red-500' : ''} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editSiret">SIRET *</FieldLabel>
                  <Input id="editSiret" value={editForm.siret} onChange={(e) => updateEditForm('siret', e.target.value)} maxLength={14} className={stepErrors.includes('SIRET') ? 'border-red-500' : ''} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editVatNumber">N° TVA</FieldLabel>
                  <Input id="editVatNumber" value={editForm.vatNumber} onChange={(e) => updateEditForm('vatNumber', e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editLegalForm">Forme juridique</FieldLabel>
                  <Input id="editLegalForm" value={editForm.legalForm} onChange={(e) => updateEditForm('legalForm', e.target.value)} />
                </Field>
              </div>
            </FieldGroup>
          )}

          {editStep === 1 && (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="editAddress1">Adresse ligne 1 *</FieldLabel>
                <Input id="editAddress1" value={editForm.addressLine1} onChange={(e) => updateEditForm('addressLine1', e.target.value)} className={stepErrors.includes('Adresse') ? 'border-red-500' : ''} />
              </Field>
              <Field>
                <FieldLabel htmlFor="editAddress2">Adresse ligne 2</FieldLabel>
                <Input id="editAddress2" value={editForm.addressLine2} onChange={(e) => updateEditForm('addressLine2', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editPostalCode">Code postal *</FieldLabel>
                  <Input id="editPostalCode" value={editForm.postalCode} onChange={(e) => updateEditForm('postalCode', e.target.value)} className={stepErrors.includes('Code postal') ? 'border-red-500' : ''} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editCity">Ville *</FieldLabel>
                  <Input id="editCity" value={editForm.city} onChange={(e) => updateEditForm('city', e.target.value)} className={stepErrors.includes('Ville') ? 'border-red-500' : ''} />
                </Field>
              </div>
            </FieldGroup>
          )}

          {editStep === 2 && (
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editPhone">Téléphone</FieldLabel>
                  <PhoneInput id="editPhone" value={editForm.phone} onChange={(v) => updateEditForm('phone', v)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editEmail">Email</FieldLabel>
                  <Input id="editEmail" type="email" value={editForm.email} onChange={(e) => updateEditForm('email', e.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="editWebsite">Site web</FieldLabel>
                <Input id="editWebsite" value={editForm.website} onChange={(e) => updateEditForm('website', e.target.value)} />
              </Field>
            </FieldGroup>
          )}

          {editStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border bg-surface flex items-center justify-center overflow-hidden">
                    {editLogoUrl ? (
                      <img src={editLogoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-secondary" />
                    )}
                  </div>
                  {editLogoUrl && (
                    <button type="button" onClick={handleEditRemoveLogo}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">Ce logo apparaîtra sur vos factures, devis et documents. Format recommandé : PNG ou SVG, fond transparent.</p>
                  <input ref={editLogoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleEditLogoUpload} />
                  <Button type="button" variant="outline" size="sm" onClick={() => editLogoRef.current?.click()} disabled={uploading}>
                    {uploading ? <><Spinner className="text-foreground" /> Envoi...</> : 'Télécharger un logo'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {stepErrors.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-xs text-red-500">{stepErrors.join(', ')} obligatoire{stepErrors.length > 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={handleEditPrev} disabled={editStep === 0}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>Annuler</Button>
              {editStep < editSteps.length - 1 ? (
                <Button size="sm" onClick={handleEditNext}>
                  Suivant <ChevronRightIcon className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleEditSave} disabled={saving}>
                  {saving ? <><Spinner className="h-3.5 w-3.5" /> Enregistrement...</> : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} className="max-w-md">
        <DialogHeader onClose={() => setConfirmDeleteOpen(false)}>
          <DialogTitle>Supprimer les informations ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Toutes les informations de votre entreprise (identité, adresse, contact, logo) seront supprimées.
          Vous pourrez les recréer ou les remplir via SIREN/SIRET.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleDeleteCompany}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:opacity-90"
          >
            {deleting ? <><Spinner className="h-3.5 w-3.5" /> Suppression...</> : 'Supprimer'}
          </Button>
        </DialogFooter>
      </Dialog>
    </SettingsPage>
  )
}
