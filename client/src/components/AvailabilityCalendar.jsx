import React, { useMemo } from 'react';

function firstOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function lastOfMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 1); }
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function AvailabilityCalendar({ monthDate, data, onSelectDay }) {
  const start = firstOfMonth(monthDate);
  const end = lastOfMonth(monthDate); // exclusive

  const days = useMemo(() => {
    const arr = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }
    return arr;
  }, [monthDate]);

  const blanks = (start.getDay() + 6) % 7; // Monday-first
  const blackout = new Set(data?.blackoutDays || []);

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} style={{ fontWeight: 600, textAlign: 'center' }}>{d}</div>
        ))}

        {Array.from({ length: blanks }).map((_, i) => (<div key={`b${i}`} />))}

        {days.map((d) => {
          const k = ymd(d); // ✅ define first
          const remaining = data?.days?.[k];
          const isBlackout = blackout.has(k);
          const soldOut = remaining === 0 || isBlackout;
          const tip = isBlackout ? 'Blackout' : (remaining == null ? '-' : `${remaining} left`);

          return (
            <button
              key={k}
              disabled={soldOut}
              title={tip}
              style={{
                padding: 8,
                textAlign: 'center',
                border: '1px solid #ddd',
                borderRadius: 6,
                opacity: soldOut ? 0.4 : 1,
                cursor: soldOut ? 'not-allowed' : 'pointer'
              }}
              onClick={() => onSelectDay?.(k)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
