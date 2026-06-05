'use client'

import type { SessionDiagnostics } from '@/lib/session-diagnostics'

interface SessionLoopScreenProps {
  diagnostics: SessionDiagnostics
  onRetry: () => void
}

export function SessionLoopScreen({ diagnostics, onRetry }: SessionLoopScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="text-lg font-semibold text-foreground">{diagnostics.reason}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{diagnostics.detail}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          Se reconnecter
        </button>

        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Détails techniques
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(diagnostics.signals, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
