'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Download, FileText, Calendar, Info, Check } from '@/components/ui/icons'
import { SettingsPage, SettingsHero, SettingsSection } from '@/components/settings/settings-shell'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

export default function AccountingExportPage() {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState(`${CURRENT_YEAR}-01-01`)
  const [endDate, setEndDate] = useState(`${CURRENT_YEAR}-12-31`)
  const [downloading, setDownloading] = useState(false)

  const activeYear = startDate === `${CURRENT_YEAR}-01-01` && endDate === `${CURRENT_YEAR}-12-31`
    ? CURRENT_YEAR
    : startDate === `${CURRENT_YEAR - 1}-01-01` && endDate === `${CURRENT_YEAR - 1}-12-31`
      ? CURRENT_YEAR - 1
      : startDate === `${CURRENT_YEAR - 2}-01-01` && endDate === `${CURRENT_YEAR - 2}-12-31`
        ? CURRENT_YEAR - 2
        : null

  function selectYear(year: number) {
    setStartDate(`${year}-01-01`)
    setEndDate(`${year}-12-31`)
  }

  async function handleExport() {
    if (!startDate || !endDate) {
      toast('Sélectionnez une période', 'error')
      return
    }
    if (startDate > endDate) {
      toast('La date de début doit précéder la date de fin', 'error')
      return
    }
    setDownloading(true)
    const { blob, filename, error } = await api.downloadBlob(
      `/export/fec?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    )
    setDownloading(false)
    if (error || !blob) {
      toast(error || "Erreur lors de l'export", 'error')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `export-fec-${startDate}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Export généré', 'success')
  }

  return (
    <SettingsPage>
      <SettingsHero
        icon={<Download className="h-6 w-6" />}
        title="Exportation comptable"
        tagline="Exportez vos écritures au format FEC."
        description="Le Fichier des Écritures Comptables, à transmettre à votre comptable ou à l’administration fiscale."
      />

      <div className="mt-6">
        <SettingsSection index={1} title="Période" desc="L’intervalle de dates des écritures à exporter.">
          <div className="mt-3 flex flex-wrap gap-2">
            {YEARS.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => selectYear(year)}
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3.5 py-2 text-sm font-medium transition-all ${
                  activeYear === year ? 'border-accent bg-accent-soft/50 text-accent' : 'border-border text-foreground hover:border-muted-foreground/30'
                }`}
              >
                {activeYear === year && <Check className="h-3.5 w-3.5" />}
                {year}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Du</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Au</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection index={2} title="Format FEC">
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft/40 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Le FEC (norme DGFiP) regroupe vos factures émises et vos dépenses sur la période, en écritures comptables
              (journaux des ventes et des achats). Les montants chiffrés sont déchiffrés à la volée : votre coffre doit
              être déverrouillé.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fichier FEC</p>
                <p className="text-xs text-muted-foreground">Format .txt tabulé, encodage UTF-8</p>
              </div>
            </div>
            <Button onClick={handleExport} disabled={downloading} className="shrink-0">
              {downloading ? (
                <><Spinner /> Génération…</>
              ) : (
                <><Download className="mr-1.5 h-4 w-4" /> Télécharger</>
              )}
            </Button>
          </div>
        </SettingsSection>
      </div>
    </SettingsPage>
  )
}
