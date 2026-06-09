'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  FlaskConical,
  AlertTriangle,
  Zap,
  Eye,
  MousePointer2,
  Share2,
  Check,
  Info,
  Shield,
  Link2,
  Mail,
  Pencil,
} from '@/components/ui/icons'

const FEATURES = [
  {
    icon: MousePointer2,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    title: 'Curseurs en temps réel',
    desc: 'La souris de chaque collaborateur est visible sur le document, avec son nom et sa couleur.',
  },
  {
    icon: Pencil,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    title: 'Champs encadrés',
    desc: 'Le champ en cours de modification est encadré à la couleur de la personne qui le modifie.',
  },
  {
    icon: Zap,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    title: 'Synchronisation instantanée',
    desc: 'Chaque modification (lignes, notes, client, options) apparaît immédiatement chez tous les participants.',
  },
  {
    icon: Eye,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    title: 'Présence en direct',
    desc: 'Les avatars des personnes connectées sont affichés en haut du document.',
  },
  {
    icon: Mail,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    title: 'Invitation par email',
    desc: 'Invitez un collaborateur par email, même sans compte Faktur : il reçoit un lien direct vers le document.',
  },
  {
    icon: Link2,
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    title: 'Lien de partage',
    desc: 'Générez un lien avec permission lecture seule ou édition, restreint à votre équipe ou ouvert à tous.',
  },
]

const STEPS = [
  {
    title: 'Activez la collaboration',
    desc: 'Le bouton Partager apparaît dans vos factures, devis et avoirs.',
  },
  {
    title: 'Invitez vos collaborateurs',
    desc: 'Par email ou par lien de partage, avec la permission de votre choix (lecture ou édition).',
  },
  {
    title: 'Éditez ensemble',
    desc: 'Chacun voit les curseurs, les champs en cours de modification et les changements en direct, comme sur Canva.',
  },
  {
    title: 'Enregistrez',
    desc: 'Le propriétaire du document enregistre la version finale quand tout le monde a terminé.',
  },
]

export default function CollaborationSettingsPage() {
  const { settings, updateSettings, loading } = useInvoiceSettings()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const enabled = settings.collaborationEnabled

  const handleToggle = () => {
    if (!enabled) {
      setConfirmOpen(true)
    } else {
      updateSettings({ collaborationEnabled: false })
      toast('Collaboration désactivée', 'info')
    }
  }

  const handleConfirmEnable = () => {
    updateSettings({ collaborationEnabled: true })
    toast('Collaboration activée', 'success')
    setConfirmOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Collaboration</h1>
        <p className="text-sm text-muted-foreground">
          Éditez vos documents à plusieurs, en temps réel
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                <Users className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Collaboration en temps réel
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-500 uppercase tracking-wider">
                    <FlaskConical className="h-2.5 w-2.5" />
                    Bêta
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Édition multi-utilisateurs en direct</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 mb-4">
            <Users className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-purple-500">Le mode collaboration</p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Le mode collaboration transforme vos factures, devis et avoirs en documents
                partagés : plusieurs personnes peuvent les ouvrir et les modifier en même temps,
                chacune avec son curseur et sa couleur, comme sur Canva ou Figma. Vous voyez en
                direct qui est connecté, quel champ est en cours de modification et chaque
                changement apparaît instantanément chez tout le monde.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border-2 border-border p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10' : 'bg-muted'}`}
              >
                <Users
                  className={`h-5 w-5 ${enabled ? 'text-purple-400' : 'text-muted-foreground'}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Activer la collaboration</p>
                <p className="text-xs text-muted-foreground">
                  {enabled
                    ? 'Le partage et l’édition en temps réel sont actifs sur vos documents.'
                    : 'Active le partage et l’édition en temps réel sur vos documents.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                enabled ? 'bg-purple-500' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Share2 className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Comment ça marche</h2>
              <p className="text-xs text-muted-foreground">De l&apos;invitation à l&apos;enregistrement</p>
            </div>
          </div>

          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start gap-3 rounded-xl border border-border p-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-[11px] font-bold text-purple-500">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Check className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Fonctionnalités incluses</h2>
                    <p className="text-xs text-muted-foreground">Tout ce qui est actif sur vos documents</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {FEATURES.map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
                    <div key={title} className="rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-11">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
              <Shield className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Sécurité et limites</h2>
              <p className="text-xs text-muted-foreground">Ce qu&apos;il faut savoir avant de partager</p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-2.5 mb-4">
            {[
              'Seul le propriétaire du document peut enregistrer la version finale et gérer les accès.',
              'Les permissions (lecture seule ou édition) se changent à tout moment depuis la fenêtre Partager.',
              'Un accès peut être révoqué instantanément : la personne est déconnectée du document.',
              'Les liens de partage peuvent expirer automatiquement quand vous quittez la page.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-500">Fonctionnalité en bêta</p>
                <p className="text-[11px] text-foreground/70 mt-0.5 leading-relaxed">
                  Si deux personnes modifient le même champ au même moment, la dernière
                  modification est conservée. Les documents des équipes en mode Privé
                  (chiffrement de bout en bout) ne peuvent pas être partagés en dehors de
                  l&apos;équipe.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-md">
        <DialogHeader
          onClose={() => setConfirmOpen(false)}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        >
          <DialogTitle>Fonctionnalité en bêta</DialogTitle>
          <DialogDescription>Lisez attentivement avant d&apos;activer</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            La collaboration en temps réel est une fonctionnalité{' '}
            <span className="font-semibold text-amber-500">expérimentale</span>. Des bugs peuvent
            survenir.
          </p>

          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-amber-600 dark:text-amber-400 space-y-2">
            <p className="font-bold text-sm">Risques connus :</p>
            <ul className="list-disc list-inside space-y-1 leading-relaxed">
              <li>Des bugs d&apos;affichage ou de synchronisation peuvent survenir</li>
              <li>Des conflits sont possibles si deux personnes modifient le même champ</li>
              <li>La fluidité dépend de la qualité de la connexion de chacun</li>
              <li>Des pertes de modifications non enregistrées sont possibles en cas de déconnexion</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Vous pourrez désactiver cette fonctionnalité à tout moment depuis cette page. Aucune
            donnée ne sera perdue en désactivant.
          </p>
        </div>

        <DialogFooter className="mt-5">
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmEnable}
            className="bg-purple-500 hover:bg-purple-600 gap-2 text-white"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Activer la bêta
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
