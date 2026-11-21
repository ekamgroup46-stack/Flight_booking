/* Template policy content for the design phase. Review with legal counsel before launch. */

export interface LegalDoc {
  slug: 'booking' | 'terms' | 'privacy'
  title: string
  eyebrow: string
  updated: string
  intro: string
  sections: Array<{ id: string; heading: string; body: string[] }>
}

export const LEGAL_DOCS: Record<LegalDoc['slug'], LegalDoc> = {
  booking: {
    slug: 'booking',
    title: 'Booking & cancellation policy',
    eyebrow: 'Policies',
    updated: '2026-11-01',
    intro: 'How bookings, changes, cancellations and refunds work on Ekam for every mode of travel and every shipment. Where a carrier’s own rules are stricter, they apply and we show them before you pay.',
    sections: [
      { id: 'confirmation', heading: 'When a booking is confirmed', body: ['A booking is confirmed once payment succeeds and the carrier issues a reference — a PNR for flights and trains, a ticket number for buses, a trip ID for cabs or a tracking ID for shipments.', 'Fares are held for 15 minutes during checkout. If the hold ends, we re-check the fare before you pay; you’ll never be charged a different amount without seeing it first.'] },
      { id: 'fees', heading: 'Fees we charge', body: ['Ekam charges no convenience fee and no payment-method surcharge. Every price shown includes applicable taxes.', 'Optional add-ons — insurance, seats, meals, free-cancellation cover — are never pre-selected and are itemised in your receipt.'] },
      { id: 'flights', heading: 'Flights', body: ['Changes and cancellations follow the fare family you chose (Saver, Flexi or Super Flexi). Fees are shown on the fare card and again at checkout.', 'No-show refunds are limited to statutory taxes and airport fees, which we return on request.'] },
      { id: 'trains', heading: 'Trains', body: ['Cancellation charges follow railway rules and depend on class and time to departure. Waitlisted tickets that remain unconfirmed after charting are cancelled and refunded in full automatically.', 'Tatkal tickets with confirmed status are non-refundable except where the railway cancels the train.'] },
      { id: 'buses', heading: 'Buses', body: ['Each operator sets its own cancellation window, shown on the bus card. Free-cancellation cover, where added, refunds the full seat fare up to two hours before departure.', 'If an operator cancels or changes the bus type, you receive a full refund.'] },
      { id: 'cabs', heading: 'Cabs', body: ['Local and airport rides can be cancelled free up to one hour before pickup; outstation trips up to six hours before.', 'Waiting beyond the included free time, extra kilometres and extra hours are billed at the rates shown when you booked.'] },
      { id: 'cargo', heading: 'Cargo & shipments', body: ['Shipments can be cancelled free until a pickup partner is assigned. After pickup, a return-to-origin charge may apply.', 'Claims for loss or damage must be raised within 7 days of delivery with photographs and the invoice. Shipment protection covers declared value up to ₹50,000.'] },
      { id: 'refunds', heading: 'Refund timelines', body: ['UPI and wallet refunds are usually instant. Card and net-banking refunds take 3–7 working days, depending on your bank.', 'You can follow every refund from My Bookings.'] },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms & conditions',
    eyebrow: 'Legal',
    updated: '2026-11-01',
    intro: 'These terms govern your use of Ekam’s website, apps and booking services. By booking with us you agree to them, along with the carrier’s conditions of carriage for your journey.',
    sections: [
      { id: 'role', heading: 'Our role', body: ['Ekam acts as a booking agent for airlines, railways, bus operators, cab partners and logistics carriers. The contract of carriage is between you and the carrier.', 'We are responsible for the accuracy of the information we display and for processing your booking, payment and refund correctly.'] },
      { id: 'account', heading: 'Your account', body: ['Keep your login details safe. You’re responsible for bookings made from your account unless you tell us promptly about unauthorised access.', 'Traveller names must match government-issued ID. Name corrections are subject to carrier rules.'] },
      { id: 'pricing', heading: 'Prices and payment', body: ['Prices are shown in Indian rupees and include applicable taxes. Currency conversion for international cards is handled by your bank.', 'If a carrier changes a price before ticketing, we will ask you before charging anything extra.'] },
      { id: 'conduct', heading: 'Acceptable use', body: ['Don’t misuse the platform — no automated scraping, reselling without a partner agreement, or fraudulent bookings.', 'We may cancel bookings that breach these terms and will refund any amount due.'] },
      { id: 'liability', heading: 'Liability', body: ['Our liability is limited to the amount you paid us for the affected booking, except where the law does not allow such a limit.', 'We are not liable for delays or cancellations caused by carriers, weather or events beyond reasonable control, but we will always help you rebook or claim a refund.'] },
      { id: 'disputes', heading: 'Governing law', body: ['These terms are governed by the laws of India. Courts in Bengaluru have jurisdiction, without affecting your rights as a consumer.'] },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy policy',
    eyebrow: 'Legal',
    updated: '2026-11-01',
    intro: 'We collect only what we need to book your travel and keep you safe on the way — and we never sell your personal data.',
    sections: [
      { id: 'collect', heading: 'What we collect', body: ['Traveller details you enter (names, age, gender, ID where required), contact details, booking history and payment confirmations.', 'Device and usage information that helps us keep the service secure and fast. We do not store full card numbers or CVVs.'] },
      { id: 'use', heading: 'How we use it', body: ['To make and manage bookings with carriers, send tickets and updates, process refunds and provide support.', 'To improve search results and prevent fraud. Marketing messages are opt-in, and you can unsubscribe at any time.'] },
      { id: 'share', heading: 'Who we share it with', body: ['Only the carriers and payment partners needed to fulfil your booking, and authorities where the law requires it.', 'Partners are bound by contracts that restrict their use of your data to that purpose.'] },
      { id: 'rights', heading: 'Your rights', body: ['You can access, correct or delete your personal data, and withdraw consent, from your account or by writing to us.', 'We respond to requests within 30 days, in line with the Digital Personal Data Protection Act, 2023.'] },
      { id: 'retention', heading: 'Retention & security', body: ['We keep booking records for as long as tax and travel regulations require, then delete or anonymise them.', 'Data is encrypted in transit and at rest, and access is restricted to staff who need it.'] },
    ],
  },
}
