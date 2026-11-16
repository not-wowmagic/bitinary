import { ArrowLeft, Ban, Download, Search, ShieldCheck, UserCog } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useConsole } from '@/app/console'
import { useStore } from '@/app/store'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { fmtDate, fmtRel, refreshConsoleUsers, useConsoleUsers, useModeration, type ConsoleUser } from './data'
import { Avatar, Badge, Empty, PageHead, Panel, download, field } from './ui'

type RoleF = 'all' | 'traveler' | 'business'
type StatusF = 'all' | 'active' | 'suspended'
type Sort = 'newest' | 'active' | 'name'

const methodLabel = { google: 'Google', mobile: 'Mobile', email: 'Email' }
const sourceLabel = { database: 'Supabase Auth' }

function useUserActions() {
  const { update } = useConsole()
  const { showToast } = useStore()
  const suspend = (ids: string[], on: boolean, names: string) => {
    update((x) => ({ ...x, suspended: on ? [...new Set([...x.suspended, ...ids])] : x.suspended.filter((s) => !ids.includes(s)) }), { area: 'Users', action: `${on ? 'Suspended' : 'Unsuspended'} ${names}`, target: ids.length === 1 ? ids[0] : undefined })
    showToast({ text: on ? `${names} suspended.` : `${names} unsuspended.`, expression: on ? 'unsure' : 'celebrating' })
  }
  return { suspend }
}

function toCsv(list: ConsoleUser[]) {
  const head = ['id', 'name', 'email', 'mobile', 'role', 'method', 'source', 'city', 'joined', 'last_active', 'reviews', 'comments', 'status']
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [head.join(','), ...list.map((u) => [u.id, u.name, u.email, u.mobile && `+63${u.mobile}`, u.role, u.method, u.source, u.city, u.joined, u.lastActive, u.reviews, u.comments, u.suspended ? 'suspended' : 'active'].map(esc).join(','))].join('\n')
}

