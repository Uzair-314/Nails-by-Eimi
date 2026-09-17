import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import useAsync from '../../hooks/useAsync'
import { getUser } from '../../lib/api'
import { useStore } from '../../context/StoreContext'

const ACCOUNT_NAV = [
  { to: '/account', label: 'Dashboard Home', icon: 'home', end: true },
  { to: '/account/orders', label: 'My Orders', icon: 'bag' },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'heart' },
  { to: '/account/addresses', label: 'Saved Addresses', icon: 'pin' },
  { to: '/account/payment', label: 'Payment Methods', icon: 'card' },
  { to: '/account/nail-profile', label: 'Nail Profile', icon: 'nail' },
  { to: '/account/rewards', label: 'Rewards / Loyalty', icon: 'gift' },
  { to: '/account/settings', label: 'Account Settings', icon: 'settings' },
]

/**
 * Account shell: a persistent rail on desktop, a horizontal scroller on mobile.
 * Mirrors the sidebar from the reference dashboard screens.
 */
export default function AccountLayout() {
  const { data: user } = useAsync(getUser, [])
  const { toast } = useStore()
  const navigate = useNavigate()

  const rowClass = ({ isActive }) =>
    [
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition duration-200',
      isActive ? 'bg-wine text-white shadow-card' : 'text-ink hover:bg-white hover:text-wine',
    ].join(' ')

  const signOut = () => {
    toast('Signed out of the demo account')
    navigate('/')
  }

  return (
    <div className="container-e py-8">
      <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] bg-blush p-3 lg:p-4">
            <div className="flex items-center gap-3 px-2 pb-4 pt-1">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[15px] font-semibold text-white"
                style={{ background: user?.avatarTone ?? '#E7AFC0' }}
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

            {/* Mobile: horizontal rail. Desktop: vertical list. */}
            <nav aria-label="Account">
              <ul
                className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0"
                style={{ scrollbarWidth: 'none' }}
              >
                {ACCOUNT_NAV.map((item) => (
                  <li key={item.to} className="shrink-0 lg:shrink">
                    <NavLink to={item.to} end={item.end} className={rowClass}>
                      <Icon name={item.icon} size={19} className="shrink-0 opacity-80" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
                <li className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink
                               transition hover:bg-white hover:text-wine"
                  >
                    <Icon name="logout" size={19} className="shrink-0 opacity-80" />
                    <span className="whitespace-nowrap">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
