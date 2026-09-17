import ProductListing from '../components/ProductListing'

export default function GelNails() {
  return (
    <ProductListing
      eyebrow="The collection"
      title="Gel Nails"
      subtitle="Hand-finished press-on sets, cured to a glass shine and sized from your nail profile."
      category="gel-nails"
      filters={[
        { value: 'bestseller', label: 'Bestsellers' },
        { value: 'new', label: 'New in' },
        { value: 'sheer', label: 'Sheer finishes' },
      ]}
    />
  )
}
