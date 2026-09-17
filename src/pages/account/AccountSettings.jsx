import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { PageHeading, Skeleton } from '../../components/ui'
import { getUser, updateUser } from '../../lib/api'
import { useStore } from '../../context/StoreContext'

const PREFERENCES = [
  { key: 'emailDrops', title: 'New drop alerts', body: 'An email when a collection goes live.' },
  { key: 'emailOrders', title: 'Order updates', body: 'Dispatch and delivery notifications.' },
  { key: 'smsOrders', title: 'SMS delivery updates', body: 'A text on the morning of delivery.' },
  { key: 'pointsDigest', title: 'Monthly points digest', body: 'What you earned and what you can redeem.' },
]

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-wine' : 'bg-line'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}

export default function AccountSettings() {
  const [user, setUser] = useState(null)
  const [prefs, setPrefs] = useState({ emailDrops: true, emailOrders: true, smsOrders: false, pointsDigest: true })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { toast } = useStore()

  useEffect(() => { getUser().then((u) => { setUser(u); if (u.prefs) setPrefs(u.prefs) }) }, [])

  const update = (key) => (e) => setUser((u) => ({ ...u, [key]: e.target.value }))

  const saveDetails = async (e) => {
    e.preventDefault()
    setSaving(true)
    setUser(await updateUser({ ...user, prefs }))
    setSaving(false)
    toast('Account details saved')
  }

  const setPref = async (key, value) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    await updateUser({ prefs: next })
  }

  if (!user) {
    return (
      <div>
        <PageHeading eyebrow="Preferences and security" title="Account Settings" />
        <Skeleton className="mt-7 h-80 w-full rounded-card" />
      </div>
    )
  }

  return (
    <div>
      <PageHeading
        eyebrow="Preferences and security"
        title="Account Settings"
        subtitle="Your details, what we email you about, and how to close the account."
      />

      <form onSubmit={saveDetails} className="card mt-7 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-wine">
            <Icon name="user" size={18} />
          </span>
          <h2 className="font-display text-[20px] font-semibold text-ink">Personal details</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">First name</span>
            <input required value={user.firstName} onChange={update('firstName')} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Last name</span>
            <input required value={user.lastName} onChange={update('lastName')} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Email</span>
            <input required type="email" value={user.email} onChange={update('email')} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Phone</span>
            <input value={user.phone} onChange={update('phone')} className="field" />
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary mt-6">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="card mt-6 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-wine">
            <Icon name="mail" size={18} />
          </span>
          <h2 className="font-display text-[20px] font-semibold text-ink">Notifications</h2>
        </div>

        <ul className="mt-5 divide-y divide-line">
          {PREFERENCES.map((pref) => (
            <li key={pref.key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="flex-1">
                <p className="text-[14px] font-medium text-ink">{pref.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{pref.body}</p>
              </div>
              <Toggle
                checked={prefs[pref.key]}
                onChange={(v) => setPref(pref.key, v)}
                label={pref.title}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-6 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-wine">
            <Icon name="shield" size={18} />
          </span>
          <h2 className="font-display text-[20px] font-semibold text-ink">Security</h2>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Password and two-factor settings are handled by the auth provider and will be wired up alongside sign-in.
        </p>
        <button type="button" onClick={() => toast('Sign-in is not wired up in this build')} className="btn-ghost mt-4">
          Change password
        </button>
      </section>

      <section className="mt-6 rounded-card border border-red-200 bg-red-50/60 p-6">
        <h2 className="font-display text-[20px] font-semibold text-red-900">Close account</h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-red-900/70">
          This removes your saved addresses, nail profile and points balance. Orders already placed are kept for our
          records. This cannot be undone.
        </p>

        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); toast('Account closure is disabled in this demo build') }}
              className="btn rounded-lg bg-red-700 text-white hover:bg-red-800"
            >
              Yes, close my account
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost">Cancel</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn mt-4 rounded-lg border border-red-300 bg-white text-red-800 hover:bg-red-100"
          >
            <Icon name="trash" size={16} />
            Close account
          </button>
        )}
      </section>
    </div>
  )
}
