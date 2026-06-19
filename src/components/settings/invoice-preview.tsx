'use client'

import { useEffect } from 'react'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useAuth } from '@/lib/auth'
import { getTemplate } from '@/lib/invoice-templates'
import { Eye, ImagePlus } from '@/components/ui/icons'

function contrastText(hex: string) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#ffffff'
  } catch {
    return '#ffffff'
  }
}

const ITEMS = [
  { label: 'Conception d’identité visuelle', qty: '1', unit: 'forfait', pu: '1 800,00', total: '1 800,00' },
  { label: 'Création site vitrine', qty: '1', unit: 'forfait', pu: '2 400,00', total: '2 400,00' },
  { label: 'Séance photo produits', qty: '3', unit: '½ journée', pu: '320,00', total: '960,00' },
]

export function InvoicePreview() {
  const { settings, companyLogoUrl } = useInvoiceSettings()
  const { user } = useAuth()
  const isPro = user?.currentTeamPlan === 'pro' || user?.currentTeamPlan === 'team'

  const tpl = getTemplate(settings.template, settings.darkMode)
  const accent = settings.accentColor
  const effectiveLogoUrl = settings.logoSource === 'company' ? companyLogoUrl : settings.logoUrl
  const previewFont = tpl.font || settings.documentFont || 'Lexend'

  useEffect(() => {
    if (!previewFont || previewFont === 'Lexend') return
    const id = `gfont-${previewFont.replace(/\s/g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(previewFont)}:wght@400;500;600;700&display=swap`
    document.head.appendChild(link)
  }, [previewFont])

  const detailed = settings.billingType === 'detailed'
  const cols = {
    qty: detailed && settings.defaultShowQuantityColumn,
    unit: detailed && settings.defaultShowUnitColumn,
    pu: detailed && settings.defaultShowUnitPriceColumn,
    vat: detailed && settings.defaultShowVatColumn,
  }
  const vatRate = Number(settings.defaultVatRate ?? 20)
  const rows = detailed ? ITEMS : ITEMS.slice(0, 2)

  const footerText =
    !isPro
      ? null
      : settings.footerMode === 'custom'
        ? settings.defaultFooterText || 'Conditions générales disponibles sur demande.'
        : 'Studio Lumière · SIREN 902 481 553 · TVA FR42902481553'

  return (
    <div className="lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">Aperçu du document</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {tpl.name} · {detailed ? 'Complet' : 'Rapide'}
          </p>
        </div>

        <div className="bg-muted/30 p-4">
          <div
            className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-md shadow-lg"
            style={{
              aspectRatio: '210 / 297',
              backgroundColor: tpl.docBg,
              color: tpl.text,
              fontFamily: `'${previewFont}', 'Segoe UI', sans-serif`,
              ...(settings.customBackgroundUrl
                ? {
                    backgroundImage: `url('${settings.customBackgroundUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}),
              border: settings.darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
            }}
          >
            <div className="flex h-full">
              {tpl.layout === 'lateral' && (
                <div className="flex w-[30%] shrink-0 flex-col gap-2 p-3.5" style={{ backgroundColor: accent, color: contrastText(accent) }}>
                  {effectiveLogoUrl ? (
                    <img src={effectiveLogoUrl} alt="" className="mb-1 h-8 w-auto max-w-full self-start object-contain" style={{ borderRadius: settings.logoBorderRadius }} />
                  ) : (
                    <p className="text-[13px] font-bold leading-tight">Studio Lumière</p>
                  )}
                  <div className="mt-2 space-y-0.5 text-[7.5px] leading-relaxed opacity-90">
                    <p>12 rue Beaurepaire</p>
                    <p>75010 Paris</p>
                    <p>SIREN 902 481 553</p>
                  </div>
                  <div className="mt-auto space-y-0.5 text-[7.5px] opacity-90">
                    <p className="font-semibold uppercase tracking-wide">Échéance</p>
                    <p>28 mars 2026</p>
                  </div>
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col p-4">
                {tpl.layout === 'banner' && (
                  <div className="-mx-2 -mt-2 mb-4 flex items-center justify-between rounded-md px-4 py-3" style={{ backgroundColor: accent }}>
                    {effectiveLogoUrl ? (
                      <img src={effectiveLogoUrl} alt="" className="h-7 w-auto max-w-[80px] object-contain" style={{ borderRadius: settings.logoBorderRadius }} />
                    ) : (
                      <p className="text-[13px] font-bold" style={{ color: contrastText(accent) }}>Studio Lumière</p>
                    )}
                    <p className="text-[13px] font-bold tracking-wide" style={{ color: contrastText(accent) }}>FACTURE</p>
                  </div>
                )}

                {tpl.layout !== 'banner' && (
                  <div className="mb-3 flex items-start justify-between">
                    {tpl.layout === 'lateral' ? (
                      <div />
                    ) : (
                      <div className="space-y-1">
                        {effectiveLogoUrl ? (
                          <img src={effectiveLogoUrl} alt="" className="h-9 w-auto max-w-[120px] object-contain" style={{ borderRadius: settings.logoBorderRadius }} />
                        ) : (
                          <p className="text-[14px] font-bold" style={{ color: tpl.text }}>Studio Lumière</p>
                        )}
                        <div className="text-[8px] leading-relaxed" style={{ color: tpl.textMuted }}>
                          <p>12 rue Beaurepaire, 75010 Paris</p>
                          <p>SIREN 902 481 553</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-0.5 text-right">
                      <p className="text-[15px] font-bold tracking-wide" style={{ color: accent }}>FACTURE</p>
                      <p className="text-[9px] font-medium" style={{ color: tpl.textMuted }}>N° F-2026-014</p>
                      <p className="text-[9px]" style={{ color: tpl.textMuted }}>14 mars 2026</p>
                    </div>
                  </div>
                )}

                <div className="mb-3 h-[2px] rounded-full" style={{ backgroundColor: accent }} />

                <div className="mb-3 grid grid-cols-2 gap-3">
                  {tpl.layout !== 'lateral' && (
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Émetteur</p>
                      <p className="text-[10px] font-semibold" style={{ color: tpl.text }}>Studio Lumière</p>
                      <p className="text-[8.5px]" style={{ color: tpl.textMuted }}>contact@studio-lumiere.fr</p>
                    </div>
                  )}
                  <div className={`space-y-0.5 ${tpl.layout === 'lateral' ? 'col-span-2' : ''}`}>
                    <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Facturé à</p>
                    <div className="space-y-0.5 px-2 py-1.5" style={{ backgroundColor: tpl.clientBlockBg, border: `1px solid ${tpl.clientBlockBorder}`, borderRadius: tpl.borderRadius }}>
                      <p className="text-[10px] font-semibold" style={{ color: tpl.text }}>Atelier Dubois</p>
                      <p className="text-[8.5px]" style={{ color: tpl.textMuted }}>8 quai de la Loire, 69004 Lyon</p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-wide" style={{ backgroundColor: `${accent}14`, color: accent, borderTopLeftRadius: tpl.borderRadius, borderTopRightRadius: tpl.borderRadius }}>
                    <span className="flex-1">Description</span>
                    {cols.qty && <span className="w-7 text-right">Qté</span>}
                    {cols.unit && <span className="w-12 text-right">Unité</span>}
                    {cols.pu && <span className="w-14 text-right">PU HT</span>}
                    {cols.vat && <span className="w-9 text-right">TVA</span>}
                    <span className="w-16 text-right">Total</span>
                  </div>

                  {rows.map((item, i) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-[9px]"
                      style={{
                        backgroundColor: i % 2 === 0 ? tpl.rowEven : tpl.rowOdd,
                        borderBottom: i < rows.length - 1 ? `1px solid ${tpl.borderLight}` : undefined,
                        color: tpl.text,
                      }}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {cols.qty && <span className="w-7 text-right tabular-nums" style={{ color: tpl.textMuted }}>{item.qty}</span>}
                      {cols.unit && <span className="w-12 text-right" style={{ color: tpl.textMuted }}>{item.unit}</span>}
                      {cols.pu && <span className="w-14 text-right tabular-nums" style={{ color: tpl.textMuted }}>{item.pu}</span>}
                      {cols.vat && <span className="w-9 text-right tabular-nums" style={{ color: tpl.textMuted }}>{vatRate}%</span>}
                      <span className="w-16 text-right font-medium tabular-nums">{item.total}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-2 mt-3 flex justify-end">
                  <div className="w-48 space-y-1">
                    {detailed && (
                      <>
                        <div className="flex items-center justify-between text-[9px]" style={{ color: tpl.textMuted }}>
                          <span>Sous-total HT</span>
                          <span className="tabular-nums">5 160,00 €</span>
                        </div>
                        {cols.vat && (
                          <div className="flex items-center justify-between text-[9px]" style={{ color: tpl.textMuted }}>
                            <span>TVA ({vatRate}%)</span>
                            <span className="tabular-nums">1 032,00 €</span>
                          </div>
                        )}
                        <div className="my-1 h-px" style={{ backgroundColor: tpl.borderLight }} />
                      </>
                    )}
                    <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: accent + tpl.totalBg, borderRadius: tpl.borderRadius }}>
                      <span className="text-[10px] font-semibold" style={{ color: accent }}>Total TTC</span>
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: accent }}>6 192,00 €</span>
                    </div>
                  </div>
                </div>

                {settings.defaultSignatureField && (
                  <div className="mt-1 flex items-end justify-between gap-4 text-[7.5px]" style={{ color: tpl.textMuted }}>
                    <div className="flex-1">
                      <div className="mb-0.5 h-5 rounded" style={{ border: `1px dashed ${tpl.borderLight}` }} />
                      <p>Signature émetteur</p>
                    </div>
                    <div className="flex-1">
                      <div className="mb-0.5 h-5 rounded" style={{ border: `1px dashed ${tpl.borderLight}` }} />
                      <p>Signature client</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-1.5 pt-3" style={{ borderTop: `1px solid ${tpl.borderLight}` }}>
                  {settings.paymentMethods.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {settings.paymentMethods.includes('bank_transfer') && (
                        <span className="rounded px-1.5 py-0.5 text-[7.5px]" style={{ backgroundColor: tpl.paymentBadgeBg, border: `1px solid ${tpl.paymentBadgeBorder}`, color: tpl.paymentBadgeText }}>Virement</span>
                      )}
                      {settings.paymentMethods.includes('cash') && (
                        <span className="rounded px-1.5 py-0.5 text-[7.5px]" style={{ backgroundColor: tpl.paymentBadgeBg, border: `1px solid ${tpl.paymentBadgeBorder}`, color: tpl.paymentBadgeText }}>Espèces</span>
                      )}
                      {settings.paymentMethods.includes('custom') && settings.customPaymentMethod && (
                        <span className="rounded px-1.5 py-0.5 text-[7.5px]" style={{ backgroundColor: tpl.paymentBadgeBg, border: `1px solid ${tpl.paymentBadgeBorder}`, color: tpl.paymentBadgeText }}>{settings.customPaymentMethod}</span>
                      )}
                    </div>
                  )}
                  {footerText ? (
                    <p className="text-center text-[7.5px]" style={{ color: tpl.textMuted }}>{footerText}</p>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-[8px]" style={{ color: tpl.textMuted }}>
                      <span>Créé avec</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: accent }}>
                        <ImagePlus className="h-2.5 w-2.5" /> Faktur
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
