import { GlassSheet } from '@/components/layout/Backdrop'
import { useDocumentTitle } from '@/hooks'
import { Hero } from './Hero'
import { Destinations, Inspiration, OffersSection, TrustStrip, WhyUs } from './Sections'

export default function HomePage() {
  useDocumentTitle('')
  return (
    <>
      <Hero />
      <GlassSheet>
        <TrustStrip />
        <Destinations />
        <OffersSection />
        <WhyUs />
        <Inspiration />
      </GlassSheet>
    </>
  )
}
