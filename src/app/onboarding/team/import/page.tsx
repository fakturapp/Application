'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileArchive, Lock, Upload } from '@/components/ui/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface ImportTeamResponse {
  team: { id: string; name: string }
  recoveryKey?: string
}

export default function OnboardingTeamImportPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [importFile, setImportFile] = useState<File | null>(null)
  const [importName, setImportName] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.currentTeamId) {
      const hasKey =
        sessionStorage.getItem(`faktur_recovery_key_${user.currentTeamId}`) ??
        sessionStorage.getItem('zenvoice_recovery_key')
      router.replace(hasKey ? '/onboarding/recovery-key' : '/onboarding/company')
    }
  }, [user, router])

  const handleFileSelect = useCallback(
    (file: File) => {
      setImportFile(file)
      setIsEncrypted(file.name.endsWith('.fpdata'))

      const baseName = file.name.replace(/\.(zip|fpdata)$/, '').replace(/-export$/, '')
      if (baseName && !importName) {
        setImportName(baseName)
      }
    },
    [importName]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.zip') || file.name.endsWith('.fpdata'))) {
      handleFileSelect(file)
      return
    }

    setError('Format non supporté. Utilisez un fichier .zip ou .fpdata')
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importFile) return

    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('teamName', importName)
    if (isEncrypted && importPassword) {
      formData.append('decryptionPassword', importPassword)
    }

    const { data, error: requestError } = await api.upload<ImportTeamResponse>(
      '/team/import',
      formData
    )
    setLoading(false)

    if (requestError) {
      setError(requestError)
      return
    }

    if (data?.recoveryKey && data.team) {
      sessionStorage.setItem(`faktur_recovery_key_${data.team.id}`, data.recoveryKey)
    }

    await refreshUser()
    toast(`Équipe "${data?.team.name}" importée`, 'success')
    router.push(data?.recoveryKey ? '/onboarding/recovery-key' : '/onboarding/company')
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} custom={0}>
        <Link
          href="/onboarding/team"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la création d&apos;équipe
        </Link>
      </motion.div>

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleImport}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={1} className="text-center">
                <h1 className="text-2xl font-bold">Importer une équipe</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Importez une sauvegarde existante puis continuez la configuration avec cette
                  équipe.
                </p>
              </motion.div>

              {error && (
                <motion.div variants={fadeUp} custom={2}>
                  <FieldError className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center">
                    {error}
                  </FieldError>
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={3}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.fpdata"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : importFile
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-primary/40'
                  }`}
                >
                  {importFile ? (
                    <>
                      <FileArchive className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(importFile.size / 1024).toFixed(1)} Ko
                          {isEncrypted && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                              <Lock className="h-3 w-3" />
                              Chiffré
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Glissez-déposez un fichier ici
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          ou cliquez pour sélectionner (.zip ou .fpdata)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {isEncrypted && (
                <motion.div variants={fadeUp} custom={4}>
                  <Field>
                    <FieldLabel htmlFor="importPassword">Mot de passe de déchiffrement</FieldLabel>
                    <Input
                      id="importPassword"
                      name="archive-password"
                      type="password"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      placeholder="Mot de passe utilisé lors de l'export"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Ce fichier est chiffré. Entrez le mot de passe défini lors de l&apos;export.
                    </FieldDescription>
                  </Field>
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={5}>
                <Separator />
              </motion.div>

              <motion.div variants={fadeUp} custom={6}>
                <Field>
                  <FieldLabel htmlFor="importName">Nom de l&apos;équipe</FieldLabel>
                  <Input
                    id="importName"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    placeholder="Nom de l'équipe importée"
                    required
                    minLength={2}
                  />
                  <FieldDescription>
                    Vous pouvez modifier le nom de l&apos;équipe importée avant la fin de
                    l&apos;import.
                  </FieldDescription>
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={7}>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    loading || !importFile || importName.length < 2 || (isEncrypted && !importPassword)
                  }
                >
                  {loading ? (
                    <>
                      <Spinner /> Importation en cours…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Importer l&apos;équipe
                    </>
                  )}
                </Button>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
