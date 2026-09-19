import Icon from './Icon'
import { SITE } from '../data/site'

/**
 * Black information bar across the top of every page: contact details on one
 * row, the minimum-order notice beneath. On wide screens both sit on one line,
 * since there is room for them.
 */
export default function TopBar() {
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-1 px-4 py-2.5 text-center sm:flex-row sm:justify-center sm:gap-6 sm:py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a
            href={`https://wa.me/${SITE.whatsappLink}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] leading-none text-white/90 transition hover:text-white"
          >
            <Icon name="phone" size={13} className="shrink-0" />
            {SITE.whatsapp}
          </a>

          <a
            href={`mailto:${SITE.email}`}
            className="inline-flex items-center gap-1.5 text-[12px] leading-none text-white/90 transition hover:text-white"
          >
            <Icon name="mail" size={13} className="shrink-0" />
            {SITE.email}
          </a>
        </div>

        <p className="text-[11px] leading-none text-white/70">{SITE.minimumOrder}</p>
      </div>
    </div>
  )
}
