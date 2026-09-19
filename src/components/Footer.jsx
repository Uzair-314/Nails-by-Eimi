import { Link } from 'react-router-dom'
import Icon from './Icon'
import { MENU_LINKS } from '../data/navigation'
import { useCategoryTree } from './NavSections'
import { SITE } from '../data/site'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../lib/format'

export default function Footer() {
  const categories = useCategoryTree()
  const { settings, shippingRules } = useStore()

  const whatsapp = settings.contact_whatsapp ?? SITE.whatsapp
  const email = settings.contact_email ?? SITE.email

  return (
    <footer className="mt-20 border-t border-line bg-blush/60">
      <div className="container-e py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-[24px] font-semibold text-wine">Nails By Eimi</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-rose">Press-on Atelier</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Hand-finished press-on sets, salon-grade gel and trade supplies — made in a small studio in South London.
            </p>
            <div className="mt-5 flex gap-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
                 className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted transition hover:text-wine">
                <Icon name="instagram" size={17} />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok"
                 className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted transition hover:text-wine">
                <Icon name="tiktok" size={17} />
              </a>
            </div>
          </div>

          <nav aria-label="Menu">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose">Menu</h2>
            <ul className="mt-4 space-y-2.5">
              {MENU_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-muted transition hover:text-wine">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Categories">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose">Categories</h2>
            <ul className="mt-4 space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/category/${cat.slug}`} className="text-sm text-muted transition hover:text-wine">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>
                <a
                  href={`https://wa.me/${String(whatsapp).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2.5 transition hover:text-wine"
                >
                  <Icon name="phone" size={16} className="mt-0.5 shrink-0" />
                  {whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-start gap-2.5 transition hover:text-wine">
                  <Icon name="mail" size={16} className="mt-0.5 shrink-0" />
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-[12px] text-muted">© {new Date().getFullYear()} Nails By Eimi. All rights reserved.</p>
          <p className="text-[12px] text-muted">{`Free delivery over ${formatPrice(shippingRules.freeOver)}`} · 30-day returns</p>
        </div>
      </div>
    </footer>
  )
}
