import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { PageHeading, Skeleton } from '../../components/ui'
import { getNailProfile, saveNailProfile } from '../../lib/api'
import { useStore } from '../../context/StoreContext'

const SHAPES = ['Almond', 'Square', 'Coffin', 'Oval', 'Stiletto']
const LENGTHS = ['Short', 'Medium', 'Long']
const FINISHES = ['Glossy', 'Matte', 'Chrome']
const FINGERS = [
  { key: 'thumb', label: 'Thumb' },
  { key: 'index', label: 'Index' },
  { key: 'middle', label: 'Middle' },
  { key: 'ring', label: 'Ring' },
  { key: 'pinky', label: 'Pinky' },
]

export default function NailProfile() {
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useStore()

  useEffect(() => { getNailProfile().then(setProfile) }, [])

  const set = (patch) => setProfile((p) => ({ ...p, ...patch }))
  const setSize = (finger, value) =>
    setProfile((p) => ({ ...p, sizes: { ...p.sizes, [finger]: Number(value) } }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await saveNailProfile(profile)
    setSaving(false)
    toast('Nail profile saved')
  }

  if (!profile) {
    return (
      <div>
        <PageHeading eyebrow="Made to fit" title="Nail Profile" />
        <Skeleton className="mt-7 h-96 w-full rounded-card" />
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <PageHeading
        eyebrow="Made to fit"
        title="Nail Profile"
        subtitle="Save it once and every set you order is filed to these measurements."
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Shape and finish</h2>

            {[
              { label: 'Shape', options: SHAPES, value: profile.shape, key: 'shape' },
              { label: 'Length', options: LENGTHS, value: profile.length, key: 'length' },
              { label: 'Finish', options: FINISHES, value: profile.finish, key: 'finish' },
            ].map((group) => (
              <fieldset key={group.key} className="mt-5 first:mt-4">
                <legend className="mb-2.5 text-[13px] font-medium text-ink">{group.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => set({ [group.key]: option })}
                      aria-pressed={group.value === option}
                      className={`pill ${group.value === option ? 'pill-active' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </section>

          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Sizes per finger</h2>
            <p className="mt-1 text-[13px] text-muted">
              Size 0 is the widest, 9 the narrowest. Measure across the widest point of each nail bed.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {FINGERS.map((finger) => (
                <label key={finger.key} className="block">
                  <span className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink">{finger.label}</span>
                    <span className="rounded-full bg-blush px-2.5 py-0.5 font-medium text-wine tabular-nums">
                      {profile.sizes[finger.key]}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={profile.sizes[finger.key]}
                    onChange={(e) => setSize(finger.key, e.target.value)}
                    className="w-full accent-[#E01B6A]"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Notes for your order</h2>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Allergies and sensitivities</span>
              <input
                value={profile.allergies}
                onChange={(e) => set({ allergies: e.target.value })}
                className="field"
                placeholder="e.g. HEMA sensitivity"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Anything else</span>
              <textarea
                rows={4}
                value={profile.notes}
                onChange={(e) => set({ notes: e.target.value })}
                className="field resize-none"
                placeholder="Preferences, things to avoid, upcoming occasions…"
              />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Your profile</h2>
            <dl className="mt-4 space-y-3 text-[14px]">
              {[
                ['Shape', profile.shape],
                ['Length', profile.length],
                ['Finish', profile.finish],
                ['Sizes', FINGERS.map((f) => profile.sizes[f.key]).join(' · ')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {profile.allergies && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-blush px-3.5 py-2.5 text-[12px] leading-relaxed text-ink">
                <Icon name="info" size={14} className="mt-0.5 shrink-0 text-wine" />
                {profile.allergies}
              </p>
            )}

            <button type="submit" disabled={saving} className="btn-primary mt-5 w-full">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </aside>
      </div>
    </form>
  )
}
