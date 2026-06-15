'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { ChartRevenue } from '@/components/dashboard/chart-revenue'
import { AddChartSidebar, type ChartKey } from '@/components/dashboard/add-chart-sidebar'
import { ChartMonthly } from '@/components/dashboard/chart-monthly'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  FileText,
  Receipt,
  Clock,
} from '@/components/ui/icons'
import { AiDashboardSummary } from '@/components/ai/ai-dashboard-summary'
import TextType from '@/components/ui/text-type'

function pickAdaptiveGreeting(firstName: string | undefined): string {
  const name = firstName ? `, ${firstName}` : ''
  const hour = new Date().getHours()
  let pool: string[]
  if (hour < 5) {
    pool = [
      `Bonne nuit${name}`,
      `Encore au travail${name} ?`,
      `Il est tard${name}`,
      `Petite session nocturne${name} ?`,
      `Le monde dort, pas vous${name}`,
      `Bonsoir noctambule${name}`,
      `On finalise une facture${name} ?`,
      `Ne veillez pas trop tard${name}`,
      `Prêt à boucler la journée${name} ?`,
    ]
  } else if (hour < 12) {
    pool = [
      `Bonjour${name}`,
      `Bon retour${name}`,
      `Content de vous revoir${name}`,
      `Belle matinée${name}`,
      `Bienvenue${name}`,
      `Prêt à attaquer la journée${name} ?`,
      `Une nouvelle journée${name}`,
      `Que la journée commence${name}`,
    ]
  } else if (hour < 18) {
    pool = [
      `Bon après-midi${name}`,
      `Content de vous revoir${name}`,
      `Bon retour${name}`,
      `On continue sur la lancée${name} ?`,
      `L'après-midi est à vous${name}`,
      `Le rythme est bon${name}`,
      `On avance${name} ?`,
    ]
  } else if (hour < 22) {
    pool = [
      `Bonsoir${name}`,
      `Bon retour${name}`,
      `Belle soirée${name}`,
      `La journée s'achève${name}`,
      `On finit en beauté${name} ?`,
      `On boucle la journée${name} ?`,
      `On termine en douceur${name}`,
    ]
  } else {
    pool = [
      `Bonsoir${name}`,
      `Vous travaillez tard${name}`,
      `Il se fait tard${name}`,
      `Faktur veille avec vous${name}`,
      `Le calme du soir${name}`,
      `Bonne fin de soirée${name}`,
    ]
  }
  return pool[Math.floor(Math.random() * pool.length)] + ' !'
}

interface DashboardStats {
  totalInvoiced: { value: number; trend: number; previousValue: number }
  outstanding: { value: number; trend: number }
  totalCollected: { value: number; trend: number; previousValue: number }
}

interface RecentItem {
  id: string
  type: 'invoice' | 'quote'
  number: string
  clientName: string
  amount: number
  status: string
  date: string
}

interface RevenueDataPoint {
  date: string
  factures: number
  devis: number
}

interface MonthlyDataPoint {
  month: string
  label: string
  subtotal: number
  total: number
  count: number
}

interface MicroDataPoint {
  month: string
  label: string
  subtotal: number
  cumulative: number
  count: number
  thresholdServices: number
  thresholdGoods: number
}

const CHARTS_KEY = 'zenvoice_active_charts'

