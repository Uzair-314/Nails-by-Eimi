import { useState } from 'react'
import Icon from '../components/Icon'
import { PageHeading } from '../components/ui'
import { sendContactMessage } from '../lib/api'
import { useStore } from '../context/StoreContext'

const TOPICS = ['An order', 'Sizing and fit', 'Trade / wholesale', 'Press and collabs', 'Something else']

const DETAILS = [
  { icon: 'pin', title: 'Studio', body: 'Unit 9, Peckham Levels\n95a Rye Lane, London SE15 4ST' },
  { icon: 'mail', title: 'Email', body: 'hello@nailsbyeimi.com\nTrade: wholesale@nailsbyeimi.com' },
  { icon: 'phone', title: 'Phone', body: '+44 20 7946 0813\nTue–Sat, 10:00–18:00' },
  { icon: 'clock', title: 'Response time', body: 'Within one working day.\nOrder issues are prioritised.' },
]

export default function Contact() {
  const { toast } = useStore()
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
        subtitle="Questions about an order, sizing or trade pricing — this reaches the studio directly."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="card p-6 sm:p-8">
          {sent && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-wine-50 p-4">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-wine" />
              <p className="text-[14px] leading-relaxed text-ink">
                Thanks — your message is with the studio. Expect a reply within one working day.
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
          {DETAILS.map((item) => (
            <div key={item.title} className="card flex gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush text-wine">
                <Icon name={item.icon} size={18} />
              </span>
              <div>
                <h2 className="text-[14px] font-medium text-ink">{item.title}</h2>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </div>
          ))}

          <div className="card overflow-hidden p-0">
            <img src="/media/slide-2.svg" alt="The Nails By Eimi studio" className="h-40 w-full object-cover" />
            <div className="p-5">
              <h2 className="text-[14px] font-medium text-ink">Visit by appointment</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Bespoke fittings and trade pickups run Tuesday to Saturday. Email to book a slot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
