import Icon from './Icon'
import { whatsappLink } from '../lib/format'
import { SITE } from '../data/site'
import { useStore } from '../context/StoreContext'

/**
 * Black information bar, under the announcements and above the header.
 *
 * Phone: two lines — contacts on the first, the minimum order centred on the
 * second. Laptop and up: one row, phone left, minimum exactly centred, email
 * right. The centring uses three equal columns rather than flex spacing, so the
 * middle stays dead centre however long the phone number and email happen to
 * be; with `justify-between` a longer email would push it off centre.
 *
 * The phone number is also the WhatsApp number, hence the one icon for both.
 */
export default function TopBar() {
  const { settings } = useStore()

  const whatsapp = settings.contact_whatsapp ?? SITE.whatsapp
  const email = settings.contact_email ?? SITE.email
  const notice = settings.announcement ?? SITE.minimumOrder

  const phoneLink = (
    <a
      href={whatsappLink(whatsapp)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] leading-none text-white/90 transition hover:text-white"
    >
      <Icon name="whatsapp" size={14} className="shrink-0 text-wine-300" />
      {whatsapp}
    </a>
  )

  const emailLink = (
    <a
      href={`mailto:${email}`}
      className="inline-flex items-center gap-1.5 text-[12px] leading-none text-white/90 transition hover:text-white"
    >
      <Icon name="mail" size={14} className="shrink-0 text-wine-300" />
      <span className="truncate">{email}</span>
    </a>
  )

  return (
    <div className="border-b border-white/10 bg-ink text-white">
      <div className="mx-auto max-w-[1200px] px-4">
        {/* Phone: contacts on one line, notice beneath. */}
        <div className="py-2 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            {phoneLink}
            {emailLink}
          </div>
          <p className="mt-1.5 text-center text-[11px] leading-none text-white/70">
            <Notice text={notice} />
          </p>
        </div>

        {/* Laptop and up: one row, three equal columns. */}
        <div className="hidden h-9 grid-cols-3 items-center lg:grid">
          <div className="justify-self-start">{phoneLink}</div>
          <p className="justify-self-center whitespace-nowrap text-[12px] leading-none text-white/70">
            <Notice text={notice} />
          </p>
          <div className="justify-self-end">{emailLink}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Picks the money out of the notice and brightens it.
 *
 * The amount is the part anyone actually needs, and it is the part that gets
 * skimmed past in a line of grey text. Matching on the figure rather than
 * hardcoding it keeps this working when the minimum is changed in the admin,
 * and the whole line is rendered plainly when there is no figure to find.
 */
function Notice({ text }) {
  const match = String(text ?? '').match(/(Rs\.?\s?[\d,]+(?:\.\d+)?)/i)
  if (!match) return text

  const [before, after] = String(text).split(match[1])
  return (
    <>
      {before}
      <span className="font-semibold text-wine-200">{match[1]}</span>
      {after}
    </>
  )
}
