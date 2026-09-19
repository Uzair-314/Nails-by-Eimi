import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

export default function Login() {
  const [mode, setMode] = useState('signin') // signin | signup | reset
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const { signIn, signUp, resetPassword } = useAuth()
  const { toast } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const next = location.state?.from ?? '/account'

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signin') {
        await signIn(form)
        toast('Signed in')
        navigate(next, { replace: true })
      } else if (mode === 'signup') {
        const { needsConfirmation } = await signUp(form)
        if (needsConfirmation) {
          setNotice('Check your email to confirm the address, then sign in.')
          setMode('signin')
        } else {
          toast('Welcome to Nails By Eimi')
          navigate(next, { replace: true })
        }
      } else {
        await resetPassword(form.email)
        setNotice('If that address has an account, a reset link is on its way.')
        setMode('signin')
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    signin: { eyebrow: 'Welcome back', title: 'Sign in', cta: 'Sign in' },
    signup: { eyebrow: 'Join the club', title: 'Create an account', cta: 'Create account' },
    reset: { eyebrow: 'Forgotten it?', title: 'Reset your password', cta: 'Send reset link' },
  }[mode]

  return (
    <div className="container-e flex justify-center py-14">
      <div className="w-full max-w-[420px]">
        <div className="text-center">
          <p className="eyebrow justify-center">{titles.eyebrow}</p>
          <h1 className="mt-3 font-display text-[32px] font-semibold text-ink">{titles.title}</h1>
        </div>

        <form onSubmit={submit} className="card mt-7 p-6">
          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
              <Icon name="info" size={15} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {notice && (
            <p className="mb-4 flex items-start gap-2 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] text-ink">
              <Icon name="check" size={15} className="mt-0.5 shrink-0 text-wine" />
              {notice}
            </p>
          )}

          {mode === 'signup' && (
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-ink">First name</span>
                <input required value={form.firstName} onChange={update('firstName')} className="field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-ink">Last name</span>
                <input required value={form.lastName} onChange={update('lastName')} className="field" />
              </label>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              className="field"
              placeholder="you@example.com"
            />
          </label>

          {mode !== 'reset' && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Password</span>
              <input
                required
                minLength={6}
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={update('password')}
                className="field"
                placeholder="At least 6 characters"
              />
            </label>
          )}

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Just a moment…' : titles.cta}
          </button>

          <div className="mt-5 space-y-2 text-center text-[13px] text-muted">
            {mode === 'signin' && (
              <>
                <p>
                  New here?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-wine hover:underline">
                    Create an account
                  </button>
                </p>
                <p>
                  <button type="button" onClick={() => setMode('reset')} className="text-wine hover:underline">
                    Forgotten your password?
                  </button>
                </p>
              </>
            )}
            {mode !== 'signin' && (
              <p>
                <button type="button" onClick={() => setMode('signin')} className="text-wine hover:underline">
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted">
          <Link to="/" className="hover:text-wine">Continue browsing without an account</Link>
        </p>
      </div>
    </div>
  )
}
