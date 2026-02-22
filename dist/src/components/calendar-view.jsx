"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, startOfWeek, isSameMonth, isSameDay, parseISO, isAfter, isSameSecond, addDays, parse, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Search, ArrowRight, Loader2, RefreshCcw, X, MapPin, AlignLeft, Calendar as CalendarIcon, User, Shield, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getLiveContestsAction, forceRefreshContestsAction } from '@/app/actions/contest-actions';
const safeParseDate = (dateVal) => {
    if (!dateVal)
        return new Date();
    const parsed = parseISO(dateVal);
    return isValid(parsed) ? parsed : new Date();
};
const PlatformIcon = ({ platform }) => {
    const iconSrc = platform ? `/${platform.toLowerCase().replace(/\s/g, '-')}.png` : '/default.png';
    return <img src={iconSrc} alt={`${platform} logo`} className="w-5 h-5 rounded-full" onError={(e) => { e.currentTarget.src = '/default.png'; }}/>;
};
export default function CalendarView() {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [contests, setContests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [view, setView] = useState('month');
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [jumpDay, setJumpDay] = useState('');
    const [jumpMonth, setJumpMonth] = useState('');
    const [jumpYear, setJumpYear] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
    const dayInputRef = useRef(null);
    const monthInputRef = useRef(null);
    const yearInputRef = useRef(null);
    useEffect(() => {
        setMounted(true);
        const loadContests = async () => {
            setIsLoading(true);
            try {
                const data = await getLiveContestsAction();
                setContests(data);
            }
            catch (e) {
                toast({ variant: "destructive", title: "Failed to load contests", description: "Could not fetch data." });
            }
            finally {
                setIsLoading(false);
            }
        };
        if (contests.length === 0)
            loadContests();
    }, [toast, contests.length]);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const data = await forceRefreshContestsAction();
            setContests(data);
            toast({ title: "Updated", description: "Contest schedule refreshed successfully." });
        }
        catch (e) {
            toast({ variant: "destructive", title: "Refresh failed", description: "Error during scraping." });
        }
        finally {
            setIsRefreshing(false);
        }
    };
    const handlePrev = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNext = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());
    const handleJump = () => {
        const dateStr = `${jumpYear}-${jumpMonth.padStart(2, '0')}-${jumpDay.padStart(2, '0')}`;
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate)) {
            setCurrentDate(parsedDate);
            setJumpDay('');
            setJumpMonth('');
            setJumpYear('');
            setIsPopoverOpen(false);
        }
        else {
            toast({ variant: "destructive", title: "Invalid date jump", description: "Use format YYYY-MM-DD" });
        }
    };
    const getContestsForDay = (day) => contests.filter(c => isSameDay(safeParseDate(c.startTime), day));
    const upcomingContests = useMemo(() => {
        if (!mounted)
            return [];
        const now = new Date();
        return contests
            .filter(c => (isAfter(safeParseDate(c.startTime), now) || isSameSecond(safeParseDate(c.startTime), now)) && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => safeParseDate(a.startTime).getTime() - safeParseDate(b.startTime).getTime());
    }, [contests, mounted, searchQuery]);
    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const start = startOfWeek(monthStart);
        const calendarDays = Array.from({ length: 42 }).map((_, i) => addDays(start, i));
        const displayLimit = 3;
        return (<div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 px-4">{day}</div>)}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
          {calendarDays.map((day) => {
                const dayContests = getContestsForDay(day);
                const isCurrMonth = isSameMonth(day, monthStart);
                const isToday = mounted && isSameDay(day, new Date());
                return (<div key={day.toISOString()} onClick={() => isCurrMonth && dayContests.length > 0 && (setSelectedDay(day), setIsDayDetailOpen(true))} className={cn("relative p-4 transition-colors group border-[0.5px] border-white/5 flex flex-col", isCurrMonth ? "bg-background/80" : "bg-white/[0.02] opacity-40", isCurrMonth && dayContests.length > 0 && "cursor-pointer hover:bg-white/[0.03]")}>
                <span className={cn("text-lg font-bold", isToday && "w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full purple-glow")}>{format(day, 'd')}</span>
                {isCurrMonth && (<div className="flex-1 flex flex-col gap-1 overflow-hidden mt-2">
                    {dayContests.slice(0, displayLimit).map(c => <div key={c.id} title={c.name} className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30 text-[9px] font-bold truncate">{c.name}</div>)}
                    {dayContests.length > displayLimit && <div className="text-xs font-bold text-muted-foreground mt-1">+ {dayContests.length - displayLimit} more</div>}
                  </div>)}
              </div>);
            })}
        </div>
      </div>);
    };
    return (<div className="flex h-screen overflow-hidden bg-background text-foreground font-body">
      <aside className="w-80 border-r border-white/5 glass-panel flex flex-col z-20">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center purple-glow"><img src="/calendar.png" className="w-5 h-5" alt="Calendar Icon"/></div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Calendar</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="rounded-full hover:bg-white/10"><RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")}/></Button>
        </div>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-muted-foreground"><Search className="w-4 h-4"/><input placeholder="Search events..." className="bg-transparent border-none outline-none w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/></div>
        </div>
        <ScrollArea className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</h2>{(isLoading || isRefreshing) && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground"/>}</div>
          <div className="space-y-3">
            {upcomingContests.length === 0 ? <div className="py-8 text-center text-xs text-muted-foreground">{isLoading ? 'Loading...' : 'No upcoming events'}</div> : upcomingContests.map(c => (<Dialog key={c.id}>
                <DialogTrigger asChild><div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all cursor-pointer"><p className="text-sm font-bold group-hover:text-primary transition-colors">{c.name}</p><p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/>{format(safeParseDate(c.startTime), 'MMM d, HH:mm')}</p></div></DialogTrigger>
                <DialogContent className="max-w-md w-full bg-card/90 backdrop-blur-sm border-white/10 rounded-2xl shadow-2xl">
                  <DialogHeader className="text-left items-start"><DialogTitle className="flex items-center gap-3 text-lg font-bold"><PlatformIcon platform={c.platform}/><span>{c.name}</span></DialogTitle><p className="text-sm text-muted-foreground">{`${format(safeParseDate(c.startTime), 'eeee, MMM d, yyyy')} ⋅ ${format(safeParseDate(c.startTime), 'p')} – ${format(safeParseDate(c.endTime), 'p')}`}</p></DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 py-4 pr-6 text-sm">
                      {c.url && <div className="flex items-center gap-4"><MapPin className="w-5 h-5 text-muted-foreground/80"/><a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{c.url}</a></div>}
                      {c.description_html ? <div className="flex items-start gap-4"><AlignLeft className="w-5 h-5 text-muted-foreground/80 mt-1"/><div className="text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: c.description_html }}/></div> : c.description && <div className="flex items-start gap-4"><AlignLeft className="w-5 h-5 text-muted-foreground/80 mt-1"/><p className="text-muted-foreground whitespace-pre-wrap">{c.description}</p></div>}
                      {c.author && <div className="flex items-center gap-4"><User className="w-5 h-5 text-muted-foreground/80"/><p>by {c.author}</p></div>}
                      {c.durationMinutes && <div className="flex items-center gap-4"><Clock className="w-5 h-5 text-muted-foreground/80"/><p>{c.durationMinutes} minutes</p></div>}
                      {c.rated !== undefined && c.rated !== null && <div className="flex items-center gap-4"><Shield className="w-5 h-5 text-muted-foreground/80"/><p>{c.rated.toString()}</p></div>}
                      {c.type && <div className="flex items-center gap-4"><Tag className="w-5 h-5 text-muted-foreground/80"/><p>{c.type}</p></div>}
                      {c.status && <div className="flex items-center gap-4"><Info className="w-5 h-5 text-muted-foreground/80"/><p>{c.status}</p></div>}
                      <div className="flex items-center gap-4"><CalendarIcon className="w-5 h-5 text-muted-foreground/80"/><p>{c.platform}</p></div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col relative px-8 pb-8">
        <header className="py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10"><Button variant="ghost" className="rounded-full px-5 h-9 text-xs font-bold" onClick={handleToday}>Today</Button><div className="flex"><Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full w-9 h-9"><ChevronLeft className="w-4 h-4"/></Button><Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full w-9 h-9"><ChevronRight className="w-4 h-4"/></Button></div></div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}><PopoverTrigger asChild><button className="text-left group outline-none"><h2 className="text-2xl font-bold font-headline tracking-tight group-hover:text-primary transition-all">{format(currentDate, 'MMMM yyyy')}</h2></button></PopoverTrigger><PopoverContent className="w-72 p-6 bg-card border-white/10 shadow-2xl rounded-2xl"><div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Jump to Date</label><div className="flex items-center gap-2"><div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 h-12 flex-1"><input ref={dayInputRef} placeholder="DD" value={jumpDay} onChange={e => { var _a; setJumpDay(e.target.value.slice(0, 2)); if (e.target.value.length === 2)
        (_a = monthInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }} className="w-7 bg-transparent border-none outline-none text-center font-bold text-sm"/><span className="text-muted-foreground/30 mx-1">/</span><input ref={monthInputRef} placeholder="MM" value={jumpMonth} onChange={e => { var _a; setJumpMonth(e.target.value.slice(0, 2)); if (e.target.value.length === 2)
        (_a = yearInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }} onKeyDown={e => { var _a; if (e.key === 'Backspace' && !jumpMonth)
        (_a = dayInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }} className="w-8 bg-transparent border-none outline-none text-center font-bold text-sm"/><span className="text-muted-foreground/30 mx-1">/</span><input ref={yearInputRef} placeholder="YYYY" value={jumpYear} onChange={e => setJumpYear(e.target.value.slice(0, 4))} onKeyDown={e => { var _a; if (e.key === 'Backspace' && !jumpYear)
        (_a = monthInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); if (e.key === 'Enter')
        handleJump(); }} className="w-12 bg-transparent border-none outline-none text-center font-bold text-sm"/></div><Button onClick={handleJump} size="icon" className="h-12 w-12 rounded-xl bg-primary"><ArrowRight className="w-4 h-4"/></Button></div></div></PopoverContent></Popover>
          </div>
          <div className="flex items-center gap-3"><Select value={view} onValueChange={setView}><SelectTrigger className="h-10 rounded-full px-5 bg-white/5 border-white/10 w-[110px]"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl bg-card border-white/10"><SelectItem value="month">Month</SelectItem><SelectItem value="year">Year</SelectItem></SelectContent></Select></div>
        </header>
        {view === 'month' && renderMonthView()}
      </main>

      <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}><DialogContent className="rounded-2xl bg-card border-white/10 shadow-2xl p-0 max-w-sm">{selectedDay && (<><DialogHeader className="p-6 text-center relative"><DialogTitle className="sr-only">Events for {format(selectedDay, 'MMMM d')}</DialogTitle><p className="text-sm font-bold uppercase text-muted-foreground">{format(selectedDay, 'EEE')}</p><p className="text-5xl font-bold tracking-tight">{format(selectedDay, 'd')}</p><Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" onClick={() => setIsDayDetailOpen(false)}><X className="w-4 h-4"/></Button></DialogHeader><ScrollArea className="max-h-[50vh]"><div className="space-y-3 px-6 pb-6">{getContestsForDay(selectedDay).sort((a, b) => safeParseDate(a.startTime).getTime() - safeParseDate(b.startTime).getTime()).map(c => (<div key={c.id} className="flex items-center gap-3 text-left"><PlatformIcon platform={c.platform}/><div className="text-sm"><span className="font-bold">{format(safeParseDate(c.startTime), 'p')}</span><span className="text-muted-foreground ml-2">{c.name}</span></div></div>))}</div></ScrollArea></>)}</DialogContent></Dialog>
    </div>);
}
