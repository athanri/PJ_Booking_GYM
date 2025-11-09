import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetSessionsQuery } from '../features/sessions/sessionsApi';
import {
  useCreateSessionBookingMutation,
  useJoinWaitlistMutation,
} from '../features/bookings/bookingsApi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

// ---------- date helpers ----------
const ONE_DAY = 24 * 60 * 60 * 1000;
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d) { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; } // Monday-first
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fmtShort(d) { return new Date(d).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
function ymd(d) { return d.toISOString().slice(0,10); }

// ---------- persistence helpers ----------
const FILTERS_LS_KEY = 'sessions.filters.v1';
const VIEW_LS_KEY = 'sessions.view.v1';

const defaultFilters = { q: '', instructor: 'all', location: 'all', onlyBookable: false, onlySpots: false };

function parseBool(v) {
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return undefined;
}
function readFiltersFromSearchParams(sp) {
  const obj = Object.fromEntries(sp.entries());
  return {
    q: obj.q ?? defaultFilters.q,
    instructor: obj.instructor ?? defaultFilters.instructor,
    location: obj.location ?? defaultFilters.location,
    onlyBookable: parseBool(obj.onlyBookable) ?? defaultFilters.onlyBookable,
    onlySpots: parseBool(obj.onlySpots) ?? defaultFilters.onlySpots,
  };
}
function readFiltersFromLocalStorage() {
  try {
    const raw = localStorage.getItem(FILTERS_LS_KEY);
    return raw ? { ...defaultFilters, ...JSON.parse(raw) } : defaultFilters;
  } catch { return defaultFilters; }
}
function toSearchParamsObject(filters) {
  const out = {};
  if (filters.q) out.q = filters.q;
  if (filters.instructor !== 'all') out.instructor = filters.instructor;
  if (filters.location !== 'all') out.location = filters.location;
  if (filters.onlyBookable) out.onlyBookable = '1';
  if (filters.onlySpots) out.onlySpots = '1';
  return out;
}
function ymdStr(d) { return d.toISOString().slice(0,10); }
function parseYMD(s) {
  const [y,m,dd] = (s || '').split('-').map(Number);
  if (!y || !m || !dd) return null;
  const d = new Date(Date.UTC(y, m-1, dd));
  d.setHours(0,0,0,0);
  return d;
}
function snapAnchorForMode(mode, anchor) {
  if (mode === 'day')  return startOfDay(anchor);
  if (mode === 'week') return startOfWeek(anchor);
  return startOfMonth(anchor);
}

// ---------- action button ----------
function SessionAction({ s, onDone, book, joinWaitlist, toast }) {
  const full = s.spotsRemaining <= 0;
  let cta = 'Book', disabled = false, hint = '';
  if (full) {
    cta = 'Join waitlist';
  } else if (!s.bookable) {
    const now = Date.now();
    if (now < new Date(s.openAt).getTime()) {
      cta = 'Opens soon'; hint = `Opens ${fmtShort(s.openAt)}`; disabled = true;
    } else {
      cta = 'Closed'; hint = `Closed ${fmtShort(s.closeAt)}`; disabled = true;
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={disabled}
        onClick={async () => {
          try {
            if (full) {
              await joinWaitlist({ sessionId: s._id }).unwrap();
              toast({ title: 'Joined waitlist', description: `${s.template?.name} ${fmtTime(s.start)}` });
            } else {
              await book({ sessionId: s._id }).unwrap();
              toast({ title: 'Booked!', description: `${s.template?.name} ${fmtTime(s.start)}` });
            }
            onDone?.();
          } catch (e) {
            toast({
              variant: 'destructive',
              title: full ? 'Waitlist failed' : 'Could not book',
              description: e?.data?.message || 'Try again',
            });
          }
        }}
      >
        {cta}
      </Button>
      {hint ? <span className="text-xs opacity-70">{hint}</span> : null}
    </div>
  );
}

export default function SessionsPage() {
  const internalNavRef = useRef(false);
  const { toast } = useToast();
  const [book] = useCreateSessionBookingMutation();
  const [joinWaitlist] = useJoinWaitlistMutation();

  const [searchParams, setSearchParams] = useSearchParams();

  // VIEW: URL > LS > defaults
  const initialView = useMemo(() => {
    const urlMode   = searchParams.get('mode');
    const urlAnchor = parseYMD(searchParams.get('anchor'));
    if (urlMode || urlAnchor) {
      return {
        mode: urlMode || 'week',
        anchor: snapAnchorForMode(urlMode || 'week', urlAnchor || new Date())
      };
    }
    try {
      const raw = localStorage.getItem(VIEW_LS_KEY);
      if (raw) {
        const { mode='week', anchorISO } = JSON.parse(raw);
        const a = anchorISO ? parseYMD(anchorISO) : startOfWeek(new Date());
        return { mode, anchor: snapAnchorForMode(mode, a) };
      }
    } catch {}
    return { mode: 'week', anchor: startOfWeek(new Date()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mode, setMode] = useState(initialView.mode);         // 'day' | 'week' | 'month'
  const [anchor, setAnchor] = useState(initialView.anchor);   // Date (snapped per mode)

  // FILTERS: URL > LS > defaults
  const initialFilters = useMemo(() => {
    const urlHasParams = Array.from(searchParams.keys()).some(k =>
      ['q','instructor','location','onlyBookable','onlySpots'].includes(k)
    );
    return urlHasParams ? readFiltersFromSearchParams(searchParams) : readFiltersFromLocalStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [q, setQ] = useState(initialFilters.q);
  const [instructor, setInstructor] = useState(initialFilters.instructor);
  const [location, setLocation] = useState(initialFilters.location);
  const [onlyBookable, setOnlyBookable] = useState(initialFilters.onlyBookable);
  const [onlySpots, setOnlySpots] = useState(initialFilters.onlySpots);

  const filters = { q, instructor, location, onlyBookable, onlySpots };
  const isDefaultFilters =
    q === defaultFilters.q &&
    instructor === defaultFilters.instructor &&
    location === defaultFilters.location &&
    onlyBookable === defaultFilters.onlyBookable &&
    onlySpots === defaultFilters.onlySpots;

  // Persist filters + view to URL & LS
  useEffect(() => {
    // Build query params from state
    const qp = toSearchParamsObject(filters);
    qp.mode   = mode;
    qp.anchor = ymdStr(anchor);

    const sp = new URLSearchParams();
    for (const [k,v] of Object.entries(qp)) sp.set(k, v);

    internalNavRef.current = true; // <-- mark as our own update

    if (sp.toString().length === 0) {
      setSearchParams('', { replace: true }); // clear all
    } else {
      setSearchParams(sp, { replace: true });
    }

    try {
      localStorage.setItem(FILTERS_LS_KEY, JSON.stringify(filters));
      localStorage.setItem(VIEW_LS_KEY, JSON.stringify({ mode, anchorISO: ymdStr(anchor) }));
    } catch {}
  }, [filters, mode, anchor, setSearchParams]);

  // React to URL changes (back/forward)
  useEffect(() => {
    // Skip if this change came from our own setSearchParams to avoid loops
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }

    // HYDRATE from URL (e.g., back/forward navigation or shared links)
    const parsedF = readFiltersFromSearchParams(searchParams);
    const parsedMode   = searchParams.get('mode') || mode;
    const parsedAnchor = parseYMD(searchParams.get('anchor')) || anchor;
    const snappedAnchor = snapAnchorForMode(parsedMode, parsedAnchor);

    // Update filters if different
    if (
      parsedF.q !== q ||
      parsedF.instructor !== instructor ||
      parsedF.location !== location ||
      parsedF.onlyBookable !== onlyBookable ||
      parsedF.onlySpots !== onlySpots
    ) {
      setQ(parsedF.q);
      setInstructor(parsedF.instructor);
      setLocation(parsedF.location);
      setOnlyBookable(parsedF.onlyBookable);
      setOnlySpots(parsedF.onlySpots);
    }

    // Update view if different
    if (parsedMode !== mode || ymdStr(snappedAnchor) !== ymdStr(anchor)) {
      setMode(parsedMode);
      setAnchor(snappedAnchor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function clearFilters() {
    setQ(defaultFilters.q);
    setInstructor(defaultFilters.instructor);
    setLocation(defaultFilters.location);
    setOnlyBookable(defaultFilters.onlyBookable);
    setOnlySpots(defaultFilters.onlySpots);
  }

  // Compute fetch range from mode+anchor (stable)
  const { fromISO, toISO, daysArray, monthGrid, rangeLabel } = useMemo(() => {
    let start, end, label = '';
    if (mode === 'day') {
      start = startOfDay(anchor); end = addDays(start, 1);
      label = start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    } else if (mode === 'week') {
      start = startOfWeek(anchor); end = addDays(start, 7);
      const endLabel = addDays(start, 6);
      label = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${endLabel.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } else {
      start = startOfMonth(anchor); end = addMonths(start, 1);
      label = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    const daysArray = mode !== 'month'
      ? Array.from({ length: (end - start) / ONE_DAY }, (_, i) => addDays(start, i))
      : [];

    let monthGrid = [];
    if (mode === 'month') {
      const first = startOfMonth(anchor);
      const firstDow = (first.getDay() + 6) % 7; // Monday-first
      const gridStart = addDays(first, -firstDow);
      monthGrid = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)); // 6x7
    }

    return { fromISO: start.toISOString(), toISO: end.toISOString(), daysArray, monthGrid, rangeLabel: label };
  }, [mode, anchor]);

  const { data = [], isLoading, error, refetch, isFetching } = useGetSessionsQuery({ from: fromISO, to: toISO });

  // Build filter option lists + filtered data
  const { instructorOpts, locationOpts, filteredData } = useMemo(() => {
    const inst = new Set(), locs = new Set();
    for (const s of data) {
      if (s?.template?.instructor) inst.add(s.template.instructor);
      if (s?.template?.location) locs.add(s.template.location);
    }
    const instructorOpts = ['all', ...Array.from(inst).sort()];
    const locationOpts = ['all', ...Array.from(locs).sort()];

    const qLower = q.trim().toLowerCase();
    const filtered = data.filter((s) => {
      const name = (s.template?.name || '').toLowerCase();
      if (qLower && !name.includes(qLower)) return false;
      if (instructor !== 'all' && s.template?.instructor !== instructor) return false;
      if (location !== 'all' && s.template?.location !== location) return false;
      if (onlyBookable && !s.bookable) return false;
      if (onlySpots && !(s.spotsRemaining > 0)) return false;
      return true;
    });

    return { instructorOpts, locationOpts, filteredData: filtered };
  }, [data, q, instructor, location, onlyBookable, onlySpots]);

  // Group sessions by day AFTER filtering
  const byDay = useMemo(() => {
    const g = {};
    for (const s of filteredData) {
      const k = ymd(startOfDay(new Date(s.start)));
      (g[k] ||= []).push(s);
    }
    for (const k of Object.keys(g)) g[k].sort((a, b) => new Date(a.start) - new Date(b.start));
    return g;
  }, [filteredData]);

  // Navigation handlers
  const goPrev = () => setAnchor(a => mode === 'day' ? addDays(a, -1) : mode === 'week' ? addDays(a, -7) : addMonths(a, -1));
  const goNext = () => setAnchor(a => mode === 'day' ? addDays(a, 1) : mode === 'week' ? addDays(a, 7) : addMonths(a, 1));
  const goToday = () => setAnchor(mode === 'week' ? startOfWeek(new Date()) : mode === 'day' ? startOfDay(new Date()) : startOfMonth(new Date()));

  // ------------- RENDERERS -------------
  const renderCardSession = (s) => (
    <div key={s._id} className="flex items-center justify-between gap-2 border rounded p-2">
      <div className="min-w-0">
        <div className="font-medium truncate">{s.template?.name}</div>
        <div className="text-xs opacity-70">
          {fmtTime(s.start)}–{fmtTime(s.end)} · {s.template?.instructor} · {s.template?.location}
        </div>
        <div className="text-xs">
          {s.spotsRemaining > 0 ? `${s.spotsRemaining} spots left` : 'Full'}
          {!s.bookable && (
            <> · {Date.now() < new Date(s.openAt).getTime()
              ? `Opens ${fmtShort(s.openAt)}`
              : `Closed ${fmtShort(s.closeAt)}`}</>
          )}
        </div>
      </div>
      <SessionAction s={s} book={book} joinWaitlist={joinWaitlist} toast={toast} onDone={() => refetch()} />
    </div>
  );

  const renderDay = () => {
    const k = ymd(anchor);
    const list = byDay[k] || [];
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{rangeLabel}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!list.length ? <div className="text-sm opacity-70">No classes</div> : list.map(renderCardSession)}
        </CardContent>
      </Card>
    );
  };

  const renderWeek = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {daysArray.map((d) => {
        const k = ymd(d);
        const list = byDay[k] || [];
        return (
          <Card key={k}>
            <CardHeader>
              <CardTitle className="text-base">
                {d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!list.length ? <div className="text-sm opacity-70">No classes</div> : list.map(renderCardSession)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderMonth = () => {
    const month = anchor.getMonth();
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold opacity-80">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d)=> <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((d, i) => {
            const k = ymd(d);
            const list = byDay[k] || [];
            const isOtherMonth = d.getMonth() !== month;
            return (
              <div key={k + i} className={`border rounded p-1 min-h-[92px] ${isOtherMonth ? 'opacity-50' : ''}`}>
                <div className="text-xs font-medium mb-1">{d.getDate()}</div>
                <div className="space-y-1">
                  {list.length === 0 ? (
                    <div className="text-[10px] opacity-60">—</div>
                  ) : list.slice(0,3).map((s) => (
                    <div key={s._id} className="text-[11px] truncate">
                      <span className="font-medium">{fmtTime(s.start)}</span> {s.template?.name}
                    </div>
                  ))}
                  {list.length > 3 && (
                    <div className="text-[10px] opacity-70">+{list.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs opacity-70">Tip: switch to Week/Day to book.</div>
      </div>
    );
  };

  // ------------- MAIN -------------
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
    <div className="container py-6 space-y-4">
      {/* Top bar: navigation + view selector */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goPrev}>{'‹'}</Button>
          <div className="min-w-[220px] text-center font-medium">{rangeLabel}</div>
          <Button variant="outline" onClick={goNext}>{'›'}</Button>
          <Button variant="ghost" onClick={goToday}>Today</Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={(v) => {
            setMode(v);
            setAnchor(a => snapAnchorForMode(v, a)); // keep date context, snap boundary
          }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Week view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-5 gap-3 items-end">
            <div className="grid gap-1">
              <Label htmlFor="q">Class name</Label>
              <Input id="q" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            <div className="grid gap-1">
              <Label>Instructor</Label>
              <Select value={instructor} onValueChange={setInstructor}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {instructorOpts.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {locationOpts.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="bookable-switch" checked={onlyBookable} onCheckedChange={(v) => setOnlyBookable(Boolean(v))} />
              <Label htmlFor="bookable-switch" className="cursor-pointer">Bookable only</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="spots-switch" checked={onlySpots} onCheckedChange={(v) => setOnlySpots(Boolean(v))} />
              <Label htmlFor="spots-switch" className="cursor-pointer">Has spots</Label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={isDefaultFilters}
              className="mt-3"
              title="Reset all filters"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Views */}
      {mode === 'day' && renderDay()}
      {mode === 'week' && renderWeek()}
      {mode === 'month' && renderMonth()}
    </div>
  );
}
