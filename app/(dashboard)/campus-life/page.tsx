"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Megaphone,
  RotateCw,
  Users,
  Compass,
  ChevronRight,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCampusLifeAction,
  type ClubItem,
  type EventItem,
} from "@/lib/actions/academics";

export default function CampusLifePage() {
  const [activeTab, setActiveTab] = React.useState<"events" | "clubs">("events");
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [clubs, setClubs] = React.useState<ClubItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [universityName, setUniversityName] = React.useState("Summit Metropolitan University");
  const [selectedEventCategory, setSelectedEventCategory] = React.useState<string>("all");
  const [selectedClubCategory, setSelectedClubCategory] = React.useState<string>("all");

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const res = await getCampusLifeAction();
        if (!ignore && res.success) {
          setEvents(res.events);
          setClubs(res.clubs);
          if (res.universityName) setUniversityName(res.universityName);
        }
      } catch (err) {
        console.error("Failed to load campus life data", err);
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

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await getCampusLifeAction();
      if (res.success) {
        setEvents(res.events);
        setClubs(res.clubs);
        if (res.universityName) setUniversityName(res.universityName);
      }
    } catch (err) {
      console.error("Failed to refresh campus life", err);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                {universityName}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-500" /> Student Life & Extracurriculars
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4 text-xs font-semibold overflow-x-auto py-2.5">
          <Link
            href="/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors pb-1.5 flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Campus Feed
          </Link>
          <Link
            href="/timetable"
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors pb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Weekly Timetable
          </Link>
          <Link
            href="/campus-life"
            className="text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1.5 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Campus Life & Clubs
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Campus Life</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              Student Life, Clubs & Campus Events
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Connect with accredited student societies, hackathons, guest seminars, and community initiatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "events"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Upcoming Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab("clubs")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "clubs"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Student Clubs ({clubs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Campus Events */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs max-w-fit">
              {["all", "hackathon", "workshop", "academic", "career"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedEventCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                    selectedEventCategory === cat
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat === "all" ? "All Events" : cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 animate-pulse bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                  <Calendar className="w-8 h-8 text-slate-400" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No events in this category
                  </h4>
                  <p className="text-xs text-slate-500">
                    Check back soon or explore official student societies and clubs.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="p-5 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 transition-all bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            event.category === "hackathon"
                              ? "danger"
                              : event.category === "workshop"
                              ? "info"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {event.category}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {event.eventDate}
                        </span>
                      </div>

                      <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                        {event.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {event.startTime} {event.endTime ? `- ${event.endTime}` : ""}
                        </span>
                      </div>
                      {event.clubName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-1">
                          <Bookmark className="w-3 h-3" /> Hosted by {event.clubName}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Clubs & Communities */}
        {activeTab === "clubs" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs max-w-fit">
              {["all", "technology", "academic", "community_service"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedClubCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                    selectedClubCategory === cat
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat === "all" ? "All Clubs" : cat.replace("_", " ")}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 animate-pulse bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </Card>
                ))}
              </div>
            ) : filteredClubs.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                  <Users className="w-8 h-8 text-slate-400" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No clubs found in this category
                  </h4>
                  <p className="text-xs text-slate-500">
                    Check back soon as student groups register for the semester.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredClubs.map((club) => (
                  <Card
                    key={club.id}
                    className="p-5 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900 transition-all bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="default" className="capitalize bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {club.category.replace("_", " ")}
                        </Badge>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Club
                        </span>
                      </div>

                      <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                        {club.name}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {club.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 space-y-1 text-xs text-slate-500">
                      {club.patronName && (
                        <p className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Faculty Patron: <strong>{club.patronName}</strong></span>
                        </p>
                      )}
                      {club.campusName && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Campus: {club.campusName}</span>
                        </p>
                      )}
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
