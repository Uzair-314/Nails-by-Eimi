import { Link } from 'react-router-dom'
import HeroCarousel from '../components/HeroCarousel'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import { ProductGridSkeleton, SectionHeading } from '../components/ui'
import { listProducts } from '../lib/api'
import useAsync from '../hooks/useAsync'
import { CATEGORY_LINKS } from '../data/navigation'

const PROMISES = [
  { icon: 'truck', title: 'Free UK delivery', body: 'On every order over £50, dispatched next working day.' },
  { icon: 'leaf', title: 'HEMA-free formulas', body: 'Gentler chemistry across the whole gel range.' },
  { icon: 'shield', title: '30-day returns', body: 'Unopened sets, no questions, prepaid label included.' },
  { icon: 'gift', title: 'Points on everything', body: 'Five points per £1, redeemable against any order.' },
]

function Shelf({ eyebrow, title, to, query }) {
  const { data, loading } = useAsync(() => listProducts(query), [JSON.stringify(query)])

  return (
    <section className="container-e mt-16">
      <SectionHeading eyebrow={eyebrow} title={title} to={to} />
      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {data.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
      <Link to={to} className="btn-ghost mt-6 w-full sm:hidden">
        View all
        <Icon name="arrowRight" size={16} />
      </Link>
    </section>
  )
}

export default function Home() {
  return (
    <div className="pb-4 pt-6">
      <HeroCarousel />

      {/* Category rail — the same taxonomy as the drawer, one tap from the fold. */}
      <section className="container-e mt-12">
        <SectionHeading eyebrow="Shop by" title="Categories" />
        <div className="rail sm:grid sm:grid-cols-5 sm:gap-5">
          {CATEGORY_LINKS.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="group card flex w-[42vw] shrink-0 snap-start flex-col items-center gap-3 px-4 py-6
                         text-center transition hover:-translate-y-0.5 hover:shadow-lift sm:w-auto"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-blush text-wine transition group-hover:bg-wine group-hover:text-white">
                <Icon name={cat.icon} size={24} />
              </span>
              <span className="text-[13px] font-medium leading-snug text-ink">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <Shelf eyebrow="Just landed" title="New Arrivals" to="/new-arrivals" query={{ sort: 'newest', limit: 4 }} />

      {/* Editorial band */}
      <section className="container-e mt-16">
        <div className="card grid items-center gap-8 overflow-hidden p-0 lg:grid-cols-2">
          <div className="order-2 px-7 py-10 lg:order-1 lg:px-12">
            <p className="eyebrow">The studio</p>
            <h2 className="mt-3 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[38px]">
              Sized to your hands, not a size chart
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Save a nail profile once — shape, length, finish and a size per finger — and every set you order is
              filed to match. It is the difference between a set that sits flush and one that lifts by Thursday.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/account/nail-profile" className="btn-primary">
                Build your nail profile
                <Icon name="arrowRight" size={16} />
              </Link>
              <Link to="/gel-nails" className="btn-ghost">Browse gel sets</Link>
            </div>
          </div>
          <div className="order-1 h-full lg:order-2">
            <img
              src="/media/p-champagne.svg"
              alt="Champagne shimmer press-on set"
              className="h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-[380px]"
            />
          </div>
        </div>
      </section>

      <Shelf eyebrow="Most loved" title="Bestsellers" to="/category/deals" query={{ sort: 'featured', limit: 4 }} />

      <section className="container-e mt-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <div key={item.title} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-wine">
                <Icon name={item.icon} size={19} />
              </span>
              <h3 className="mt-3.5 text-[14px] font-medium text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-e mt-16">
        <div className="card overflow-hidden bg-gradient-to-br from-wine-50 via-white to-wine-100/60 px-7 py-12 text-center sm:px-12">
          <p className="eyebrow justify-center">Eimi Club</p>
          <h2 className="mt-3 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[36px]">
            Five points for every £1 spent
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
            Members get early access to drops, free shipping from Gold, and a set on us every birthday.
          </p>
          <Link to="/rewards" className="btn-primary mx-auto mt-7">
            See the rewards
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
