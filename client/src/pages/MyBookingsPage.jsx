import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetMyBookingsQuery,
  useCancelBookingMutation,
} from '../features/bookings/bookingsApi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';

import { downloadBookingReceipt } from '@/lib/receipt';

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
}
function diffNights(a, b) {
  try {
    const ms = new Date(b) - new Date(a);
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
function StatusBadge({ status }) {
  const map = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
  };
  return (
    <Badge variant={map[status] ?? 'outline'} className="capitalize">
      {status ?? 'unknown'}
    </Badge>
  );
}

export default function MyBookingsPage() {
  const user = useSelector((s) => s.auth.user);
  const { data = [], isLoading, error, refetch, isFetching } = useGetMyBookingsQuery();
  const [cancelBooking] = useCancelBookingMutation();
  const { toast } = useToast();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all'); // all | confirmed | pending | cancelled
  const [when, setWhen] = useState('upcoming'); // upcoming | past | all

  const filtered = useMemo(() => {
    const now = Date.now();
    return [...(data || [])]
      .filter((b) => {
        // support both listing-based and session-based bookings
        const title =
          (b.session?.template?.name ||
            'Class').toLowerCase();

        if (q && !title.includes(q.toLowerCase())) return false;
        if (status !== 'all' && b.status !== status) return false;

        const startMs = b.start ? new Date(b.start).getTime() : 0;
        if (when === 'upcoming' && startMs < now) return false;
        if (when === 'past' && startMs >= now) return false;

        return true;
      })
      .sort((a, b) => new Date(b.start) - new Date(a.start));
  }, [data, q, status, when]);

  const canCancel = (b) =>
    b.status !== 'cancelled' && new Date(b.start) > new Date();

  const handleCancel = async (b) => {
    try {
      await cancelBooking(b._id).unwrap();
      toast({ title: 'Booking cancelled' });
      refetch();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Failed to cancel',
        description: e?.data?.message || 'Try again.',
      });
    }
  };

  const handleDownload = (b) => {
    try {
      downloadBookingReceipt({ booking: b, user });
      toast({ title: 'Receipt downloaded' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Could not generate receipt',
        description: 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
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
            <Input
              id="search"
              placeholder="Search by title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
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
          <CardContent className="p-6 text-center opacity-80">
            No bookings found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((b) => {
            // title/price support both listing (stays) and session (classes)
            const title = b.session?.template?.name || 'Booking';
            const nightly = b.session?.price ?? 0;
            const nights = diffNights(b.start, b.end);
            const subtotal = nights * nightly;
            const total = b.total ?? subtotal;

            return (
              <Card key={b._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{title}</span>
                    <StatusBadge status={b.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm opacity-80">
                    {formatDate(b.start)} → {formatDate(b.end)}
                    {Number.isFinite(nights) && nights > 0
                      ? ` (${nights} night${nights === 1 ? '' : 's'})`
                      : null}
                  </div>
                  <div className="text-sm mb-3">
                    Total: €{total}{' '}
                    {nightly && nights ? (
                      <span className="opacity-70">({nights} × €{nightly})</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* View details drawer */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="secondary">
                          View details
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="sm:max-w-md">
                        <SheetHeader>
                          <SheetTitle>{title}</SheetTitle>
                          <SheetDescription>
                            {formatDate(b.start)} → {formatDate(b.end)}
                            {Number.isFinite(nights) && nights > 0
                              ? ` (${nights} night${nights === 1 ? '' : 's'})`
                              : null}
                          </SheetDescription>
                        </SheetHeader>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="opacity-70">Location</span>
                            <span>
                              {b.listing?.location ||
                                b.session?.template?.location ||
                                '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-70">Capacity</span>
                            <span>
                              {b.listing?.capacity ||
                                b.session?.template?.capacity ||
                                '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-70">Unit price</span>
                            <span>€{nightly}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-70">Subtotal</span>
                            <span>€{subtotal || total}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-2 border-t">
                            <span>Total</span>
                            <span>€{total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-70">Status</span>
                            <span className="capitalize">{b.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-70">Booking ID</span>
                            <span className="font-mono text-xs">{b._id}</span>
                          </div>
                        </div>

                        <SheetFooter className="mt-6">
                          <SheetClose asChild>
                            <Button variant="outline">Close</Button>
                          </SheetClose>
                          <Button
                            variant="secondary"
                            onClick={() => handleDownload(b)}
                          >
                            Download receipt (PDF)
                          </Button>
                          {canCancel(b) && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCancel(b)}
                            >
                              Cancel booking
                            </Button>
                          )}
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>

                    {/* Quick cancel button (with confirm dialog) */}
                    {canCancel(b) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Cancel booking
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {title} — {formatDate(b.start)} → {formatDate(b.end)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancel(b)}>
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
