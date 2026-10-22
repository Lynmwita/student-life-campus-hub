"use client";

import {withOffline} from "@/lib/offline";
import {CampusCalendar,type CalendarItem} from "@/components/campus-calendar";
import {getParticipationAction,setParticipationAction} from "@/lib/actions/participation";
import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  GraduationCap,
  Megaphone,
  RotateCw,
  Users,
  Compass,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  LifeBuoy,
  Check,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/shared/app-header";
import {
  getCampusLifeAction,
  type ClubItem,
  type EventItem,
} from "@/lib/actions/academics";

export default function CampusLifePage() {
  const [activeTab, setActiveTab] = React.useState<"events" | "clubs">("events");
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [clubs, setClubs] = React.useState<ClubItem[]>([]);
  const [calendarItems,setCalendarItems]=React.useState<CalendarItem[]>([]);
  const [saveMessage,setSaveMessage]=React.useState("");
  const [loadError,setLoadError]=React.useState("");
  const [hasLoadedData,setHasLoadedData]=React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [universityName, setUniversityName] = React.useState("Your university");
  const [selectedEventCategory, setSelectedEventCategory] = React.useState<string>("all");
  const [selectedClubCategory, setSelectedClubCategory] = React.useState<string>("all");

  const [rsvpedEventIds, setRsvpedEventIds] = React.useState<string[]>([]);
  const [joinedClubIds, setJoinedClubIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    let ignore = false;

    getParticipationAction().then(r=>{if(!ignore&&r.success){setRsvpedEventIds(r.eventIds);setJoinedClubIds(r.clubIds);}}).catch(()=>setSaveMessage('Connect to load your saved memberships and RSVPs.'));

    async function loadData() {
      try {
        const res = await withOffline("getCampusLifeAction", getCampusLifeAction);
        if(!ignore&&!res.success)throw new Error(res.message||'Campus life could not be loaded.');
        if (!ignore && res.success) {
          setHasLoadedData(true);setLoadError('');
          setEvents(res.events);
          setCalendarItems(res.calendarItems??[]);
          setClubs(res.clubs);
          if (res.universityName) setUniversityName(res.universityName);
        }
      } catch (err) {
        if(!ignore)setLoadError(err instanceof Error?err.message:'Campus life is unavailable. Please reconnect and try again.');
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleToggleRsvp(eventId: string) {
 try{const joined=!rsvpedEventIds.includes(eventId);const r=await setParticipationAction('event',eventId,joined);setSaveMessage(r.message);if(r.success)setRsvpedEventIds(prev=>joined?[...prev,eventId]:prev.filter(id=>id!==eventId));}catch{setSaveMessage('Please connect to save your RSVP.');}
 }
 async function handleToggleJoinClub(clubId:string){
 try{const joined=!joinedClubIds.includes(clubId);const r=await setParticipationAction('club',clubId,joined);setSaveMessage(r.message);if(r.success)setJoinedClubIds(prev=>joined?[...prev,clubId]:prev.filter(id=>id!==clubId));}catch{setSaveMessage('Please connect to join this club.');}
 }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await withOffline("getCampusLifeAction", getCampusLifeAction);
      if(!res.success)throw new Error(res.message||'Campus life could not be refreshed.');
      if (res.success) {
        setHasLoadedData(true);setLoadError('');
        setEvents(res.events);
        setCalendarItems(res.calendarItems??[]);
        setClubs(res.clubs);
        if (res.universityName) setUniversityName(res.universityName);
      }
    } catch (err) {
      setLoadError(err instanceof Error?err.message:'Could not refresh campus life.');
    } finally {
      setRefreshing(false);
    }
  }

  const filteredEvents = events.filter((e) => {
    if (selectedEventCategory === "all") return true;
    return e.category === selectedEventCategory;
  });

  const filteredClubs = clubs.filter((c) => {
    if (selectedClubCategory === "all") return true;
    return c.category === selectedClubCategory;
  });

  function parseDateBadge(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { month: "EVT", day: "•" };
    }
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: String(d.getDate()).padStart(2, "0"),
    };
  }

  if(!loading&&loadError&&!hasLoadedData)return <div className="min-h-screen bg-[#F8FAFC]"><AppHeader universityName={universityName}/><main className="max-w-5xl mx-auto p-6 space-y-4"><h1 className="text-2xl font-bold">Campus life unavailable</h1><p role="alert" className="rounded border border-amber-300 bg-amber-50 p-4">{loadError} No current data could be loaded.</p><Button onClick={handleRefresh} disabled={refreshing}>{refreshing?'Retrying…':'Try again'}</Button></main></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <AppHeader universityName={universityName} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {loadError&&<p role="alert" className="rounded border border-amber-300 bg-amber-50 p-4">Could not refresh: {loadError} Displaying previously loaded information; it may be out of date.</p>}
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C59B27]/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#0B1D33] font-semibold">Campus Life</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B1D33] tracking-tight flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-[#C59B27]" />
              Campus Life
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Official university societies • Hackathons • Faculty guest seminars • Community initiatives
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented text tabs with solid gold indicator under active one */}
            <div className="flex items-center gap-4 border-b border-[#C59B27]/20 sm:border-b-0 pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab("events")}
                className={`pb-2 sm:pb-1 text-xs font-serif font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "events"
                    ? "text-[#0B1D33] border-b-2 border-[#C59B27]"
                    : "text-slate-500 hover:text-[#0B1D33]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#C59B27]" /> Upcoming Events ({events.length})
              </button>
              <button
                onClick={() => setActiveTab("clubs")}
                className={`pb-2 sm:pb-1 text-xs font-serif font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "clubs"
                    ? "text-[#0B1D33] border-b-2 border-[#C59B27]"
                    : "text-slate-500 hover:text-[#0B1D33]"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#C59B27]" /> Student Clubs ({clubs.length})
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="text-xs border-[#C59B27]/40 text-[#0B1D33] hover:bg-slate-100"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-[#C59B27]" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <p role="status">{saveMessage}</p>
 <CampusCalendar items={calendarItems}/>
 {/* Tab 1: Campus Events */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs max-w-fit border border-slate-200">
              {["all", "hackathon", "workshop", "academic", "career"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedEventCategory(cat)}
                  className={`px-3 py-1 rounded font-semibold capitalize transition-colors ${
                    selectedEventCategory === cat
                      ? "bg-[#0B1D33] text-[#FCD34D] shadow-xs border border-[#C59B27]/40"
                      : "text-slate-600 hover:text-[#0B1D33]"
                  }`}
                >
                  {cat === "all" ? "All Events" : cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 animate-pulse bg-white border-[#C59B27]/20">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="border border-[#C59B27]/30 p-8 text-center bg-white">
                <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                  <Calendar className="w-8 h-8 text-[#C59B27]" />
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                    No Events in This Category
                  </h4>
                  <p className="text-xs text-slate-500">
                    Check back soon or explore official student societies and clubs.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredEvents.map((event) => {
                  const dateParts = parseDateBadge(event.eventDate);

                  return (
                    <Card
                      key={event.id}
                      className="p-5 border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all bg-white shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {/* Square Navy Date Badge with Gold Typography */}
                          <div className="bg-[#0B1D33] border border-[#C59B27]/40 rounded-lg p-2 text-center flex flex-col items-center justify-center min-w-[56px] min-h-[56px] shrink-0 shadow-xs">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-[#FCD34D] leading-none">
                              {dateParts.month}
                            </span>
                            <span className="text-xl font-bold font-serif text-white leading-none mt-1">
                              {dateParts.day}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge variant="info" className="capitalize text-[10px] px-2 py-0.5">
                                {event.category}
                              </Badge>
                              <span className="text-[11px] font-mono text-slate-500">
                                {event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}
                              </span>
                            </div>

                            <h4 className="font-serif font-bold text-base text-[#0B1D33] leading-snug">
                              {event.title}
                            </h4>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {event.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#C59B27]/15 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                            <span className="font-medium text-slate-700">
                              {event.venue}
                            </span>
                          </div>
                          {event.clubName && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#C59B27] font-semibold">
                              <Bookmark className="w-3 h-3" /> Hosted by {event.clubName}
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleToggleRsvp(event.id)}
                          className={`text-xs gap-1.5 h-8 font-semibold transition-all shrink-0 ${
                            rsvpedEventIds.includes(event.id)
                              ? "bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600 shadow-xs"
                              : "bg-[#0B1D33] hover:bg-[#06101E] text-[#FCD34D] border border-[#C59B27]/50 shadow-xs"
                          }`}
                        >
                          {rsvpedEventIds.includes(event.id) ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              Attending (RSVP Confirmed)
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#FCD34D]" />
                              RSVP to Attend
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Clubs & Communities */}
        {activeTab === "clubs" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs max-w-fit border border-slate-200">
              {["all", "technology", "academic", "community_service"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedClubCategory(cat)}
                  className={`px-3 py-1 rounded font-semibold capitalize transition-colors ${
                    selectedClubCategory === cat
                      ? "bg-[#0B1D33] text-[#FCD34D] shadow-xs border border-[#C59B27]/40"
                      : "text-slate-600 hover:text-[#0B1D33]"
                  }`}
                >
                  {cat === "all" ? "All Clubs" : cat.replace("_", " ")}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 animate-pulse bg-white border-[#C59B27]/20">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </Card>
                ))}
              </div>
            ) : filteredClubs.length === 0 ? (
              <Card className="border border-[#C59B27]/30 p-8 text-center bg-white">
                <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                  <Users className="w-8 h-8 text-[#C59B27]" />
                  <h4 className="font-serif font-bold text-sm text-[#0B1D33]">
                    No Clubs Found in This Category
                  </h4>
                  <p className="text-xs text-slate-500">
                    Check back soon as student groups register for the academic semester.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredClubs.map((club) => (
                  <Card
                    key={club.id}
                    className="p-5 border border-[#C59B27]/30 hover:border-[#C59B27]/70 transition-all bg-white shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="default" className="capitalize">
                          {club.category.replace("_", " ")}
                        </Badge>
                        <span className="text-[11px] text-[#C59B27] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accredited Society
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#0B1D33] leading-snug">
                        {club.name}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {club.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#C59B27]/15 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-sans">
                      <div className="space-y-1">
                        {club.patronName && (
                          <p className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                            <span>Patron • <strong>{club.patronName}</strong></span>
                          </p>
                        )}
                        {club.campusName && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Campus • {club.campusName}</span>
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleToggleJoinClub(club.id)}
                        className={`text-xs gap-1.5 h-8 font-semibold transition-all shrink-0 ${
                          joinedClubIds.includes(club.id)
                            ? "bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600 shadow-xs"
                            : "bg-[#0B1D33] hover:bg-[#06101E] text-[#FCD34D] border border-[#C59B27]/50 shadow-xs"
                        }`}
                      >
                        {joinedClubIds.includes(club.id) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            Member (Active)
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-[#FCD34D]" />
                            Join Society
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
