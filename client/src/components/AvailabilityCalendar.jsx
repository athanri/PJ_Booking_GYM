import React, { useMemo } from 'react';

function firstOfMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return d;
}
function lastOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth()+1, 1);
}
function ymd(d) {
    const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
}


export default function AvailabilityCalendar({ monthDate, data, onSelectRange }) {
        const start = firstOfMonth(monthDate);
        const end = lastOfMonth(monthDate); // exclusive


        const days = useMemo(() => {
            const arr = [];
            for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
            arr.push(new Date(d));
        }
        return arr;
    }, [monthDate]);


    return (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 6 }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                    <div key={d} style={{ fontWeight: 600, textAlign:'center' }}>{d}</div>
                ))}
                {(() => {
                    const blanks = (start.getDay() + 6) % 7; // Monday-first
                    const cells = [];
                    for (let i=0;i<blanks;i++) cells.push(<div key={`b${i}`} />);
                    for (const d of days) {
                        const key = ymd(d);
                        const remaining = data?.days?.[key];
                        const soldOut = remaining === 0;
                        cells.push(
                            <button
                                key={key}
                                disabled={soldOut}
                                title={soldOut ? 'Sold out' : `${remaining ?? '-'} left`}
                                style={{
                                    padding: 8,
                                    textAlign:'center',
                                    border:'1px solid #ddd',
                                    borderRadius:6,
                                    opacity: soldOut ? 0.4 : 1,
                                    cursor: soldOut ? 'not-allowed' : 'pointer'
                                }}
                                onClick={() => onSelectRange?.(key)}
                            >
                                {d.getDate()}
                            </button>
                        );
                    }
                    return cells;
                })()}
            </div>
        </div>
    );
}