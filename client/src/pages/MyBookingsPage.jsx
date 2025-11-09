import { useMemo, useState } from 'react';
import { useGetMyBookingsQuery } from '../features/bookings/bookingsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
}

function StatusBadge({ status }) {
  const map = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
  };
  return <Badge variant={map[status] ?? 'outline'} className="capitalize">{status ?? 'unknown'}</Badge>;
}

export default function MyBookingsPage() {
  const { data = [], isLoading, error, refetch, isFetching } = useGetMyBookingsQuery();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');      // all | confirmed | pending | cancelled
  const [when, setWhen] = useState('upcoming');     // upcoming | past | all

  const filtered = useMemo(() => {
    const now = Date.now();
    return [...(data || [])]
      .filter(b => {
        const title = (b.listing?.title || '').toLowerCase();
        if (q && !title.includes(q.toLowerCase())) return false;
        if (status !== 'all' && b.status !== status) return false;
        const startMs = b.start ? new Date(b.start).getTime() : 0;
        if (when === 'upcoming' && startMs < now) return false;
        if (when === 'past' && startMs >= now) return false;
        return true;
      })
      .sort((a, b) => new Date(b.start) - new Date(a.start));
  }, [data, q, status, when]);

  if (isLoading) {
    return (
      <div className="container py-6 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10 text-center">
        <p className="mb-4 text-destructive">Failed to load bookings.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
        <h2 className="text-xl font-semibold">My Bookings</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="grid gap-1">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by listing title…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>When</Label>
            <Select value={when} onValueChange={setWhen}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Upcoming" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {!filtered.length ? (
        <Card>
          <CardContent className="p-6 text-center opacity-80">No bookings found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((b) => (
            <Card key={b._id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{b.listing?.title ?? 'Listing unavailable'}</span>
                  <StatusBadge status={b.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm opacity-80">
                  {formatDate(b.start)} → {formatDate(b.end)}
                </div>
                <div className="text-sm">Total: €{b.total ?? 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
