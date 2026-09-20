import { useState } from 'react'
import Icon from '../components/Icon'
import { PageHeading } from '../components/ui'
import { sendContactMessage } from '../lib/api'
import { whatsappLink } from '../lib/format'
import { useStore } from '../context/StoreContext'
import { SITE } from '../data/site'

const TOPICS = ['An order', 'Sizing and fit', 'Trade / wholesale', 'Press and collabs', 'Something else']

/* No walk-in shop — contact is phone and email, both editable in the admin panel. */

export default function Contact() {
  const { toast, settings } = useStore()

  const whatsapp = settings.contact_whatsapp ?? SITE.whatsapp
  const email = settings.contact_email ?? SITE.email
  const details = [
    { icon: 'phone', title: 'WhatsApp', body: whatsapp, href: whatsappLink(whatsapp) },
    { icon: 'mail', title: 'Email', body: email, href: `mailto:${email}` },
    { icon: 'clock', title: 'Response time', body: 'Within one working day. Order issues are prioritised.' },
  ]
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await sendContactMessage(form)
      setSent(true)
      setForm({ name: '', email: '', topic: TOPICS[0], message: '' })
      toast('Message sent — we will reply within a day')
    } catch {
      toast('Could not send that message — please try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container-e py-12">
      <PageHeading
        eyebrow="Say hello"
        title="Contact Us"
        subtitle="Questions about an order, sizing or trade pricing — this reaches us directly."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="card p-6 sm:p-8">
          {sent && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-wine-50 p-4">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-wine" />
              <p className="text-[14px] leading-relaxed text-ink">
                Thanks — we have got your message. Expect a reply within one working day.
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Name</span>
              <input required value={form.name} onChange={update('name')} className="field" placeholder="Your name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Email</span>
              <input required type="email" value={form.email} onChange={update('email')} className="field" placeholder="you@example.com" />
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-[13px] font-medium text-ink">What is it about?</legend>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, topic }))}
                  aria-pressed={form.topic === topic}
                  className={`pill ${form.topic === topic ? 'pill-active' : ''}`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Message</span>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={update('message')}
              className="field resize-none"
              placeholder="Tell us what you need — include an order number if there is one."
            />
          </label>

          <button type="submit" disabled={sending} className="btn-primary mt-6 w-full sm:w-auto">
            {sending ? 'Sending…' : 'Send message'}
            {!sending && <Icon name="arrowRight" size={16} />}
          </button>
        </form>

        <div className="space-y-4">
          {details.map((item) => {
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush text-wine">
                  <Icon name={item.icon} size={18} />
                </span>
                <div>
                  <h2 className="text-[14px] font-medium text-ink">{item.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.body}</p>
                </div>
              </>
            )
            return item.href ? (
              <a
                key={item.title}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="card flex gap-4 p-5 transition hover:shadow-lift"
              >
                {inner}
              </a>
            ) : (
              <div key={item.title} className="card flex gap-4 p-5">{inner}</div>
            )
          })}

          <div className="card p-5">
            <h2 className="text-[14px] font-medium text-ink">Online only</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              We ship across Pakistan from our workroom. There is no walk-in shop, so message us and we will sort
              anything you need from there.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
