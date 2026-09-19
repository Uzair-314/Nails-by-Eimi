import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import useAsync from '../../hooks/useAsync'
import { getUser } from '../../lib/api'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_URL } from '../../lib/adminLink'

const ACCOUNT_NAV = [
  { to: '/account', label: 'Dashboard', icon: 'home', end: true },
  { to: '/account/orders', label: 'My Orders', icon: 'bag' },
  { to: '/account/history', label: 'History', icon: 'clock' },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'heart' },
  { to: '/account/addresses', label: 'Addresses', icon: 'pin' },
  { to: '/account/payment', label: 'Payment', icon: 'card' },
  { to: '/account/nail-profile', label: 'Nail Profile', icon: 'nail' },
  { to: '/account/rewards', label: 'Rewards', icon: 'gift' },
  { to: '/account/settings', label: 'Settings', icon: 'settings' },
]

/**
 * Account shell. The site sidebar already occupies the left edge, so the
 * account sections run as a horizontal strip above the content rather than a
 * second rail — at every width, not just on mobile.
 */
export default function AccountLayout() {
  const { data: user } = useAsync(getUser, [])
  const { toast } = useStore()
  const { signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out')
    navigate('/')
  }

  return (
    <div className="container-e py-8">
      <div className="rounded-[18px] bg-blush p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-4 pt-1">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[15px] font-semibold text-white"
              style={{ background: user?.avatarTone ?? '#F94D8E' }}
            >
              {(user?.firstName?.[0] ?? 'A') + (user?.lastName?.[0] ?? '')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-ink">
                {user ? `${user.firstName} ${user.lastName}` : 'Your account'}
              </p>
              <p className="truncate text-[11px] text-rose">{user ? `${user.tier} member` : '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Only rendered for admins; the database blocks everyone else regardless. */}
            {isAdmin && ADMIN_URL && (
              <a href={ADMIN_URL} target="_blank" rel="noreferrer" className="btn-primary !py-2 text-[13px]">
                <Icon name="settings" size={16} />
                Admin panel
              </a>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] text-muted
                         transition hover:bg-white hover:text-wine"
            >
              <Icon name="logout" size={17} />
              Logout
            </button>
          </div>
        </div>

        <nav aria-label="Account">
          <ul className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ACCOUNT_NAV.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[14px] transition duration-200',
                      isActive ? 'bg-wine text-white shadow-card' : 'text-ink hover:bg-white hover:text-wine',
                    ].join(' ')
                  }
                >
                  <Icon name={item.icon} size={17} className="shrink-0 opacity-80" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-8 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
