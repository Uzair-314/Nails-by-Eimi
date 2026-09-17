import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { Badge, EmptyState, PageHeading, Skeleton } from '../../components/ui'
import { deleteAddress, listAddresses, saveAddress } from '../../lib/api'
import { useStore } from '../../context/StoreContext'

const BLANK = {
  label: '', name: '', line1: '', line2: '', city: '', postcode: '',
  country: 'United Kingdom', phone: '', isDefault: false,
}

export default function SavedAddresses() {
  const [addresses, setAddresses] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | address id
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const { toast } = useStore()

  useEffect(() => { listAddresses().then(setAddresses) }, [])

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const startNew = () => { setForm(BLANK); setEditing('new') }
  const startEdit = (address) => { setForm(address); setEditing(address.id) }
  const cancel = () => { setEditing(null); setForm(BLANK) }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const next = await saveAddress(editing === 'new' ? { ...form, id: undefined } : form)
    setAddresses(next)
    setSaving(false)
    cancel()
    toast(editing === 'new' ? 'Address added' : 'Address updated')
  }

  const remove = async (id) => {
    setAddresses(await deleteAddress(id))
    toast('Address removed')
  }

  const makeDefault = async (address) => {
    setAddresses(await saveAddress({ ...address, isDefault: true }))
    toast(`${address.label} is now your default`)
  }

  return (
    <div>
      <PageHeading
        eyebrow="Where it ships"
        title="Saved Addresses"
        subtitle="Keep your home and studio addresses ready for a one-tap checkout."
        action={
          !editing && (
            <button type="button" onClick={startNew} className="btn-primary">
              <Icon name="plus" size={16} />
              Add address
            </button>
          )
        }
      />

      {editing && (
        <form onSubmit={submit} className="card mt-7 p-6">
          <h2 className="font-display text-[20px] font-semibold text-ink">
            {editing === 'new' ? 'New address' : 'Edit address'}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Label</span>
              <input required value={form.label} onChange={update('label')} className="field" placeholder="Home, Studio…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Full name</span>
              <input required value={form.name} onChange={update('name')} className="field" placeholder="Recipient name" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Address line 1</span>
              <input required value={form.line1} onChange={update('line1')} className="field" placeholder="Street address" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Address line 2</span>
              <input value={form.line2} onChange={update('line2')} className="field" placeholder="Flat, unit (optional)" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">City</span>
              <input required value={form.city} onChange={update('city')} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Postcode</span>
              <input required value={form.postcode} onChange={update('postcode')} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Country</span>
              <input required value={form.country} onChange={update('country')} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Phone</span>
              <input value={form.phone} onChange={update('phone')} className="field" placeholder="For delivery updates" />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-2.5 text-[14px] text-ink">
            <input type="checkbox" checked={form.isDefault} onChange={update('isDefault')} className="h-4 w-4 accent-[#8B4550]" />
            Use as my default delivery address
          </label>

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save address'}
            </button>
            <button type="button" onClick={cancel} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {!addresses ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-card" />)
        ) : addresses.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon="pin"
              title="No addresses saved"
              body="Add one so checkout takes a single tap."
              action={<button type="button" onClick={startNew} className="btn-primary">Add address</button>}
            />
          </div>
        ) : (
          addresses.map((address) => (
            <article key={address.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-blush text-wine">
                    <Icon name="pin" size={17} />
                  </span>
                  <h2 className="text-[15px] font-medium text-ink">{address.label}</h2>
                </div>
                {address.isDefault && <Badge>Default</Badge>}
              </div>

              <address className="mt-4 flex-1 text-[13px] not-italic leading-relaxed text-muted">
                {address.name}<br />
                {address.line1}{address.line2 && <>, {address.line2}</>}<br />
                {address.city} {address.postcode}<br />
                {address.country}
                {address.phone && <><br />{address.phone}</>}
              </address>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(address)} className="btn-ghost !py-2 text-[13px]">Edit</button>
                {!address.isDefault && (
                  <button type="button" onClick={() => makeDefault(address)} className="btn-quiet !py-2 text-[13px]">
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(address.id)}
                  className="btn-quiet !py-2 text-[13px] hover:!bg-red-50 hover:!text-red-700"
                >
                  <Icon name="trash" size={15} />
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
