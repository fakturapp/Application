'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormSelect } from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Link2, Copy, Check, X, UserPlus, Users,
  ChevronRight, ArrowLeft, Trash2,
} from '@/components/ui/icons'
import { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent } from '@/components/ui/checkbox'

type DocumentType = 'invoice' | 'quote' | 'credit_note'
type Permission = 'viewer' | 'editor'

interface ShareEntry {
  id: string
  permission: Permission
  status: 'active' | 'pending'
  sharedWithEmail: string | null
  sharedWith: {
    id: string
    fullName: string | null
    email: string
    avatarUrl: string | null
  } | null
  sharedBy: { id: string; fullName: string | null }
  createdAt: string
}

type Visibility = 'team' | 'anyone'

interface ShareLinkEntry {
  id: string
  token: string
  permission: Permission
  visibility: Visibility
  autoExpire: boolean
  allowAnonymous?: boolean
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

interface ShareModalProps {
  open: boolean
  onClose: () => void
  documentType: DocumentType
  documentId: string
}

const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : ''

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

const permissionLabels: Record<Permission, string> = {
  viewer: 'Lecture seule',
  editor: 'Peut modifier',
}

const permissionOptions = [
  { value: 'viewer', label: 'Lecture seule' },
  { value: 'editor', label: 'Peut modifier' },
]

const visibilityOptions = [
  { value: 'anyone', label: 'Tout le monde' },
  { value: 'team', label: 'Équipe uniquement' },
]

const viewMotion = {
  main: {
    initial: { opacity: 0, x: -32 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -32 },
  },
  settings: {
    initial: { opacity: 0, x: 32 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 32 },
  },
}

const viewTransition = {
  duration: 0.22,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

export function ShareModal({ open, onClose, documentType, documentId }: ShareModalProps) {
  const { toast } = useToast()

  const [view, setView] = useState<'main' | 'settings'>('main')
  const [shares, setShares] = useState<ShareEntry[]>([])
  const [links, setLinks] = useState<ShareLinkEntry[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<Permission>('viewer')
  const [linkPermission, setLinkPermission] = useState<Permission>('viewer')
  const [linkVisibility, setLinkVisibility] = useState<Visibility>('anyone')
  const [linkAutoExpire, setLinkAutoExpire] = useState(true)
  const [linkAllowAnonymous, setLinkAllowAnonymous] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    if (!documentId) return
    setLoading(true)

    const [sharesRes, linksRes] = await Promise.all([
      api.get<{ data: ShareEntry[] }>(`/collaboration/shares/${documentType}/${documentId}`),
      api.get<{ data: ShareLinkEntry[] }>(`/collaboration/share-links/${documentType}/${documentId}`),
    ])

    if (sharesRes.data) setShares(sharesRes.data.data)
    if (linksRes.data) setLinks(linksRes.data.data)
    setLoading(false)
  }, [documentId, documentType])

  useEffect(() => {
    if (open) {
      fetchData()
      setView('main')
    }
  }, [open, fetchData])

  const activeLink = links[0]

  const createShareLink = async (): Promise<boolean> => {
    const { data, error } = await api.post<{ data: ShareLinkEntry }>('/collaboration/share-links', {
      documentType,
      documentId,
      permission: linkPermission,
      visibility: linkAllowAnonymous ? 'anyone' : linkVisibility,
      autoExpire: linkAutoExpire,
      allowAnonymous: linkAllowAnonymous,
    })
    if (error) {
      toast(error, 'error')
      return false
    }
    if (data) {
      setLinks((prev) => [data.data, ...prev])
      toast('Lien de partage créé', 'success')
      return true
    }
    return false
  }

  const copyLink = async (token: string) => {
    const url = `${FRONTEND_URL}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast('Lien copié dans le presse-papiers', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const deleteShareLink = async (linkId: string) => {
    await api.delete(`/collaboration/share-links/${linkId}`)
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
    toast('Lien désactivé', 'success')
  }

  const inviteByEmail = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)

    const { data, error } = await api.post<{ data: ShareEntry }>('/collaboration/shares', {
      documentType,
      documentId,
      email: inviteEmail.trim(),
      permission: invitePermission,
    })

    if (error) {
      toast(error, 'error')
    } else if (data) {
      setShares((prev) => [data.data, ...prev])
      setInviteEmail('')
      toast('Invitation envoyée', 'success')
    }
    setInviting(false)
  }

  const updatePermission = async (shareId: string, permission: Permission) => {
    const { error } = await api.patch(`/collaboration/shares/${shareId}`, { permission })
    if (error) {
      toast(error, 'error')
      return
    }
    setShares((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, permission } : s))
    )
  }

  const revokeAccess = async (shareId: string) => {
    const { error } = await api.delete(`/collaboration/shares/${shareId}`)
    if (error) {
      toast(error, 'error')
      return
    }
    setShares((prev) => prev.filter((s) => s.id !== shareId))
    toast('Accès révoqué', 'success')
  }

  const changeLinkPermission = async (value: string) => {
    const perm = value as Permission
    if (!activeLink) {
      setLinkPermission(perm)
      return
    }
    await api.patch(`/collaboration/share-links/${activeLink.id}`, { permission: perm })
    setLinks((prev) =>
      prev.map((l) => (l.id === activeLink.id ? { ...l, permission: perm } : l))
    )
  }

  const changeLinkVisibility = async (value: string) => {
    const vis = value as Visibility
    if (!activeLink) {
      setLinkVisibility(vis)
      return
    }
    await api.patch(`/collaboration/share-links/${activeLink.id}`, { visibility: vis })
    setLinks((prev) =>
      prev.map((l) => (l.id === activeLink.id ? { ...l, visibility: vis } : l))
    )
    toast(vis === 'anyone' ? 'Lien accessible à tous' : 'Lien restreint à l\'équipe', 'success')
  }

  const changeLinkAnonymous = async (checked: boolean) => {
    if (!activeLink) {
      setLinkAllowAnonymous(checked)
      return
    }
    await api.patch(`/collaboration/share-links/${activeLink.id}`, {
      allowAnonymous: checked,
      ...(checked ? { visibility: 'anyone' } : {}),
    })
    setLinks((prev) =>
      prev.map((l) =>
        l.id === activeLink.id
          ? { ...l, allowAnonymous: checked, visibility: checked ? 'anyone' : l.visibility }
          : l
      )
    )
  }

  const generateLink = async () => {
    setCreating(true)
    const ok = await createShareLink()
    setCreating(false)
    if (ok) setView('main')
  }

  const disableLink = async () => {
    if (!activeLink) return
    await deleteShareLink(activeLink.id)
    setView('main')
  }

  const settingsPermission = activeLink ? activeLink.permission : linkPermission
  const settingsAnonymous = activeLink ? !!activeLink.allowAnonymous : linkAllowAnonymous
  const settingsVisibility = settingsAnonymous
    ? 'anyone'
    : activeLink ? activeLink.visibility : linkVisibility
  const settingsAutoExpire = activeLink ? activeLink.autoExpire : linkAutoExpire

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <div className="overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'main' ? (
            <motion.div key="main" {...viewMotion.main} transition={viewTransition}>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Partager ce document
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <SectionLabel>Inviter par email</SectionLabel>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && inviteByEmail()}
                      className="flex-1"
                    />
                    <FormSelect
                      value={invitePermission}
                      onChange={(v) => setInvitePermission(v as Permission)}
                      className="w-[140px] shrink-0"
                      showCheck={false}
                      options={permissionOptions}
                    />
                    <Button
                      onClick={inviteByEmail}
                      disabled={!inviteEmail.trim() || inviting}
                      size="icon"
                      title="Inviter"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <SectionLabel>Lien de partage</SectionLabel>
                  {activeLink ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Link2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {FRONTEND_URL}/share/{activeLink.token}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{permissionLabels[activeLink.permission]}</span>
                          <span>·</span>
                          <span>{activeLink.visibility === 'anyone' ? 'Tout le monde' : 'Équipe'}</span>
                          {activeLink.allowAnonymous && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                              Accès invité
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyLink(activeLink.token)}
                        title="Copier le lien"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setView('settings')}
                        title="Paramètres du lien"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button fullWidth onClick={() => setView('settings')} className="gap-2">
                      <Link2 className="h-4 w-4" />
                      Créer un lien de partage
                    </Button>
                  )}
                </div>

                <div>
                  <SectionLabel>Personnes ayant accès</SectionLabel>
                  {shares.length > 0 ? (
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      <AnimatePresence>
                        {shares.map((share) => {
                          const name = share.sharedWith?.fullName ?? share.sharedWithEmail ?? '?'
                          const email = share.sharedWith?.email ?? share.sharedWithEmail ?? ''
                          return (
                            <motion.div
                              key={share.id}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/30"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {getInitials(share.sharedWith?.fullName ?? null, email)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                                {share.sharedWith?.fullName && (
                                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                                )}
                              </div>
                              {share.status === 'pending' && (
                                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                                  En attente
                                </span>
                              )}
                              <FormSelect
                                value={share.permission}
                                onChange={(v) => updatePermission(share.id, v as Permission)}
                                className="h-7 w-[120px] shrink-0 text-xs"
                                showCheck={false}
                                options={permissionOptions}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                                onClick={() => revokeAccess(share.id)}
                                title="Révoquer l'accès"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    !loading && (
                      <div className="rounded-xl border border-dashed border-border py-5 text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted/50">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Aucun collaborateur pour le moment</p>
                        <p className="mt-0.5 text-xs text-muted-foreground/60">
                          Invitez quelqu&apos;un par email ou créez un lien
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="settings" {...viewMotion.settings} transition={viewTransition}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView('main')}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    aria-label="Retour"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <DialogTitle>Paramètres du lien</DialogTitle>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Autorisation</label>
                  <FormSelect
                    value={settingsPermission}
                    onChange={changeLinkPermission}
                    className="w-full"
                    showCheck={false}
                    options={permissionOptions}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Visibilité</label>
                  <FormSelect
                    value={settingsVisibility}
                    onChange={changeLinkVisibility}
                    disabled={settingsAnonymous}
                    className="w-full"
                    showCheck={false}
                    options={visibilityOptions}
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border p-3">
                  <CheckboxRoot
                    isSelected={settingsAutoExpire}
                    onChange={setLinkAutoExpire}
                    isDisabled={!!activeLink}
                    className="flex items-start gap-2.5"
                  >
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                    <CheckboxContent>
                      <p className="text-sm text-foreground">Désactiver le lien quand je quitte la page</p>
                    </CheckboxContent>
                  </CheckboxRoot>

                  <CheckboxRoot
                    isSelected={settingsAnonymous}
                    onChange={changeLinkAnonymous}
                    className="flex items-start gap-2.5"
                  >
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                    <CheckboxContent>
                      <p className="text-sm text-foreground">Accès sans compte</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Accessible sans compte Faktur, en lecture seule, affiché comme Invité
                      </p>
                    </CheckboxContent>
                  </CheckboxRoot>
                </div>

                {activeLink ? (
                  <Button variant="danger-soft" fullWidth onClick={disableLink} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Désactiver le lien
                  </Button>
                ) : (
                  <Button fullWidth onClick={generateLink} disabled={creating} className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Générer le lien
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  )
}
