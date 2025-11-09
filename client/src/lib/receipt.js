import jsPDF from 'jspdf';

// naive formatter
function fmtDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
}
function diffNights(a, b) {
  try { return Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)); } catch { return 0; }
}

export function downloadBookingReceipt({ booking, user }) {
  const doc = new jsPDF({ unit: 'pt' });
  const line = (y, text, opts = {}) => {
    const x = opts.x ?? 40;
    doc.text(String(text ?? ''), x, y);
  };

  const title = booking?.listing?.title ?? 'Listing';
  const start = fmtDate(booking?.start);
  const end = fmtDate(booking?.end);
  const nights = diffNights(booking?.start, booking?.end);
  const nightly = booking?.listing?.price ?? 0;
  const subtotal = nights * nightly;
  const total = booking?.total ?? subtotal;

  let y = 40;
  doc.setFontSize(18); line(y, 'Booking Receipt'); y += 28;
  doc.setFontSize(11); doc.setTextColor('#666'); line(y, new Date().toLocaleString()); y += 24;

  // Seller / Buyer
  doc.setTextColor('#000');
  doc.setFont(undefined, 'bold'); line(y, 'From'); doc.setFont(undefined, 'normal'); y += 16;
  line(y, 'MERN Booking System'); y += 18;
  y += 8;
  doc.setFont(undefined, 'bold'); line(y, 'Billed To'); doc.setFont(undefined, 'normal'); y += 16;
  line(y, user?.name ? `${user.name}` : 'Customer'); y += 18;
  y += 16;

  // Booking summary
  doc.setFont(undefined, 'bold'); line(y, 'Booking Summary'); doc.setFont(undefined, 'normal'); y += 16;
  line(y, `Booking ID: ${booking?._id ?? '—'}`); y += 16;
  line(y, `Listing: ${title}`); y += 16;
  line(y, `Location: ${booking?.listing?.location ?? '—'}`); y += 16;
  line(y, `Dates: ${start} → ${end} (${nights} night${nights === 1 ? '' : 's'})`); y += 24;

  // Cost breakdown
  doc.setFont(undefined, 'bold'); line(y, 'Charges'); doc.setFont(undefined, 'normal'); y += 16;
  line(y, `Nightly price: €${nightly}`); y += 16;
  line(y, `Subtotal: €${subtotal}`); y += 12;
  doc.setLineWidth(0.5); doc.line(40, y, 555, y); y += 16;
  doc.setFont(undefined, 'bold'); line(y, `Total: €${total}`); y += 28;

  // Status
  doc.setFont(undefined, 'normal');
  line(y, `Status: ${booking?.status ?? 'unknown'}`); y += 20;

  // Footer
  doc.setTextColor('#666');
  line(y, 'Thank you for your booking!');
  doc.save(`receipt-${booking?._id ?? 'booking'}.pdf`);
}