export function UsersPage() {
  const { users, loading } = useConsoleUsers()
  const navigate = useNavigate()
  const { suspend } = useUserActions()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<RoleF>('all')
  const [status, setStatus] = useState<StatusF>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [sel, setSel] = useState<string[]>([])

  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return users
      .filter((u) => (role === 'all' || u.role === role) && (status === 'all' || (status === 'suspended') === u.suspended))
      .filter((u) => !n || [u.name, u.email, u.mobile, u.city].join(' ').toLowerCase().includes(n))
      .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'active' ? b.lastActive.localeCompare(a.lastActive) : b.joined.localeCompare(a.joined)))
  }, [users, q, role, status, sort])
  const chosen = users.filter((u) => sel.includes(u.id))
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allOn = list.length > 0 && list.every((u) => sel.includes(u.id))

  return (
    <>
      <PageHead
        title="Users"
        sub={`${users.length} users · ${users.filter((u) => u.suspended).length} suspended`}
        actions={
          <Button variant="secondary" icon={<Download size={17} />} onClick={() => download('bitinary-users.csv', toCsv(list), 'text/csv')}>
            Export CSV
          </Button>
        }
      />
      <Panel pad={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:p-5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, mobile or city" aria-label="Search users" className={cn(field, 'pl-10')} />
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as RoleF)} className={cn(field, 'w-auto')}>
              <option value="all">All roles</option>
              <option value="traveler">Travelers</option>
              <option value="business">Business owners</option>
            </select>
            <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusF)} className={cn(field, 'w-auto')}>
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(field, 'w-auto')}>
              <option value="newest">Newest</option>
              <option value="active">Last active</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {sel.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-primary/8 px-4 py-2.5 md:px-5">
            <p className="mr-auto font-display text-[14px] font-semibold">{sel.length} selected</p>
            <Button size="sm" variant="secondary" icon={<Ban size={15} />} onClick={() => (suspend(sel, true, `${sel.length} users`), setSel([]))}>
              Suspend
            </Button>
            <Button size="sm" variant="secondary" icon={<ShieldCheck size={15} />} onClick={() => (suspend(sel, false, `${sel.length} users`), setSel([]))}>
              Unsuspend
            </Button>
            <Button size="sm" variant="secondary" icon={<Download size={15} />} onClick={() => download('bitinary-users-selected.csv', toCsv(chosen), 'text/csv')}>
              Export
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSel([])}>
              Clear
            </Button>
          </div>
        )}

        {loading ? (
          <div role="status" aria-label="Loading users" aria-busy="true" className="divide-y divide-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3 md:px-5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-36 max-w-full" />
                  <Skeleton className="mt-2 h-3 w-52 max-w-full" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <Empty title={users.length ? 'No matching users' : 'No users yet'} body={users.length ? 'Try a different search or filter.' : 'User accounts will appear here after they sign up.'} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[14px]">
                <thead className="text-[12px] uppercase tracking-wide text-fg-2">
                  <tr className="border-b border-line">
                    <th className="w-10 px-5 py-3">
                      <input type="checkbox" aria-label="Select all" checked={allOn} onChange={() => setSel(allOn ? [] : list.map((u) => u.id))} className="h-4 w-4 accent-[#FF6A00]" />
                    </th>
                    <th className="py-3 pr-3">User</th>
                    <th className="py-3 pr-3">Role</th>
                    <th className="py-3 pr-3">Sign-in</th>
                    <th className="py-3 pr-3">Joined</th>
                    <th className="py-3 pr-3">Last active</th>
                    <th className="py-3 pr-3 text-right">Reviews</th>
                    <th className="py-3 pr-3 text-right">Comments</th>
                    <th className="py-3 pr-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} onClick={() => navigate(u.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-sunken/60 dark:hover:bg-elevated/60">
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${u.name}`} checked={sel.includes(u.id)} onChange={() => toggle(u.id)} className="h-4 w-4 accent-[#FF6A00]" />
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 font-semibold">
                              {u.name}
                            </span>
                            <span className="block truncate text-[13px] text-fg-2">{u.email ?? (u.mobile ? `+63 ${u.mobile}` : '—')}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-3">{u.role === 'business' ? <Badge tone="dark">Business</Badge> : <Badge>Traveler</Badge>}</td>
                      <td className="py-3 pr-3 text-fg-2">{methodLabel[u.method]}</td>
                      <td className="py-3 pr-3 text-fg-2">{fmtDate(u.joined)}</td>
                      <td className="py-3 pr-3 text-fg-2">{fmtRel(u.lastActive)}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{u.reviews}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{u.comments}</td>
                      <td className="py-3 pr-5">
                        <span className="flex flex-wrap gap-1">
                          {u.suspended ? <Badge tone="danger">Suspended</Badge> : <Badge tone="ok">Active</Badge>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Phone and tablet cards */}
            <ul className="divide-y divide-line lg:hidden">
              {list.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <input type="checkbox" aria-label={`Select ${u.name}`} checked={sel.includes(u.id)} onChange={() => toggle(u.id)} className="h-5 w-5 shrink-0 accent-[#FF6A00]" />
                  <Link to={u.id} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={u.name} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[15px] font-semibold">{u.name}</span>
                      <span className="block truncate text-[13px] text-fg-2">
                        {u.role === 'business' ? 'Business' : 'Traveler'} · {methodLabel[u.method]} · {fmtRel(u.lastActive)}
                      </span>
                    </span>
                    {u.suspended ? <Badge tone="danger">Suspended</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </>
  )
}

export function UserDetail() {
  const { id = '' } = useParams()
  const { users, loading } = useConsoleUsers()
  const u = users.find((x) => x.id === id)
  const { c } = useConsole()
  const { update } = useConsole()
  const moderation = useModeration()
  const { suspend } = useUserActions()
  const { showToast } = useStore()
  const navigate = useNavigate()
  if (loading) {
    return <Panel><Empty title="Loading user…" /></Panel>
  }
  if (!u) {
    return (
      <Panel>
        <Empty title="User not found" body="They may have been deleted." action={<Button onClick={() => navigate('/bitinarydev/users')}>Back to users</Button>} />
      </Panel>
    )
  }
  const reviews = moderation.filter((item) => item.authorId === u.id && item.kind === 'review')
  const comments = moderation.filter((item) => item.authorId === u.id && item.kind === 'comment')
  const timeline = c.log.filter((l) => l.target === u.id)
  const changeRole = async (r: 'traveler' | 'business') => {
    const { error } = await supabase.rpc('set_dev_console_user_role', { p_user_id: u.id, p_role: r })
    if (error) {
      showToast({ text: `Couldn’t update ${u.name}’s role. Details: ${error.message}`, expression: 'unsure' })
      return
    }
    update((x) => x, { area: 'Users', action: `Changed ${u.name} to ${r}`, target: u.id })
    refreshConsoleUsers()
    showToast({ text: `${u.name} is now listed as a ${r === 'business' ? 'business owner' : 'traveler'}.`, expression: 'pointing' })
  }

  return (
    <>
      <Link to="/bitinarydev/users" className="mb-3 inline-flex min-h-11 items-center gap-1.5 font-display text-[14px] font-medium text-link">
        <ArrowLeft size={17} /> All users
      </Link>
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={u.name} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-h2">{u.name}</h1>
          <p className="text-[14px] text-fg-2">{[u.email, u.mobile && `+63 ${u.mobile}`, u.city].filter(Boolean).join(' · ') || 'No contact details'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {u.suspended ? <Badge tone="danger">Suspended</Badge> : <Badge tone="ok">Active</Badge>}
            <Badge tone={u.role === 'business' ? 'dark' : 'neutral'}>{u.role === 'business' ? 'Business owner' : 'Traveler'}</Badge>
            <Badge>{sourceLabel[u.source]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={u.suspended ? 'secondary' : 'danger'} icon={u.suspended ? <ShieldCheck size={17} /> : <Ban size={17} />} onClick={() => suspend([u.id], !u.suspended, u.name)}>
            {u.suspended ? 'Unsuspend' : 'Suspend'}
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <Panel title="Account">
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[14px]">
              <dt className="text-fg-2">User ID</dt>
              <dd className="truncate font-mono text-[13px]">{u.id}</dd>
              <dt className="text-fg-2">Sign-in</dt>
              <dd>{methodLabel[u.method]}</dd>
              <dt className="text-fg-2">Joined</dt>
              <dd>{fmtDate(u.joined)}</dd>
              <dt className="text-fg-2">Last active</dt>
              <dd>{fmtRel(u.lastActive)}</dd>
              <dt className="text-fg-2">Reviews</dt>
              <dd>{u.reviews}</dd>
              <dt className="text-fg-2">Comments</dt>
              <dd>{u.comments}</dd>
            </dl>
          </Panel>
          <Panel title="Role" sub="This changes the role on the Supabase profile.">
            <Segmented
              className="w-full"
              label="Role"
              value={u.role}
              onChange={changeRole}
              options={[
                { value: 'traveler', label: 'Traveler' },
                { value: 'business', label: 'Business owner' },
              ]}
            />
          </Panel>
          <Panel title="Account management" sub="User creation, password resets and account deletion are managed in Supabase Auth.">
            <p className="text-[14px] text-fg-2">Passwords are not available to the console and are never stored in the application schema.</p>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title={`Reviews (${reviews.length})`} pad={false}>
            {reviews.length ? (
              <ul className="divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="px-4 py-3 md:px-5">
                    <p className="flex items-center justify-between gap-2 text-[14px]">
                      <span className="font-semibold">{r.placeName}</span>
                      <span className="text-amber">{'★'.repeat(r.stars ?? 0)}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-[14px] text-fg-2">{r.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No reviews yet" />
            )}
          </Panel>
          <Panel title={`Comments (${comments.length})`} pad={false}>
            {comments.length ? (
              <ul className="divide-y divide-line">
                {comments.map((x) => (
                  <li key={x.id} className="px-4 py-3 text-[14px] md:px-5">
                    <p className="line-clamp-2">{x.text}</p>
                    <p className="text-[12px] text-fg-2">{x.placeName} · {fmtRel(x.at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No comments yet" />
            )}
          </Panel>
          <Panel title="Console history" pad={false}>
            {timeline.length ? (
              <ul className="divide-y divide-line">
                {timeline.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-[14px] md:px-5">
                    <UserCog size={16} className="shrink-0 text-fg-2" />
                    <span className="flex-1">
                      {l.action}
                      {l.by && <span className="block text-[12px] text-fg-2">by {l.by}</span>}
                    </span>
                    <span className="text-[12px] text-fg-2">{fmtRel(l.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No console actions for this user" />
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
