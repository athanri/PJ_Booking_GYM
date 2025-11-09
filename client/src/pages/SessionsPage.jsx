import { useMemo } from 'react';
import { useGetSessionsQuery } from '../features/sessions/sessionsApi';
import { useCreateSessionBookingMutation } from '../features/bookings/bookingsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function fmtTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function dayKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export default function SessionsPage() {
  // Freeze the range once to avoid changing query args on every render
  const { fromISO, toISO, fromDate } = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return {
      fromISO: from.toISOString(),
      toISO: to.toISOString(),
      fromDate: from,
    };
  }, []);

  const { data = [], isLoading, error, refetch, isFetching } = useGetSessionsQuery({
    from: fromISO,
    to: toISO,
  });

  const [book] = useCreateSessionBookingMutation();
  const { toast } = useToast();

  const groups = useMemo(() => {
    const g = {};
    for (const s of data) {
      const k = dayKey(s.start);
      (g[k] ||= []).push(s);
    }
    for (const k of Object.keys(g)) g[k].sort((a, b) => new Date(a.start) - new Date(b.start));
    return g;
  }, [data]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [fromDate]);

  if (isLoading) return <div className="container py-6">Loading…</div>;
  if (error) {
    return (
      <div className="container py-6">
        <p className="text-destructive mb-3">Couldn’t load classes.</p>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">This Week’s Classes</h2>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const list = groups[key] || [];
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">
                  {d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!list.length && <div className="text-sm opacity-70">No classes</div>}
                {list.map((s) => (
                  <div key={s._id} className="flex items-center justify-between gap-2 border rounded p-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.template?.name}</div>
                      <div className="text-xs opacity-70">
                        {fmtTime(s.start)}–{fmtTime(s.end)} · {s.template?.instructor} · {s.template?.location}
                      </div>
                      <div className="text-xs">{s.spotsRemaining} spots left</div>
                    </div>
                    <Button
                      size="sm"
                      disabled={s.spotsRemaining <= 0}
                      onClick={async () => {
                        try {
                          await book({ sessionId: s._id }).unwrap();
                          toast({ title: 'Booked!', description: `${s.template?.name} ${fmtTime(s.start)}` });
                          refetch();
                        } catch (e) {
                          toast({
                            variant: 'destructive',
                            title: 'Could not book',
                            description: e?.data?.message || 'Try again',
                          });
                        }
                      }}
                    >
                      {s.spotsRemaining > 0 ? 'Book' : 'Full'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
