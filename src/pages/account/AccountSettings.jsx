import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { PageHeading, Skeleton } from '../../components/ui'
import { getUser, updateUser } from '../../lib/api'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'

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
        <ChangePassword />
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

/**
 * Changing the account password.
 *
 * Also the landing spot for a recovery link, which signs the customer in and
 * then leaves it to the app to ask for the new password — without this form
 * the link only ever logged them in and changed nothing.
 */
function ChangePassword() {
  const { recovery, changePassword } = useAuth()
  const { toast } = useStore()

  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Arriving from the email link opens the form without being asked.
  useEffect(() => { if (recovery) setOpen(true) }, [recovery])

  // Typed twice: a typo is not discovered until the next sign-in, by which
  // point the only way back in is another recovery email.
  const mismatch = confirm.length > 0 && password !== confirm

  const submit = async (e) => {
    e.preventDefault()
    if (mismatch) return
    setBusy(true)
    setError(null)
    try {
      await changePassword(password)
      setPassword('')
      setConfirm('')
      setOpen(false)
      toast('Password changed')
    } catch (err) {
      // Supabase names the rule that failed; a generic message would leave the
      // person guessing at what to fix.
      setError(err.message ?? 'Could not change the password')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Change the password you sign in with.
        </p>
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost mt-4">
          Change password
        </button>
      </>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4">
      {recovery && (
        <p className="mb-4 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          You are signed in from the link in your email. Choose a new password to finish.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">New password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="field"
            placeholder="At least 8 characters"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">Type it again</span>
          <input
            required
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="field"
            placeholder="The same password"
          />
          {mismatch && <span className="mt-1.5 block text-[12px] text-wine">These two do not match.</span>}
        </label>
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-wine" />
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={busy || mismatch || !password} className="btn-primary disabled:opacity-50">
          {busy ? 'Saving…' : 'Save new password'}
        </button>
        {!recovery && (
          <button type="button" onClick={() => { setOpen(false); setError(null) }} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
