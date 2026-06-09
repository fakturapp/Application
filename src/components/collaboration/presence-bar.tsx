'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CollaboratorInfo } from '@/hooks/use-collaboration'

interface PresenceBarProps {
  collaborators: CollaboratorInfo[]
  latencies?: Map<string, number>
  myUserId?: string | null
  canModerate?: boolean
  onKick?: (userId: string) => void
  onBan?: (userId: string) => void
  className?: string
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function firstName(collab: CollaboratorInfo): string {
  if (collab.fullName) return collab.fullName.split(' ')[0]
  return collab.email.split('@')[0]
}

function roleLabel(collab: CollaboratorInfo): string {
  if (collab.isOwner) return 'Propriétaire'
  return collab.permission === 'editor' ? 'Peut modifier' : 'Lecture seule'
}

function pingTone(ms: number): string {
  if (ms < 120) return 'bg-green-500'
  if (ms < 300) return 'bg-amber-500'
  return 'bg-red-500'
}

const MAX_VISIBLE = 4
const EMPTY_LATENCIES = new Map<string, number>()

export function PresenceBar({
  collaborators,
  latencies = EMPTY_LATENCIES,
  myUserId = null,
  canModerate = false,
  onKick,
  onBan,
  className,
}: PresenceBarProps) {
  const [openUserId, setOpenUserId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'kick' | 'ban' | null>(null)

  if (collaborators.length === 0) return null

  const visible = collaborators.slice(0, MAX_VISIBLE)
  const overflow = collaborators.length - MAX_VISIBLE

  const close = () => {
    setOpenUserId(null)
    setConfirm(null)
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {visible.map((collab, i) => {
            const isSelf = collab.userId === myUserId
            const interactive = canModerate && !isSelf
            const isOpen = openUserId === collab.userId
            const ping = latencies.get(collab.userId)

            return (
              <motion.div
                key={collab.userId}
                initial={{ scale: 0, opacity: 0, x: -8 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0, x: -8 }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.45, delay: i * 0.05 }}
                className="group relative"
                style={{ zIndex: isOpen ? 60 : MAX_VISIBLE - i }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!interactive) return
                    setConfirm(null)
                    setOpenUserId(isOpen ? null : collab.userId)
                  }}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-[2.5px] ring-card transition-all duration-200 group-hover:ring-primary/30 group-hover:scale-110',
                    interactive ? 'cursor-pointer' : 'cursor-default'
                  )}
                  style={{ backgroundColor: collab.color }}
                >
                  {collab.avatarUrl ? (
                    <img
                      src={collab.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(collab.fullName, collab.email)
                  )}
                </button>

                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-[1.5px] ring-card" />
                </span>

                {!isOpen && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2.5 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-y-0 translate-y-1">
                    <div className="whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white shadow-xl dark:bg-zinc-700 border border-white/5">
                      <p className="font-semibold">
                        {collab.fullName ?? collab.email}
                        {isSelf && <span className="text-zinc-400 font-normal"> (vous)</span>}
                      </p>
                      <p className="text-zinc-400 mt-0.5">{roleLabel(collab)}</p>
                      {ping !== undefined && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-zinc-400">
                          <span className={cn('h-1.5 w-1.5 rounded-full', pingTone(ping))} />
                          Ping : {ping} ms
                        </p>
                      )}
                      {interactive && (
                        <p className="mt-1 text-[10px] text-zinc-500">Cliquer pour gérer</p>
                      )}
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-zinc-900 dark:bg-zinc-700 border-l border-t border-white/5" />
                  </div>
                )}

                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={close} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute left-1/2 top-full z-50 mt-2.5 w-60 -translate-x-1/2 rounded-xl border border-border bg-card p-3 shadow-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: collab.color }}
                        >
                          {collab.avatarUrl ? (
                            <img
                              src={collab.avatarUrl}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(collab.fullName, collab.email)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {collab.fullName ?? collab.email}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{collab.email}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">
                        <span className="text-muted-foreground">{roleLabel(collab)}</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              ping !== undefined ? pingTone(ping) : 'bg-muted-foreground/40'
                            )}
                          />
                          {ping !== undefined ? `${ping} ms` : 'mesure...'}
                        </span>
                      </div>

                      {confirm === null && (
                        <div className="mt-2.5 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            onClick={() => setConfirm('kick')}
                          >
                            Expulser
                          </Button>
                          {!collab.isOwner && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => setConfirm('ban')}
                            >
                              Bannir
                            </Button>
                          )}
                        </div>
                      )}

                      {confirm !== null && (
                        <div className="mt-2.5">
                          <p className="text-xs text-foreground leading-relaxed">
                            {confirm === 'kick'
                              ? `Expulser ${firstName(collab)} de ce document ? Il pourra revenir en rouvrant le document.`
                              : `Bannir ${firstName(collab)} ? Son accès sera révoqué et il ne pourra plus rejoindre ce document.`}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                              onClick={() => setConfirm(null)}
                            >
                              Annuler
                            </Button>
                            <Button
                              variant={confirm === 'ban' ? 'destructive' : 'default'}
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                if (confirm === 'kick') onKick?.(collab.userId)
                                else onBan?.(collab.userId)
                                close()
                              }}
                            >
                              Confirmer
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {overflow > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-[2.5px] ring-card"
            style={{ zIndex: 0 }}
          >
            +{overflow}
          </motion.div>
        )}
      </div>
    </div>
  )
}
