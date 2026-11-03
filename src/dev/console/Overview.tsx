import { useVerifications } from '@/app/verification'
import { verifyState } from '@/lib/verify'
import { BadgeCheck, HardDrive, Megaphone, MousePointerClick, Palette, Radio, ShieldAlert, Star, Users, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router'
import { bannerActive, useConsole } from '@/app/console'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { useConsoleUsers, useModeration, storageUsage, kb, fmtRel, STORAGE_BUDGET } from './data'
import { Badge, Empty, PageHead, Panel, Stat } from './ui'

export function Overview() {
  const { c, update } = useConsole()
  const users = useConsoleUsers()
  const mod = useModeration()
  const navigate = useNavigate()
  const live = c.banners.filter((b) => bannerActive(b))
  const clicks = c.banners.reduce((a, b) => a + b.stats.clicks, 0)
  const dayAgo = Date.now() - 864e5
  const reviewsToday = mod.filter((m) => m.kind === 'review' && new Date(m.at).getTime() > dayAgo).length
  const flagged = mod.filter((m) => m.flags.length && !m.removed).length
  const storage = storageUsage()
  const ver = useVerifications()
  const pendingV = ver.filter((r) => r.v.status === 'pending').length
  const expiredV = ver.filter((r) => verifyState(r.v) === 'expired').length
  return (
    <>
      <PageHead title="Dashboard" sub="Everything in Bitinary on this device, in one place." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-7">
        <Stat label="Users" value={users.length} sub={`${users.filter((u) => u.source !== 'sample').length} on this device`} icon={<Users size={20} />} onClick={() => navigate('users')} />
        <Stat label="Live banners" value={live.length} sub={`${c.banners.length} total`} icon={<Megaphone size={20} />} onClick={() => navigate('banners')} />
        <Stat label="Banner clicks" value={clicks.toLocaleString()} sub="All time" icon={<MousePointerClick size={20} />} onClick={() => navigate('banners')} />
        <Stat label="Reviews today" value={reviewsToday} icon={<Star size={20} />} onClick={() => navigate('moderation?kind=review')} />
        <Stat label="To moderate" value={flagged} sub="Flagged, not removed" icon={<ShieldAlert size={20} />} onClick={() => navigate('moderation?flagged=1')} />
        <Stat label="Pending verification" value={pendingV} sub={expiredV ? `${expiredV} permits expired` : 'DTI and business permits'} icon={<BadgeCheck size={20} />} onClick={() => navigate('verification?status=pending')} />
        <Stat label="Storage" value={kb(storage.total)} sub={`${Math.round((storage.total / STORAGE_BUDGET) * 100)}% of ~5 MB`} icon={<HardDrive size={20} />} onClick={() => navigate('data')} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" icon={<Megaphone size={18} />} onClick={() => navigate('banners/new')}>
              New banner
            </Button>
            <Button variant="secondary" icon={<Palette size={18} />} onClick={() => navigate('theme')}>
              Edit theme
            </Button>
            <Button variant="secondary" icon={<Radio size={18} />} onClick={() => navigate('announcements')}>
              Post announcement
            </Button>
            <Button variant="secondary" icon={<Users size={18} />} onClick={() => navigate('users')}>
              Manage users
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-sunken p-4 dark:bg-elevated">
            <Wrench size={20} className="shrink-0 text-link" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold">Maintenance mode</p>
              <p className="text-[13px] text-fg-2">{c.maintenance.on ? 'On. The app and /biz show a maintenance screen.' : 'Off. Everyone can use the app.'}</p>
            </div>
            <Toggle label="Maintenance mode" checked={c.maintenance.on} onChange={(on) => update((x) => ({ ...x, maintenance: { ...x.maintenance, on } }), { area: 'Announcements', action: on ? 'Turned maintenance mode on' : 'Turned maintenance mode off' })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.announcement.on && <Badge tone="orange">Announcement live</Badge>}
            {Object.entries(c.flags).filter(([, v]) => !v).map(([k]) => (
              <Badge key={k} tone="caution">
                {k} off
              </Badge>
            ))}
            {c.theme.preset !== 'bitinary' && <Badge tone="dark">Theme: {c.theme.preset}</Badge>}
          </div>
        </Panel>
        <Panel title="Recent activity" action={<Button size="sm" variant="ghost" onClick={() => navigate('log')}>See all</Button>} pad={false}>
          {c.log.length ? (
            <ul className="divide-y divide-line">
              {c.log.slice(0, 8).map((l) => (
                <li key={l.id} className="flex items-start gap-3 px-4 py-3 md:px-5">
                  <Badge>{l.area}</Badge>
                  <p className="min-w-0 flex-1 text-[14px]">
                    {l.action}
                    {l.by && <span className="block text-[12px] text-fg-2">by {l.by}</span>}
                  </p>
                  <span className="shrink-0 text-[12px] text-fg-2">{fmtRel(l.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No activity yet" body="Changes you make in the console show up here." />
          )}
        </Panel>
      </div>
    </>
  )
}
