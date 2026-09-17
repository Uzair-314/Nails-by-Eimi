import ProductListing from '../components/ProductListing'

export default function NewArrivals() {
  return (
    <ProductListing
      eyebrow="Just landed"
      title="New Arrivals"
      subtitle="The most recent additions to the studio — sets, shades and supplies, newest first."
      defaultSort="newest"
      filters={[
        { value: 'press-on', label: 'Press-on sets' },
        { value: 'gel', label: 'Gel polish' },
        { value: 'pro', label: 'Pro supplies' },
      ]}
    />
  )
}
