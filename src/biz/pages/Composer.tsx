import { ArrowLeft, Bold, Camera, Clapperboard, Heading2, ImagePlus, Italic, List, MapPin, Send, Sparkles, Video, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { inputBase } from '@/components/flow/Fields'
import { Facebook } from '@/components/icons/Brand'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { shrink } from '@/screens/personalize/TravelerThemes'
import { longDate, time12 } from '../format'
import type { Post, PostType } from '../seed'
import { useBiz } from '../store'
import { Card, PageHeader, StateBlock } from '../ui'

const field = cn(inputBase, 'border-line')

export function Composer() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { d, set, t, lang, verified, showToast } = useBiz()
  const navigate = useNavigate()
  const existing = d.posts.find((p) => p.id === id)
  const [type, setType] = useState<PostType>(existing?.type ?? ((params.get('type') as PostType) || 'post'))
  const [text, setText] = useState(existing?.text ?? '')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [media, setMedia] = useState<string[]>(existing?.media ?? [])
  const [video, setVideo] = useState<string | undefined>(existing?.video)
  const [duration, setDuration] = useState(0)
  const [trim, setTrim] = useState<[number, number]>([0, 0])
  const [dealId, setDealId] = useState(existing?.dealId ?? (params.get('deal') ? d.deals[0]?.id : ''))
  const [fb, setFb] = useState(existing?.fb ?? false)
  const [schedule, setSchedule] = useState(existing?.status === 'scheduled')
  const [when, setWhen] = useState(() => (existing?.at ?? new Date(Date.now() + 864e5).toISOString()).slice(0, 16))
  const [capEn, setCapEn] = useState(true)
  const [capTl, setCapTl] = useState(true)
  const [helper, setHelper] = useState(false)
  const [location, setLocation] = useState(d.business.address)
  const editor = useRef<HTMLDivElement>(null)
  const perm = getForcedState() === 'permission'

  useEffect(() => {
    if (type === 'blog' && editor.current && !editor.current.innerHTML) editor.current.innerHTML = existing?.type === 'blog' ? `<p>${existing.text}</p>` : ''
  }, [type, existing])

  const ideas = {
    post: [
      t('Bagong luto, bagong saya! Subukan ang kare-kare namin ngayong tanghalian.', 'Freshly cooked, freshly happy! Try our kare-kare this lunch.'),
      t('Ubos-biyaya Biyernes: Buy 1 Take 1 sa Tapsilog, 5 PM hanggang 8 PM lang.', 'Friday treat: Buy 1 Take 1 Tapsilog, 5 PM to 8 PM only.'),
      t('Salamat sa 25 taon, Ermita! Kain tayo.', 'Thank you for 25 years, Ermita! Let’s eat.'),
    ],
    templates: [
      [t('Promo', 'Promo'), t('PROMO: [item] sa ₱[presyo] lang, [araw] mula [oras]. Tara na!', 'PROMO: [item] for only ₱[price], [day] from [time]. See you!')],
      [t('Bagong item', 'New item'), t('BAGO sa menu: [item]! [isang linya tungkol sa lasa].', 'NEW on the menu: [item]! [one line about the taste].')],
      [t('Behind the scenes', 'Behind the scenes'), t('Silipin kung paano namin niluluto ang [item] tuwing umaga.', 'See how we cook [item] every morning.')],
    ],
    script: t('0–3s: Close-up ng kumukulong kare-kare. 3–8s: Si Mang Ben naglalagay ng bagoong. 8–12s: Ihain sa mesa. Huling text: "Kainan ni Mang Ben, Ermita".', '0–3s: Close-up of bubbling kare-kare. 3–8s: Mang Ben adds bagoong. 8–12s: Serve at the table. End card: "Kainan ni Mang Ben, Ermita".'),
  }

  const save = (status: Post['status']) => {
    const body = type === 'blog' ? (editor.current?.innerText ?? '') : text
    const post: Post = {
      id: existing?.id ?? `p${Date.now()}`,
      type,
      title: type === 'blog' ? title : undefined,
      text: body,
      media: media.length ? media : type === 'reel' && video ? [d.business.cover ?? ''] : media,
      video,
      status,
      at: status === 'scheduled' ? new Date(when).toISOString() : new Date().toISOString(),
      views: existing?.views ?? 0,
      likes: existing?.likes ?? 0,
      saves: existing?.saves ?? 0,
      comments: existing?.comments ?? 0,
      dealId: dealId || undefined,
      fb,
    }
    set((x) => ({ ...x, posts: existing ? x.posts.map((p) => (p.id === post.id ? post : p)) : [post, ...x.posts] }))
    showToast({ text: status === 'draft' ? t('Na-save bilang draft', 'Saved as draft') : status === 'scheduled' ? t(`Naka-schedule: ${longDate(post.at, lang)}`, `Scheduled for ${longDate(post.at, lang)}`) : t('Na-publish sa profile mo!', 'Published to your profile!'), expression: status === 'published' ? 'celebrating' : 'pointing' })
    navigate(`/biz/content?v=${status === 'published' ? 'published' : status === 'scheduled' ? 'scheduled' : 'draft'}`)
  }
  const canPublish = type === 'blog' ? title.trim().length > 2 : type === 'reel' ? !!video || !!existing : text.trim().length > 2 || media.length > 0
  const typeLabel = { post: 'Post', reel: 'Reel', blog: 'Blog' }

  const helperPanel = (
    <Card title={t('Tulungan akong sumulat', 'Help me write')} icon={<Sparkles size={20} />} phase="P3">
      <div className="flex items-end gap-2">
        <Jimbot expression="idea" variant="standalone" size={60} className="-mb-1" />
        <p className="mb-2 flex-1 rounded-[16px] rounded-bl-md bg-sunken px-3 py-2 text-[15px] dark:bg-elevated">{t('Pumili ng ideya at i-edit mo.', 'Pick an idea, then make it yours.')}</p>
      </div>
      <p className="mb-1.5 mt-3 font-display text-[14px] font-medium">{t('Mga ideya sa caption', 'Caption ideas')}</p>
      <ul className="space-y-2">
        {ideas.post.map((i) => (
          <li key={i}>
            <button onClick={() => (type === 'blog' ? editor.current && (editor.current.innerHTML += `<p>${i}</p>`) : setText(i))} className="w-full rounded-[14px] border border-line p-3 text-left text-[15px] hover:border-primary">
              {i}
            </button>
          </li>
        ))}
      </ul>
      <p className="mb-1.5 mt-4 font-display text-[14px] font-medium">Templates</p>
      <div className="flex flex-wrap gap-2">
        {ideas.templates.map(([n, v]) => (
          <button key={n} onClick={() => setText(v)} className="min-h-11 rounded-full bg-sunken px-4 font-display text-[14px] font-medium dark:bg-elevated">
            {n}
          </button>
        ))}
      </div>
      {type === 'reel' && (
        <>
          <p className="mb-1.5 mt-4 font-display text-[14px] font-medium">{t('Maikling script ng video', 'Short video script')}</p>
          <p className="rounded-[14px] bg-sunken p-3 text-[15px] dark:bg-elevated">{ideas.script}</p>
        </>
      )}
    </Card>
  )

  const preview = (
    <Card title={t('Preview ng post', 'Post preview')} sub={t('Ang laman lang ng post mo', 'Your post content only')}>
      <div className="overflow-hidden rounded-[18px] border border-line">
        {type === 'reel' ? (
          <div className="mx-auto aspect-[9/16] max-h-[420px] bg-black">{video ? <video src={video} className="h-full w-full object-cover" controls playsInline muted /> : <div className="flex h-full items-center justify-center text-[15px] text-white/70">{t('Wala pang video', 'No video yet')}</div>}</div>
        ) : (
          (type === 'blog' ? media[0] : media[0]) && <img src={media[0]} alt="" className="aspect-[4/3] w-full object-cover" />
        )}
        <div className="p-3">
          {type === 'blog' && <p className="font-display text-[18px] font-semibold">{title || t('Pamagat', 'Title')}</p>}
          <p className="whitespace-pre-wrap text-[15px]">{type === 'blog' ? t('(Makikita ang buong teksto sa profile)', '(Full text appears on your profile)') : text || t('Isulat ang caption…', 'Write a caption…')}</p>
          {media.length > 1 && type === 'post' && <p className="mt-1 text-[13px] text-fg-2">+{media.length - 1} {t('larawan', 'photos')}</p>}
        </div>
      </div>
    </Card>
  )

  return (
    <main>
      <div className="px-4 pt-4 md:px-8">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/biz/content')}>
          {t('Bumalik sa Posts', 'Back to Posts')}
        </Button>
      </div>
      <PageHeader className="pt-1 md:pt-2" title={existing ? t(`I-edit ang ${typeLabel[type]}`, `Edit ${typeLabel[type]}`) : type === 'reel' ? t('Gumawa ng Reel', 'Create a Reel') : type === 'blog' ? t('Sumulat ng blog', 'Write a blog post') : t('Bagong post', 'New post')} phase="P3" />
      <div className="grid gap-4 px-4 md:px-8 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {!existing && (
            <Segmented<PostType>
              label={t('Uri ng post', 'Post type')}
              value={type}
              onChange={setType}
              options={[
                { value: 'post', label: 'Post' },
                { value: 'reel', label: 'Reel' },
                { value: 'blog', label: 'Blog' },
              ]}
            />
          )}
          <Card>
            <div className="space-y-4">
              {type === 'reel' &&
                (perm ? (
                  <StateBlock className="py-4" pose="camera" placeholder title={t('Kailangan ng pahintulot sa camera', 'Camera permission needed')} body={t('Payagan ang camera sa settings ng browser para mag-record, o mag-upload ng video.', 'Allow the camera in your browser settings to record, or upload a video instead.')} />
                ) : (
                  <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="mx-auto aspect-[9/16] w-[200px] overflow-hidden rounded-[18px] bg-black">
                      {video ? (
                        <video src={video} className="h-full w-full object-cover" playsInline muted autoPlay loop onLoadedMetadata={(e) => (setDuration(e.currentTarget.duration), setTrim([0, Math.min(e.currentTarget.duration, 30)]))} />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-white/80">
                          <Video size={30} />
                          <span className="text-[14px]">{t('Patayong video, hanggang 60 segundo', 'Vertical video, up to 60 seconds')}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 font-display text-[15px] font-medium text-on-primary">
                          <Clapperboard size={18} /> {t('Mag-upload', 'Upload')}
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && setVideo(URL.createObjectURL(e.target.files[0]))} />
                        </label>
                        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-sunken px-5 font-display text-[15px] font-medium dark:bg-elevated">
                          <Camera size={18} /> {t('Mag-record', 'Record')}
                          <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && setVideo(URL.createObjectURL(e.target.files[0]))} />
                        </label>
                      </div>
                      <div>
                        <p className="mb-1 font-display text-[14px] font-medium">{t('I-trim', 'Trim')}</p>
                        <div className="flex items-center gap-3 text-[14px]">
                          <span className="w-12 font-display">{trim[0].toFixed(1)}s</span>
                          <input type="range" aria-label={t('Simula', 'Start')} min={0} max={duration || 30} step={0.1} value={trim[0]} disabled={!video} onChange={(e) => setTrim([Math.min(Number(e.target.value), trim[1] - 1), trim[1]])} className="flex-1 accent-[var(--c-primary)]" />
                        </div>
                        <div className="flex items-center gap-3 text-[14px]">
                          <span className="w-12 font-display">{trim[1].toFixed(1)}s</span>
                          <input type="range" aria-label={t('Dulo', 'End')} min={0} max={duration || 30} step={0.1} value={trim[1]} disabled={!video} onChange={(e) => setTrim([trim[0], Math.max(Number(e.target.value), trim[0] + 1)])} className="flex-1 accent-[var(--c-primary)]" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-[15px]">
                          <Toggle label="English captions" checked={capEn} onChange={setCapEn} /> {t('Auto-caption sa English', 'Auto-captions in English')}
                        </label>
                        <label className="flex items-center gap-2 text-[15px]">
                          <Toggle label="Tagalog captions" checked={capTl} onChange={setCapTl} /> {t('Auto-caption sa Tagalog', 'Auto-captions in Tagalog')}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              {type === 'blog' && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Pamagat', 'Title')}</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={cn(field, 'text-[18px] font-semibold')} />
                  </label>
                  <div>
                    <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Laman', 'Body')}</span>
                    <div className="overflow-hidden rounded-[16px] border border-line">
                      <div className="flex gap-1 border-b border-line bg-sunken p-1.5 dark:bg-elevated" role="toolbar" aria-label={t('Format', 'Formatting')}>
                        {[
                          ['bold', <Bold size={18} key="b" />, 'Bold'],
                          ['italic', <Italic size={18} key="i" />, 'Italic'],
                          ['h2', <Heading2 size={18} key="h" />, 'Heading'],
                          ['list', <List size={18} key="l" />, 'List'],
                        ].map(([cmd, ic, l]) => (
                          <button
                            key={cmd as string}
                            type="button"
                            aria-label={l as string}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => (cmd === 'h2' ? document.execCommand('formatBlock', false, 'h2') : cmd === 'list' ? document.execCommand('insertUnorderedList') : document.execCommand(cmd as string))}
                            className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-surface"
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                      <div ref={editor} contentEditable role="textbox" aria-multiline aria-label={t('Laman ng blog', 'Blog body')} className="prose-sm min-h-[220px] p-4 text-[16px] leading-relaxed outline-none [&_h2]:font-display [&_h2]:text-[20px] [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6" suppressContentEditableWarning />
                    </div>
                  </div>
                </>
              )}
              {type !== 'blog' && (
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between font-display text-[14px] font-medium">
                    {type === 'reel' ? 'Caption' : t('Ano ang bago?', "What's new?")}
                    <button type="button" onClick={() => setHelper(true)} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-link xl:hidden">
                      <Sparkles size={16} /> {t('Tulungan akong sumulat', 'Help me write')}
                    </button>
                  </span>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2200} className={cn(field, 'h-auto resize-y py-3')} />
                  <span className="mt-1 block text-right text-[13px] text-fg-2">{text.length}/2200</span>
                </label>
              )}
              {type !== 'reel' && (
                <div>
                  <span className="mb-1.5 block font-display text-[14px] font-medium">{type === 'blog' ? 'Cover' : t('Mga larawan (hanggang 6)', 'Photos (up to 6)')}</span>
                  <div className="flex flex-wrap gap-2">
                    {media.map((m, i) => (
                      <div key={i} className="relative h-24 w-24 overflow-hidden rounded-[14px]">
                        <img src={m} alt="" className="h-full w-full object-cover" />
                        <button onClick={() => setMedia(media.filter((_, j) => j !== i))} aria-label={t('Tanggalin', 'Remove')} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    {media.length < (type === 'blog' ? 1 : 6) && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-line text-link">
                        <ImagePlus size={22} />
                        <span className="text-[12px] font-semibold">{t('Idagdag', 'Add')}</span>
                        <input type="file" accept="image/*" multiple={type !== 'blog'} className="hidden" onChange={async (e) => setMedia([...media, ...(await Promise.all(Array.from(e.target.files ?? []).map((f) => shrink(f))))].slice(0, type === 'blog' ? 1 : 6))} />
                      </label>
                    )}
                  </div>
                </div>
              )}
              {type === 'reel' && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 font-display text-[14px] font-medium">
                    <MapPin size={16} /> {t('Lokasyon', 'Location')}
                  </span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={field} />
                </label>
              )}
              {type !== 'blog' && (
                <label className="block">
                  <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Ikabit ang deal', 'Attach a deal')}</span>
                  <select value={dealId} disabled={!verified} onChange={(e) => setDealId(e.target.value)} className={field}>
                    <option value="">{verified ? t('Walang deal', 'No deal') : t('Bubukas pagka-verify', 'Unlocks after verification')}</option>
                    {d.deals
                      .filter((x) => x.status !== 'ended')
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.kind === 'b1t1' ? 'Buy 1 Take 1' : x.kind === 'discount' ? `${x.percent}% off` : 'Free add-on'} · {x.item}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <div className="flex items-center justify-between gap-3 rounded-[16px] bg-sunken p-3 dark:bg-elevated">
                <span className="flex items-center gap-2 text-[15px]">
                  <Facebook size={20} className="text-[#1877F2]" /> {t('I-post din sa Facebook page ko', 'Also post to my Facebook page')}
                </span>
                <Toggle label="Facebook" checked={fb} onChange={setFb} />
              </div>
              <div className="rounded-[16px] bg-sunken p-3 dark:bg-elevated">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px]">{t('I-schedule', 'Schedule')}</span>
                  <Toggle label={t('I-schedule', 'Schedule')} checked={schedule} onChange={setSchedule} />
                </div>
                {schedule && (
                  <div className="mt-2">
                    <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={field} aria-label={t('Petsa at oras', 'Date and time')} />
                    <p className="mt-1 text-[14px] text-fg-2">
                      {longDate(when, lang)} · {time12(when)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
          <div className="flex flex-wrap justify-end gap-2 pb-4">
            <Button variant="secondary" size="lg" onClick={() => save('draft')}>
              {t('I-save bilang draft', 'Save draft')}
            </Button>
            <Button size="lg" icon={<Send size={18} />} disabled={!canPublish} onClick={() => save(schedule ? 'scheduled' : 'published')}>
              {schedule ? t('I-schedule', 'Schedule') : t('I-publish', 'Publish')}
            </Button>
          </div>
        </div>
        <aside className="hidden space-y-4 xl:block">
          {preview}
          {helperPanel}
        </aside>
        <div className="space-y-4 xl:hidden">
          {helper && helperPanel}
          {preview}
        </div>
      </div>
    </main>
  )
}
