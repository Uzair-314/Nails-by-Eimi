import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { Badge, PageHeading, Skeleton } from '../../components/ui'
import { getUser, listPointHistory, redeemReward } from '../../lib/api'
import { REWARD_TIERS, SEED_REWARDS } from '../../data/account'
import { formatDate, formatPoints } from '../../lib/format'
import { useStore } from '../../context/StoreContext'

const TABS = ['Rewards', 'Tiers', 'Activity']

/** Donut progress ring toward the next tier. */
function ProgressRing({ value, max, size = 132, stroke = 11 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(1, max === 0 ? 1 : value / max)

  return (
    <svg width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)} percent to the next tier`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0E4E2" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#8B4550" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }}
      />
      <text x="50%" y="47%" textAnchor="middle" className="fill-ink font-display" fontSize="24" fontWeight="600">
        {Math.round(pct * 100)}%
      </text>
      <text x="50%" y="63%" textAnchor="middle" className="fill-[#8A7378]" fontSize="11">to next tier</text>
    </svg>
  )
}

export default function RewardsLoyalty() {
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState(null)
  const [tab, setTab] = useState('Rewards')
  const [busy, setBusy] = useState(null)
  const { toast } = useStore()

  useEffect(() => {
    getUser().then(setUser)
    listPointHistory().then(setHistory)
  }, [])

  const redeem = async (reward) => {
    setBusy(reward.id)
    try {
      setUser(await redeemReward(reward))
      setHistory(await listPointHistory())
      toast(`Redeemed: ${reward.title}`)
    } catch {
      toast('Not enough points for that reward yet')
    } finally {
      setBusy(null)
    }
  }

  if (!user) {
    return (
      <div>
        <PageHeading eyebrow="Eimi Club privileges" title="Rewards & Loyalty" />
        <Skeleton className="mt-7 h-64 w-full rounded-card" />
      </div>
    )
  }

  const target = user.points + user.pointsToNextTier

  return (
    <div>
      <PageHeading
        eyebrow={`Eimi Club privileges · member since ${user.memberSince}`}
        title="Rewards & Loyalty"
        subtitle="Five points for every £1 spent. Redeem them against anything in the store."
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="card flex flex-wrap items-center gap-8 p-6 sm:p-8">
          <ProgressRing value={user.points} max={target} />

          <div className="min-w-[200px] flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-[26px] font-semibold text-ink">{user.tier}</h2>
              <Badge>Active</Badge>
            </div>
            <p className="mt-4 font-display text-[40px] font-semibold leading-none text-wine">
              {formatPoints(user.points)}
            </p>
            <p className="text-[13px] text-muted">points available to spend</p>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Earn <strong className="font-medium text-ink">{formatPoints(user.pointsToNextTier)}</strong> more points
              to reach <strong className="font-medium text-ink">{user.nextTier}</strong>.
            </p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-[20px] font-semibold text-ink">Your perks</h2>
          <ul className="mt-4 space-y-3">
            {(REWARD_TIERS.find((t) => t.name === user.tier)?.perk ?? '')
              .split(', ')
              .map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-[14px] text-ink">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-wine" />
                  <span className="capitalize">{perk}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <div className="mt-8">
        <div className="inline-flex rounded-full bg-blush p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={[
                'rounded-full px-5 py-2 text-[14px] transition',
                tab === t ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-wine',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === 'Rewards' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {SEED_REWARDS.map((reward) => {
                const affordable = user.points >= reward.cost
                return (
                  <article key={reward.id} className="card flex flex-col p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-wine">
                      <Icon name="gift" size={18} />
                    </span>
                    <h3 className="mt-3.5 text-[15px] font-medium text-ink">{reward.title}</h3>
                    <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted">{reward.blurb}</p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-[14px] font-semibold text-wine">{formatPoints(reward.cost)} pts</span>
                      <button
                        type="button"
                        disabled={!affordable || busy === reward.id}
                        onClick={() => redeem(reward)}
                        className="btn-primary !py-2 text-[13px]"
                      >
                        {busy === reward.id ? 'Redeeming…' : affordable ? 'Redeem' : 'Not yet'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {tab === 'Tiers' && (
            <div className="grid gap-4 sm:grid-cols-3">
              {REWARD_TIERS.map((tier) => {
                const current = tier.name === user.tier
                return (
                  <article
                    key={tier.name}
                    className={`card p-5 ${current ? 'border-wine bg-wine-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-[20px] font-semibold text-ink">{tier.name}</h3>
                      {current && <Badge>You</Badge>}
                    </div>
                    <p className="mt-1 text-[13px] text-muted">
                      {tier.threshold === 0 ? 'From your first order' : `${formatPoints(tier.threshold)} points`}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-ink">{tier.perk}</p>
                  </article>
                )
              })}
            </div>
          )}

          {tab === 'Activity' && (
            <div className="card divide-y divide-line p-0">
              {!history ? (
                <div className="p-5"><Skeleton className="h-24 w-full" /></div>
              ) : history.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted">No points activity yet.</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-4">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${entry.points < 0 ? 'bg-line/70 text-muted' : 'bg-blush text-wine'}`}>
                      <Icon name={entry.points < 0 ? 'gift' : 'plus'} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-ink">{entry.label}</span>
                      <span className="text-[12px] text-muted">{formatDate(entry.date)}</span>
                    </span>
                    <span className={`text-[14px] font-medium tabular-nums ${entry.points < 0 ? 'text-muted' : 'text-wine'}`}>
                      {entry.points > 0 ? '+' : ''}{formatPoints(entry.points)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
