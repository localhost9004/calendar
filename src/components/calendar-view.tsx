
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  startOfWeek, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  isAfter,
  isSameSecond,
  addDays,
  parse,
  isValid,
  isToday,
  isTomorrow,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Search,
  ArrowRight,
  Loader2,
  X,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { type ContestEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getEvents, getEventCategories, getPlatforms } from '@/app/actions/contest-actions';

const safeParseDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  const parsed = parseISO(dateVal);
  return isValid(parsed) ? parsed : new Date();
};

const generateHueFromString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash % 360;
};

const PlatformIcon = ({ platform, url }: { platform?: string; url?: string }) => {
    const getFaviconUrl = (contestUrl: string) => {
        try {
            const hostname = new URL(contestUrl).hostname;
            return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        } catch {
            return '/default.png';
        }
    };

    const [imgSrc, setImgSrc] = useState(platform ? `/${platform.toLowerCase().replace(/\s/g, '-')}.png` : getFaviconUrl(url || ''));

    useEffect(() => {
        setImgSrc(platform ? `/${platform.toLowerCase().replace(/\s/g, '-')}.png` : getFaviconUrl(url || ''));
    }, [platform, url]);

    return (
        <img
            src={imgSrc}
            alt={`${platform} logo`}
            className="w-5 h-5 rounded-full"
            onError={() => {
                if (imgSrc !== getFaviconUrl(url || '')) {
                    setImgSrc(getFaviconUrl(url || ''));
                }
            }}
        />
    );
};