function loadActiveCharts(): ChartKey[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CHARTS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveActiveCharts(charts: ChartKey[]) {
  try {
    localStorage.setItem(CHARTS_KEY, JSON.stringify(charts))
  } catch {}
}

function formatCurrency(amount: number, locale: string) {
  return amount.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string, locale: string) {
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'muted' {
  switch (status) {
    case 'paid':
    case 'accepted':
      return 'success'
    case 'overdue':
    case 'rejected':
      return 'destructive'
    case 'pending':
      return 'warning'
    case 'draft':
      return 'muted'
    default:
      return 'default'
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function Kpi({
  label,
  value,
  sub,
  trend,
  tone,
  index,
}: {
  label: string
  value: string
  sub: string
  trend?: number
  tone?: string
  index: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="app-surface rounded-2xl bg-card shadow-surface p-5 flex flex-col gap-2.5"
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn('text-[26px] font-bold tabular-nums leading-none text-foreground', tone)}>{value}</span>
      <div className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground">
        {trend !== undefined && trend !== 0 && (
          <span className={cn('inline-flex items-center gap-0.5 font-semibold', trend > 0 ? 'text-success' : 'text-danger')}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        <span className="truncate">{sub}</span>
      </div>
    </motion.div>
  )
}

function RecentActivity({
  items,
  locale,
  t,
}: {
  items: RecentItem[]
  locale: string
  t: (key: string) => string
}) {
  return (
    <div className="app-surface rounded-2xl bg-card shadow-surface flex flex-col h-full min-h-[280px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.recentActivity.title') || 'Activité récente'}</h3>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('dashboard.viewAll') || 'Tout voir'}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-5 py-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-muted-foreground [html[data-surface=glass]_&]:bg-surface/40 [html[data-surface=liquid]_&]:bg-surface/40">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.recentActivity.empty') || 'Aucune activité pour le moment'}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          {items.slice(0, 7).map((item) => {
            const Icon = item.type === 'invoice' ? FileText : Receipt
            return (
              <Link
                key={item.id}
                href={`/dashboard/${item.type === 'invoice' ? 'invoices' : 'quotes'}/${item.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/[0.04] transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground [html[data-surface=glass]_&]:bg-surface/40 [html[data-surface=liquid]_&]:bg-surface/40">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{item.number}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.clientName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[13px] font-semibold tabular-nums text-foreground">{formatCurrency(item.amount, locale)}</p>
                  <Badge variant={statusVariant(item.status)} className="text-[9px]">
                    {t(`dashboard.statuses.${item.status}`) || item.status}
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const { settings } = useInvoiceSettings()
  const aiEnabled = settings.aiEnabled
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [addChartOpen, setAddChartOpen] = useState(false)
  const [activeCharts, setActiveCharts] = useState<ChartKey[]>(loadActiveCharts)
  const [greeting, setGreeting] = useState<string>(' ')

  const [revenueData, setRevenueData] = useState<MonthlyDataPoint[]>([])
  const [collectedData, setCollectedData] = useState<MonthlyDataPoint[]>([])
  const [microData, setMicroData] = useState<MicroDataPoint[]>([])

  useEffect(() => {
    setGreeting(pickAdaptiveGreeting(user?.fullName?.split(' ')[0]))
  }, [user?.fullName])

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    for (const key of activeCharts) {
      if (key === 'revenue' && revenueData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/revenue').then(({ data }) => {
          if (data?.data) setRevenueData(data.data)
        })
      }
      if (key === 'collected' && collectedData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/collected').then(({ data }) => {
          if (data?.data) setCollectedData(data.data)
        })
      }
      if (key === 'micro' && microData.length === 0) {
        api.get<{ data: MicroDataPoint[] }>('/dashboard/charts/micro-thresholds').then(({ data }) => {
          if (data?.data) setMicroData(data.data)
        })
      }
    }
  }, [activeCharts])

  async function loadDashboard() {
    const { data } = await api.get<{
      stats: DashboardStats
      recent: RecentItem[]
      chartData?: RevenueDataPoint[]
    }>('/dashboard')
    if (data) {
      setStats(data.stats)
      setRecent(data.recent || [])
      setChartData(data.chartData || [])
    }
    setLoading(false)
  }

  const handleAddChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      saveActiveCharts(next)
      return next
    })
  }, [])

  const handleRemoveChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      const next = prev.filter((k) => k !== key)
      saveActiveCharts(next)
      return next
    })
  }, [])

  const overdue = useMemo(() => {
    const items = recent.filter((r) => r.type === 'invoice' && r.status === 'overdue')
    const amount = items.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    return { count: items.length, amount }
  }, [recent])


  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 md:py-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-6 md:py-8 max-w-[1400px] mx-auto w-full">
      <motion.header
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7"
      >
        <div className="min-w-0">
          <TextType
            key={greeting}
            text={greeting}
            as="h1"
            typingSpeed={22}
            initialDelay={120}
            loop={false}
            showCursor
            hideCursorWhileTyping={false}
            cursorCharacter="|"
            cursorBlinkDuration={0.5}
            className="text-2xl md:text-[28px] font-bold text-foreground tracking-tight"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.welcome.subtitle') || 'Voici un aperçu de votre activité.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAddChartOpen(true)}
            className="button button--sm button--ghost gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t('dashboard.addChart') || 'Ajouter un graphique'}</span>
          </button>
          <Link href="/dashboard/quotes/new" className="button button--sm button--secondary gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.quickActions.newQuote') || 'Nouveau devis'}</span>
          </Link>
          <Link href="/dashboard/invoices/new" className="button button--sm button--primary gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {t('dashboard.quickActions.newInvoice') || 'Nouvelle facture'}
          </Link>
        </div>
      </motion.header>

      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
      >
        <Kpi
          index={1}
          label={t('dashboard.stats.totalInvoiced') || 'Total facturé'}
          value={stats ? formatCurrency(stats.totalInvoiced.value, locale) : '—'}
          trend={stats?.totalInvoiced.trend ?? 0}
          sub={t('dashboard.stats.thisMonth') || 'Ce mois-ci'}
        />
        <Kpi
          index={2}
          label={t('dashboard.stats.totalCollected') || 'Total encaissé'}
          value={stats ? formatCurrency(stats.totalCollected.value, locale) : '—'}
          trend={stats?.totalCollected.trend ?? 0}
          sub={t('dashboard.stats.thisMonth') || 'Ce mois-ci'}
        />
        <Kpi
          index={3}
          label={t('dashboard.stats.outstanding') || 'En attente'}
          value={stats ? formatCurrency(stats.outstanding.value, locale) : '—'}
          sub={t('dashboard.stats.pendingInvoices') || 'Factures en attente'}
        />
        <Kpi
          index={4}
          label={t('dashboard.overdue.title') || 'En retard'}
          value={String(overdue.count)}
          tone={overdue.count > 0 ? 'text-danger' : undefined}
          sub={
            overdue.count > 0
              ? `${formatCurrency(overdue.amount, locale)} ${t('dashboard.overdue.toRecover') || 'à récupérer'}`
              : t('dashboard.overdue.allClear') || 'Tout est en règle'
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="grid lg:grid-cols-3 gap-4"
      >
        <div className="lg:col-span-2 min-w-0">
          <ChartRevenue data={chartData} />
        </div>
        <RecentActivity items={recent} locale={locale} t={t} />
      </motion.div>

      {aiEnabled && (
        <div className="mt-4">
          <AiDashboardSummary />
        </div>
      )}

      {activeCharts.length > 0 && (
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          {activeCharts.map((key) => (
            <div key={key} className="group/chart relative min-w-0">
              <button
                onClick={() => handleRemoveChart(key)}
                className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-overlay/80 backdrop-blur-sm shadow-surface flex items-center justify-center text-muted-foreground hover:text-danger transition-colors opacity-0 group-hover/chart:opacity-100"
                title={t('dashboard.remove') || 'Retirer'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {key === 'revenue' && (
                <ChartMonthly
                  title={t('dashboard.charts.revenue') || "Chiffre d'affaires HT"}
                  description={t('dashboard.charts.revenueDesc') || 'CA hors taxes facturé par mois (12 mois)'}
                  data={revenueData}
                  dataKey="subtotal"
                  color="var(--color-chart-1)"
                />
              )}
              {key === 'collected' && (
                <ChartMonthly
                  title={t('dashboard.charts.collected') || "Chiffre d'affaires encaissé"}
                  description={t('dashboard.charts.collectedDesc') || 'Paiements reçus par mois (12 mois)'}
                  data={collectedData}
                  dataKey="subtotal"
                  color="var(--color-chart-2)"
                />
              )}
              {key === 'micro' && (
                <ChartMonthly
                  title={t('dashboard.charts.micro') || 'Seuils de ma micro'}
                  description={`${t('dashboard.charts.microDesc') || 'CA cumulé vs seuils micro-entrepreneur'} (${new Date().getFullYear()})`}
                  data={microData}
                  dataKey="cumulative"
                  color="var(--color-chart-5)"
                  thresholds={[
                    { value: 77700, label: t('dashboard.charts.servicesThreshold') || 'Seuil services', color: '#f59e0b' },
                    { value: 188700, label: t('dashboard.charts.goodsThreshold') || 'Seuil marchandises', color: '#ef4444' },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <AddChartSidebar
        open={addChartOpen}
        onClose={() => setAddChartOpen(false)}
        onAddChart={handleAddChart}
        activeCharts={activeCharts}
      />
    </div>
  )
}
