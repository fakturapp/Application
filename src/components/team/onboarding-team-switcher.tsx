'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown'
import { Spinner } from '@/components/ui/spinner'
import { ChevronsUpDown, Check } from '@/components/ui/icons'

interface TeamWithIcon {
  id: string
  name: string
  iconUrl?: string | null
  onboardingCompletedAt: string | null
}

export function OnboardingTeamSwitcher() {
  const { user } = useAuth()
  const [switching, setSwitching] = useState(false)

  const teams = (user?.teams ?? []) as unknown as TeamWithIcon[]
  if (teams.length === 0) return null

  const current = teams.find((t) => t.id === user?.currentTeamId) ?? null

  async function switchTo(teamId: string) {
    if (switching || teamId === user?.currentTeamId) return
    setSwitching(true)
    const { error } = await api.post('/team/switch', { teamId })
    if (error) {
      setSwitching(false)
      return
    }
    window.location.href = '/onboarding'
  }

  const row = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        {switching ? (
          <Spinner />
        ) : (
          <Avatar
            src={current?.iconUrl}
            fallback={current?.name?.[0]}
            size="sm"
            className="h-7 w-7 rounded-lg text-[10px]"
          />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[12px] font-semibold leading-tight text-foreground">
          {current?.name ?? 'Sélectionner une équipe'}
        </span>
        <span className="block truncate text-[10.5px] text-muted-foreground">
          {current?.onboardingCompletedAt ? 'Équipe configurée' : 'Équipe en cours de configuration'}
        </span>
      </span>
    </>
  )

  if (teams.length < 2) {
    return <div className="flex w-full items-center gap-2.5 rounded-xl bg-surface px-3 py-2">{row}</div>
  }

  return (
    <Dropdown
      align="left"
      position="above"
      sideOffset={6}
      className="w-[248px] lg:w-[288px]"
      trigger={
        <button
          type="button"
          disabled={switching}
          className="flex w-full items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          {row}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-secondary" />
        </button>
      }
    >
      <DropdownLabel>Équipes</DropdownLabel>
      {teams.map((t) => {
        const isActive = t.id === user?.currentTeamId
        return (
          <DropdownItem
            key={t.id}
            selected={isActive}
            onClick={() => switchTo(t.id)}
            className={isActive ? 'bg-surface' : undefined}
          >
            <Avatar
              src={t.iconUrl}
              fallback={t.name?.[0]}
              size="sm"
              className="h-6 w-6 shrink-0 rounded-md text-[10px]"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{t.name}</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {t.onboardingCompletedAt ? 'Configurée' : 'À configurer'}
              </span>
            </span>
            {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </DropdownItem>
        )
      })}
    </Dropdown>
  )
}
