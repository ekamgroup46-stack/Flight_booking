import type { ServiceId } from '@/config/services'

export interface Faq {
  id: string
  q: string
  a: string
}

export const FAQS: Record<ServiceId | 'general', Faq[]> = {
  general: [
    { id: 'g1', q: 'Does Ekam charge a convenience fee?', a: 'No. The price you see on the results page is the price you pay — taxes included, convenience fee ₹0, on every mode and every payment method.' },
    { id: 'g2', q: 'How do I cancel or change a booking?', a: 'Open My Bookings, choose the trip and tap Cancel. You will see the exact refund before you confirm. Refunds reach the original payment method in 3–7 working days; UPI refunds are usually instant.' },
    { id: 'g3', q: 'Can I book for someone else?', a: 'Yes. Enter the traveller’s details as they appear on their ID. Your email and phone receive the tickets and updates.' },
    { id: 'g4', q: 'Is my payment information safe?', a: 'Payments are processed by PCI-DSS Level 1 certified partners over encrypted connections. Ekam never stores your full card number or CVV.' },
    { id: 'g5', q: 'How do I reach a human?', a: 'Call or WhatsApp us any time — the line is staffed 24×7. Most calls are answered within 90 seconds.' },
  ],
  flights: [
    { id: 'f1', q: 'What’s the difference between Saver, Flexi and Super Flexi?', a: 'Saver is the lowest fare with standard change and cancellation fees. Flexi adds a free date change and a meal. Super Flexi lets you change unlimited times and cancel free up to 24 hours before departure.' },
    { id: 'f2', q: 'How much baggage can I carry?', a: 'Domestic economy fares include 7 kg cabin and 15 kg check-in baggage. International economy includes 7 kg cabin and 25 kg check-in. Each fare card shows the exact allowance.' },
    { id: 'f3', q: 'Do student and senior-citizen fares need proof?', a: 'Yes — carry a valid student ID or age proof to the airport. Without it, the airline may charge the fare difference at check-in.' },
    { id: 'f4', q: 'When does web check-in open?', a: 'Usually 48 hours before departure for domestic flights and 24 hours for international. We send a reminder with a direct link.' },
  ],
  trains: [
    { id: 't1', q: 'What do AVL, RAC and WL mean?', a: 'AVL means confirmed berths are available. RAC (Reservation Against Cancellation) gets you on board with a shared berth that may upgrade. WL (waitlist) confirms only if others cancel — we show the confirmation chance next to every waitlisted fare.' },
    { id: 't2', q: 'When does Tatkal booking open?', a: 'Tatkal opens one day before the journey: 10:00 AM for AC classes and 11:00 AM for non-AC classes.' },
    { id: 't3', q: 'Is ID required on board?', a: 'Yes. One passenger on every ticket must carry an original government photo ID matching the name on the booking.' },
    { id: 't4', q: 'When is the chart prepared?', a: 'The reservation chart is prepared about four hours before departure. After that, waitlisted tickets that didn’t confirm are cancelled and refunded automatically.' },
  ],
  buses: [
    { id: 'b1', q: 'Can I choose my exact seat?', a: 'Yes. Every bus shows a live seat map. Sleeper buses show lower and upper decks; seats reserved for women are marked.' },
    { id: 'b2', q: 'Where do I board?', a: 'Choose a boarding point when you pick seats. Your m-ticket includes the address, a map link and the operator’s contact number.' },
    { id: 'b3', q: 'What if the bus is delayed or cancelled?', a: 'If an operator cancels, you get a full refund automatically. For delays of more than three hours you can cancel free from My Bookings.' },
  ],
  cabs: [
    { id: 'c1', q: 'Are tolls and parking included?', a: 'Airport transfers include airport entry and tolls. Outstation fares include tolls, state tax and driver allowance. Hourly rentals exclude parking and tolls, billed at actuals.' },
    { id: 'c2', q: 'What if my flight is delayed?', a: 'Add your flight number at checkout and we track it — your driver waits for the actual landing time, with 45 minutes of free waiting at arrivals.' },
    { id: 'c3', q: 'When will I get driver details?', a: 'Driver name, photo, car number and live location arrive by SMS and WhatsApp 60 minutes before pickup (3 hours for outstation trips).' },
  ],
  cargo: [
    { id: 'x1', q: 'How is chargeable weight calculated?', a: 'We charge the higher of actual weight and volumetric weight. Volumetric weight is length × width × height in centimetres, divided by 5,000.' },
    { id: 'x2', q: 'What can’t I ship?', a: 'Hazardous goods, liquids above 1 litre, cash, jewellery, live animals and anything prohibited by law. Lithium batteries ship only by surface.' },
    { id: 'x3', q: 'Do you handle e-way bills?', a: 'Yes. For consignments above ₹50,000 we generate the e-way bill from your invoice details at pickup.' },
    { id: 'x4', q: 'Can I schedule regular pickups?', a: 'Business accounts can schedule daily or weekly pickups, get consolidated invoices and use our shipping API.' },
  ],
}