const EventDetailsCard = ({ event, open, onOpenChange }: { event: ContestEntry, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
  const details = {
    "Platform": event.platform,
    "URL": event.url,
    "Type": event.event_type,
    "Status": event.status,
    "Location": event.is_online ? 'Online' : event.location,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-card/90 backdrop-blur-sm border-white/10 rounded-2xl shadow-2xl p-0">
        <DialogHeader className="text-left items-start p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <PlatformIcon platform={event.platform} url={event.url} />
            <span>{event.title}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {`${format(safeParseDate(event.start_time), 'eeee, MMM d, yyyy')} ⋅ ${format(safeParseDate(event.start_time), 'p')}`}
            {event.end_time && `– ${format(safeParseDate(event.end_time), 'p')}`}
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6">
            <div className="space-y-4 text-sm">
              {Object.entries(details).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div key={key} className="grid grid-cols-3 gap-4 items-start">
                    <div className="text-muted-foreground font-medium col-span-1">{key}</div>
                    <div className="col-span-2 break-words">
                      {key === 'URL' ? (
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{value}</a>
                      ) : (
                        <span>{value}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const MultiSelectFilter = ({ title, options, selected, onSelectionChange }: { title: string, options: {id: string, name: string}[], selected: string[], onSelectionChange: (selected: string[]) => void }) => {
    const isAllSelected = options.length > 0 && selected.length === options.length;

    const handleSelectAll = (checked: boolean) => {
        onSelectionChange(checked ? options.map(o => o.id) : []);
    };

    const getButtonText = () => {
        if (isAllSelected || selected.length === 0) return `All ${title}`;
        if (selected.length === 1) return options.find(o => o.id === selected[0])?.name;
        return `${selected.length} ${title.slice(0,-1)}s`;
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="h-10 rounded-full px-5 bg-white/5 border-white/10">
                    {getButtonText()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="rounded-2xl bg-card border-white/10 w-60">
                <p className="font-bold text-sm p-2">{title}</p>
                <ScrollArea className="h-60">
                    <div className="p-2 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`${title}-all`}
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor={`${title}-all`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                All
                            </label>
                        </div>
                        {options.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${title}-${option.id}`}
                                    checked={selected.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                        const newSelection = checked 
                                            ? [...selected, option.id] 
                                            : selected.filter(item => item !== option.id);
                                        onSelectionChange(newSelection);
                                    }}
                                />
                                <label htmlFor={`${title}-${option.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {option.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};


export default function CalendarView() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ContestEntry[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [view, setView] = useState('month');
  
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const [allEventTypes, setAllEventTypes] = useState<{id: string, name: string}[]>([]);
  const [allPlatforms, setAllPlatforms] = useState<{id: string, name: string}[]>([]);

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  const [jumpDay, setJumpDay] = useState('');
  const [jumpMonth, setJumpMonth] = useState('');
  const [jumpYear, setJumpYear] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ContestEntry | null>(null);

  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const loadFilters = async () => {
      try {
        const [categories, platforms] = await Promise.all([
          Promise.resolve([
            { id: 'contest', name: 'Contest' },
            { id: 'hackathon', name: 'Hackathon' },
            { id: 'stream', name: 'Stream' },
          ]),
          Promise.resolve([
            { id: 'atcoder', name: 'AtCoder' },
            { id: 'codechef', name: 'CodeChef' },
            { id: 'codeforces', name: 'Codeforces' },
            { id: 'codolio', name: 'Codolio' },
            { id: 'devpost', name: 'Devpost' },
            { id: 'geeksforgeeks', name: 'GeeksForGeeks (gfg)' },
            { id: 'leetcode', name: 'LeetCode' },
            { id: 'unstop', name: 'Unstop' },
            { id: 'stream', name: 'Stream' },
          ]),
        ]);
        setAllEventTypes(categories);
        setAllPlatforms(platforms);
        setSelectedEventTypes(categories.map(c => c.id));
        setSelectedPlatforms(platforms.map(p => p.id));
      } catch (e) {
        toast({ variant: "destructive", title: "Failed to load filter options" });
      }
    };
    loadFilters();
  }, [toast]);

  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearchQuery(searchQuery);
      }, 300);

      return () => {
          clearTimeout(handler);
      };
  }, [searchQuery]);

  useEffect(() => {
    const loadEvents = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const platformsParam = selectedPlatforms.length === allPlatforms.length ? [] : selectedPlatforms;
        const eventTypesParam = selectedEventTypes.length === allEventTypes.length ? [] : selectedEventTypes;
        
        const data = await getEvents({
            eventTypes: eventTypesParam,
            platforms: platformsParam,
            search: debouncedSearchQuery,
        });
        setEvents(data);
      } catch (e) {
        toast({ variant: "destructive", title: "Failed to load events", description: "Could not fetch data from the database." });
      } finally {
        setIsLoading(false);
        if(isInitialLoading) setIsInitialLoading(false);
      }
    };
    if (allPlatforms.length > 0 && allEventTypes.length > 0) {
        loadEvents();
    }
  }, [toast, selectedEventTypes, selectedPlatforms, debouncedSearchQuery, isInitialLoading, allPlatforms, allEventTypes]);

  const handlePrev = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleJump = () => {
    const dateStr = `${jumpYear}-${jumpMonth.padStart(2, '0')}-${jumpDay.padStart(2, '0')}`;
    const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      setCurrentDate(parsedDate);
      setJumpDay(''); setJumpMonth(''); setJumpYear('');
      setIsPopoverOpen(false);
    } else {
      toast({ variant: "destructive", title: "Invalid date jump", description: "Use format YYYY-MM-DD" });
    }
  };

  const getEventsForDay = (day: Date) => events.filter(c => isSameDay(safeParseDate(c.start_time), day));

  const upcomingEvents = useMemo(() => {
    if (!mounted) return [];
    const now = new Date();
    return events
      .filter(c => isAfter(safeParseDate(c.start_time), now) || isSameSecond(safeParseDate(c.start_time), now))
      .sort((a, b) => safeParseDate(a.start_time).getTime() - safeParseDate(b.start_time).getTime());
  }, [events, mounted]);

  const groupedUpcomingEvents = useMemo(() => {
    return upcomingEvents.reduce((acc, event) => {
      const eventDate = safeParseDate(event.start_time);
      let groupName = format(eventDate, 'MMMM d, yyyy');
      if (isToday(eventDate)) groupName = 'Today';
      if (isTomorrow(eventDate)) groupName = 'Tomorrow';
      
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(event);
      return acc;
    }, {} as Record<string, ContestEntry[]>);
  }, [upcomingEvents]);

 const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const start = startOfWeek(monthStart);
    const calendarDays = Array.from({ length: 42 }).map((_, i) => addDays(start, i));
    const displayLimit = 2;

    return (
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 px-4">{day}</div>)}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrMonth = isSameMonth(day, monthStart);
            const isTodayDate = mounted && isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} onClick={() => isCurrMonth && dayEvents.length > 0 && (setSelectedDay(day), setIsDayDetailOpen(true))} className={cn("relative p-4 transition-colors group border-[0.5px] border-white/5 flex flex-col", isCurrMonth ? "bg-background/80" : "bg-white/[0.02] opacity-40", isCurrMonth && dayEvents.length > 0 && "cursor-pointer hover:bg-white/[0.03]")}>
                <span className={cn("text-lg font-bold", isTodayDate && "w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full purple-glow")}>{format(day, 'd')}</span>
                {isCurrMonth && (
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-2">
                    {dayEvents.slice(0, displayLimit).map(c => {
                      const hue = generateHueFromString(c.title);
                      return (
                        <div 
                          key={`${c.platform}-${c.external_id}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(c); }} 
                          title={c.title} 
                          className="px-2 py-0.5 rounded-md text-[9px] font-bold truncate cursor-pointer"
                          style={{
                            backgroundColor: `hsla(${hue}, 50%, 80%, 0.05)`,
                            border: `1px solid hsla(${hue}, 50%, 80%, 0.1)`,
                            color: `hsl(${hue}, 50%, 80%)`
                          }}
                        >
                          {c.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > displayLimit && <div className="text-xs font-bold text-muted-foreground mt-1">+ {dayEvents.length - displayLimit} more</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isInitialLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-body">
      <aside className="w-96 border-r border-white/5 glass-panel flex flex-col z-20">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/calendar.png" className="h-10 w-auto" alt="Calendar Icon"/>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Calendar</h1>
          </div>
        </div>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-muted-foreground"><Search className="w-4 h-4" /><input placeholder="Search events..." className="bg-transparent border-none outline-none w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</h2>{isLoading && !isInitialLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}</div>
            <div className="space-y-4">
              {Object.keys(groupedUpcomingEvents).length === 0 ? <div className="py-8 text-center text-xs text-muted-foreground">{isLoading ? 'Loading...' : 'No upcoming events'}</div> : 
                Object.entries(groupedUpcomingEvents).map(([groupName, events]) => (
                  <div key={groupName}>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{groupName}</p>
                    <div className="space-y-2">
                      {events.map(c => (
                          <div key={`${c.platform}-${c.external_id}`} onClick={() => setSelectedEvent(c)} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all cursor-pointer">
                              <PlatformIcon platform={c.platform} url={c.url} />
                              <div className="flex-1 overflow-hidden min-w-0">
                                  <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">{c.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{format(safeParseDate(c.start_time), 'p')}</p>
                              </div>
                          </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col relative px-8 pb-8">
         {isLoading && !isInitialLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
        <header className="py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10"><Button variant="ghost" className="rounded-full px-5 h-9 text-xs font-bold" onClick={handleToday}>Today</Button><div className="flex"><Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full w-9 h-9"><ChevronLeft className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full w-9 h-9"><ChevronRight className="w-4 h-4" /></Button></div></div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}><PopoverTrigger asChild><button className="text-left group outline-none"><h2 className="text-2xl font-bold font-headline tracking-tight group-hover:text-primary transition-all">{format(currentDate, 'MMMM yyyy')}</h2></button></PopoverTrigger><PopoverContent className="w-72 p-6 bg-card border-white/10 shadow-2xl rounded-2xl"><div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Jump to Date</label><div className="flex items-center gap-2"><div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 h-12 flex-1"><input ref={dayInputRef} placeholder="DD" value={jumpDay} onChange={e => {setJumpDay(e.target.value.slice(0,2)); if(e.target.value.length===2) monthInputRef.current?.focus();}} className="w-7 bg-transparent border-none outline-none text-center font-bold text-sm" /><span className="text-muted-foreground/30 mx-1">/</span><input ref={monthInputRef} placeholder="MM" value={jumpMonth} onChange={e => {setJumpMonth(e.target.value.slice(0,2)); if(e.target.value.length===2) yearInputRef.current?.focus();}} onKeyDown={e => {if(e.key==='Backspace'&&!jumpMonth) dayInputRef.current?.focus();}} className="w-8 bg-transparent border-none outline-none text-center font-bold text-sm" /><span className="text-muted-foreground/30 mx-1">/</span><input ref={yearInputRef} placeholder="YYYY" value={jumpYear} onChange={e => setJumpYear(e.target.value.slice(0,4))} onKeyDown={e => {if(e.key==='Backspace'&&!jumpYear) monthInputRef.current?.focus(); if(e.key==='Enter') handleJump();}} className="w-12 bg-transparent border-none outline-none text-center font-bold text-sm" /></div><Button onClick={handleJump} size="icon" className="h-12 w-12 rounded-xl bg-primary"><ArrowRight className="w-4 h-4" /></Button></div></div></PopoverContent></Popover>
          </div>
          <div className="flex items-center gap-3">
                <a href="https://github.com/localhost9004/calendar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  Star us
                  <Star className="w-4 h-4 text-yellow-400 star-glow" />
                </a>
                <MultiSelectFilter title="Event Types" options={allEventTypes} selected={selectedEventTypes} onSelectionChange={setSelectedEventTypes} />
                <MultiSelectFilter title="Platforms" options={allPlatforms} selected={selectedPlatforms} onSelectionChange={setSelectedPlatforms} />

            <Select value={view} onValueChange={setView}>
              <SelectTrigger className="h-10 rounded-full px-5 bg-white/5 border-white/10 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-card border-white/10">
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>
        {view === 'month' && renderMonthView()}
      </main>

      {selectedEvent && <EventDetailsCard event={selectedEvent} open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)} />}

      <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}><DialogContent className="rounded-2xl bg-card border-white/10 shadow-2xl p-0 max-w-sm">
        {selectedDay && (
          <>
            <DialogHeader className="p-6 text-center relative">
              <DialogTitle className="sr-only">Events for {format(selectedDay, 'MMMM d')}</DialogTitle>
              <p className="text-sm font-bold uppercase text-muted-foreground">{format(selectedDay, 'EEE')}</p>
              <p className="text-5xl font-bold tracking-tight">{format(selectedDay, 'd')}</p>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" onClick={() => setIsDayDetailOpen(false)}><X className="w-4 h-4" /></Button>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-3 px-6 pb-6">
                {getEventsForDay(selectedDay).sort((a,b) => safeParseDate(a.start_time).getTime() - safeParseDate(b.start_time).getTime()).map(c => (
                  <div key={`${c.platform}-${c.external_id}`} onClick={() => { setIsDayDetailOpen(false); setSelectedEvent(c); }} className="flex items-center gap-3 text-left cursor-pointer group">
                    <PlatformIcon platform={c.platform} url={c.url} />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{format(safeParseDate(c.start_time), 'p')}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent></Dialog>
      <style jsx>{`
        .star-glow {
          animation: glow 1.5s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 2px #fef08a); }
          50% { filter: drop-shadow(0 0 8px #fef08a); }
        }
      `}</style>
    </div>
  );
}
