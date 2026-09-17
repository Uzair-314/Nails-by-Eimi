import { Link } from 'react-router-dom'
import Icon from './Icon'
import { CATEGORY_LINKS, MENU_LINKS } from '../data/navigation'

export default function Footer() {
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
              {CATEGORY_LINKS.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/category/${cat.slug}`} className="text-sm text-muted transition hover:text-wine">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose">Studio</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <Icon name="pin" size={16} className="mt-0.5 shrink-0" />
                Unit 9, Peckham Levels, London SE15
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="mail" size={16} className="mt-0.5 shrink-0" />
                hello@nailsbyeimi.com
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="clock" size={16} className="mt-0.5 shrink-0" />
                Tue–Sat, 10:00–18:00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-[12px] text-muted">© {new Date().getFullYear()} Nails By Eimi. All rights reserved.</p>
          <p className="text-[12px] text-muted">Free UK delivery over £50 · 30-day returns</p>
        </div>
      </div>
    </footer>
  )
}
