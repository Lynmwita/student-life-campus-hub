'use client';

import * as React from 'react';
import {
  RoomAllocation,
  MaintenanceTicket,
  HostelApplication,
  RoommateMatchProfile,
  WardenAnnouncement,
  VerifiedOffCampusHouse,
  MaintenanceCategory,
  TicketPriority,
  RoomType,
} from '@/lib/hostels/types';
import {
  createHostelMaintenanceTicketAction,
  submitHostelApplicationAction,
} from '@/lib/actions/hostels';
import {
  Building,
  Bed,
  Wrench,
  Users,
  Megaphone,
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Info,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';

interface HostelsClientProps {
  initialAllocation: RoomAllocation | null;
  initialTickets: MaintenanceTicket[];
  initialApplication: HostelApplication | null;
  initialMatches: RoommateMatchProfile[];
  initialAnnouncements: WardenAnnouncement[];
  initialOffCampusHouses: VerifiedOffCampusHouse[];
  isDemo: boolean;
}

export function HostelsClient({
  initialAllocation,
  initialTickets,
  initialApplication,
  initialMatches,
  initialAnnouncements,
  initialOffCampusHouses,
  isDemo,
}: HostelsClientProps) {
  const [activeTab, setActiveTab] = React.useState<
    'my_room' | 'maintenance' | 'application' | 'roommates' | 'warden' | 'off_campus'
  >('my_room');

  // Maintenance Ticket Form State
  const [tickets, setTickets] = React.useState<MaintenanceTicket[]>(initialTickets);
  const [showNewTicketModal, setShowNewTicketModal] = React.useState(false);
  const [ticketCategory, setTicketCategory] = React.useState<MaintenanceCategory>('plumbing');
  const [ticketTitle, setTicketTitle] = React.useState('');
  const [ticketDesc, setTicketDesc] = React.useState('');
  const [ticketPriority, setTicketPriority] = React.useState<TicketPriority>('medium');
  const [submittingTicket, setSubmittingTicket] = React.useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = React.useState('');

  // Application State
  const [application, setApplication] = React.useState<HostelApplication | null>(initialApplication);
  const [prefHall1, setPrefHall1] = React.useState('Hall 3 (Mount Kenya Residence)');
  const [prefHall2, setPrefHall2] = React.useState('Hall 5 (Kilimanjaro Hall)');
  const [roomType, setRoomType] = React.useState<RoomType>('double');
  const [specialNeeds, setSpecialNeeds] = React.useState('');
  const [submittingApp, setSubmittingApp] = React.useState(false);
  const [appSuccessMsg, setAppSuccessMsg] = React.useState('');

  // Roommate connect state
  const [connectedRoommateIds, setConnectedRoommateIds] = React.useState<string[]>([]);

  // Off campus filter state
  const [offCampusSearch, setOffCampusSearch] = React.useState('');
  const [maxRentFilter, setMaxRentFilter] = React.useState<number>(10000);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;

    setSubmittingTicket(true);
    setTicketSuccessMsg('');
    try {
      const res = await createHostelMaintenanceTicketAction({
        category: ticketCategory,
        title: ticketTitle,
        description: ticketDesc,
        priority: ticketPriority,
        hallName: initialAllocation?.hallName || 'Hall 3 (Mount Kenya)',
        roomNumber: initialAllocation?.roomNumber || 'B-204',
      });

      if (res.success && res.ticket) {
        setTickets((prev) => [res.ticket!, ...prev]);
        setTicketTitle('');
        setTicketDesc('');
        setShowNewTicketModal(false);
        setTicketSuccessMsg('Maintenance ticket submitted to the Estates Department.');
        setTimeout(() => setTicketSuccessMsg(''), 5000);
      }
    } finally {
      setSubmittingTicket(false);
    }
  }

  async function handleSubmitApplication(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingApp(true);
    setAppSuccessMsg('');
    try {
      const res = await submitHostelApplicationAction({
        firstPreferenceHall: prefHall1,
        secondPreferenceHall: prefHall2,
        preferredRoomType: roomType,
        specialNeedsDescription: specialNeeds,
      });

      if (res.success && res.application) {
        setApplication(res.application);
        setAppSuccessMsg('Your hostel residence application has been recorded for review.');
      }
    } finally {
      setSubmittingApp(false);
    }
  }

  function toggleConnectRoommate(id: string) {
    setConnectedRoommateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const filteredOffCampus = initialOffCampusHouses.filter((house) => {
    const matchesSearch =
      house.name.toLowerCase().includes(offCampusSearch.toLowerCase()) ||
      house.location.toLowerCase().includes(offCampusSearch.toLowerCase());
    const matchesRent = house.monthlyRentKes <= maxRentFilter;
    return matchesSearch && matchesRent;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1D33]">
              Hostels & Student Residence
            </h1>
            {isDemo && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                Demo Resident
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Campus room allocations, maintenance requests, roommate pairing, and verified private housing.
          </p>
        </div>

        {/* 6 Tab Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('my_room')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              activeTab === 'my_room'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            My Room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              activeTab === 'maintenance'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Maintenance
            {tickets.filter((t) => t.status === 'in_progress').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {tickets.filter((t) => t.status === 'in_progress').length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('application')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              activeTab === 'application'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Application
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roommates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              activeTab === 'roommates'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Roommate Match
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('warden')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              activeTab === 'warden'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            Warden Notices
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('off_campus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              activeTab === 'off_campus'
                ? 'bg-white text-[#0B1D33] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Off-Campus Housing
          </button>
        </div>
      </div>

      {ticketSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ticketSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: MY ROOM CARD */}
      {activeTab === 'my_room' && (
        <div className="space-y-6">
          {!initialAllocation ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <Bed className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#0B1D33]">No Active On-Campus Room</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                You are currently registered as a non-resident student or waiting for room allocation.
                You can apply for next semester accommodation or explore verified private housing.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('application')}
                  className="px-4 py-2 rounded-lg bg-[#0B1D33] text-white text-xs font-semibold hover:bg-[#06101E]"
                >
                  Apply for Hostel
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('off_campus')}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Explore Off-Campus
                </button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Room Primary Hero Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Hero Header */}
                  <div className="bg-[#0B1D33] text-white p-6 sm:p-7 border-b border-[#06101E]">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C59B27] text-[#0B1D33]">
                            Active Resident
                          </span>
                          <span className="text-xs text-slate-300 font-mono">
                            {initialAllocation.academicYear} · Semester {initialAllocation.semester}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-2">
                          {initialAllocation.hallName}
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                          {initialAllocation.block} · Floor {initialAllocation.floor} · {initialAllocation.roomNumber}
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-3 rounded-xl shrink-0 text-right sm:text-left">
                        <p className="text-[10px] text-slate-300 uppercase tracking-wide font-medium">
                          Assigned Position
                        </p>
                        <p className="text-sm font-bold text-[#FCD34D] mt-0.5 font-mono">
                          {initialAllocation.bedAssigned}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Capacity: {initialAllocation.capacity} Students ({initialAllocation.roomType})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Room Quick Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/60 border-b border-slate-200 text-xs">
                    <div className="p-4">
                      <span className="text-slate-500 font-medium block">Check-in Date</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block font-mono">
                        {initialAllocation.checkInDate}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="text-slate-500 font-medium block">Check-out Deadline</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block font-mono">
                        {initialAllocation.checkOutDeadline}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="text-slate-500 font-medium block">Key Clearance</span>
                      <span className="font-semibold text-emerald-800 mt-0.5 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="text-slate-500 font-medium block">Hall Custodian</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {initialAllocation.wardenName}
                      </span>
                    </div>
                  </div>

                  {/* Room Amenities Section */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xs font-bold text-[#0B1D33] uppercase tracking-wider">
                      Included Room & Floor Facilities
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {initialAllocation.amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C59B27] shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Roommates Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1D33]">
                        Assigned Roommates ({initialAllocation.roommates.length})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Students sharing {initialAllocation.roomNumber} this semester.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('roommates')}
                      className="text-xs text-[#0B1D33] font-semibold hover:text-[#C59B27] underline underline-offset-2"
                    >
                      Find next semester partner
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {initialAllocation.roommates.map((rm) => (
                      <div
                        key={rm.id}
                        className={`rounded-xl border p-4 transition-all ${
                          rm.isPrimaryUser
                            ? 'bg-amber-50/60 border-amber-200 text-[#0B1D33]'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs">{rm.name}</h4>
                              {rm.isPrimaryUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#0B1D33] text-white">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {rm.admissionNumber} · Year {rm.yearOfStudy}
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                              {rm.program}
                            </p>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {rm.bedLabel}
                          </span>
                        </div>

                        {!rm.isPrimaryUser && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
                            {rm.phone && (
                              <a
                                href={`tel:${rm.phone}`}
                                className="flex items-center gap-1 text-[#0B1D33] hover:text-[#C59B27] font-medium"
                              >
                                <Phone className="w-3 h-3" /> Call
                              </a>
                            )}
                            <a
                              href={`mailto:${rm.email}`}
                              className="flex items-center gap-1 text-[#0B1D33] hover:text-[#C59B27] font-medium"
                            >
                              <Mail className="w-3 h-3" /> Email
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Warden Contacts & Fast Actions */}
              <div className="space-y-6">
                {/* Emergency & Custodian Notice */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-[#0B1D33] uppercase tracking-wider">
                    Hall Administration
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-medium block">Hall Warden (Dean)</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {initialAllocation.wardenName}
                      </span>
                      <a
                        href={`tel:${initialAllocation.wardenContact}`}
                        className="text-[#0B1D33] hover:text-[#C59B27] font-mono font-semibold mt-1 inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {initialAllocation.wardenContact}
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-medium block">Block B Janitor & Keys</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        Facilities Ground Custodian
                      </span>
                      <a
                        href={`tel:${initialAllocation.janitorContact}`}
                        className="text-[#0B1D33] hover:text-[#C59B27] font-mono font-semibold mt-1 inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {initialAllocation.janitorContact}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-[#0B1D33] uppercase tracking-wider">
                    Hostel Shortcuts
                  </h3>
                  <div className="space-y-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('maintenance');
                        setShowNewTicketModal(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#C59B27] hover:bg-amber-50/40 text-left transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-[#C59B27]" />
                        <span className="font-semibold text-slate-900">Report a Room Repair</span>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('warden')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#C59B27] hover:bg-amber-50/40 text-left transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Megaphone className="w-4 h-4 text-[#C59B27]" />
                        <span className="font-semibold text-slate-900">Hall Warden Memos</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {initialAnnouncements.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('off_campus')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#C59B27] hover:bg-amber-50/40 text-left transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-[#C59B27]" />
                        <span className="font-semibold text-slate-900">Off-Campus Housing</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Verified
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAINTENANCE TICKETS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-[#0B1D33]">Hostel Maintenance & Repairs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Report electrical, plumbing, carpentry, or lock issues directly to campus estates technicians.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewTicketModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1D33] text-white text-xs font-semibold hover:bg-[#06101E] transition shrink-0"
            >
              <Plus className="w-4 h-4 text-[#FCD34D]" /> Report Room Issue
            </button>
          </div>

          {/* New Ticket Modal / Form */}
          {showNewTicketModal && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#0B1D33]">Log a Room Maintenance Request</h3>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Issue Category
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as MaintenanceCategory)}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden bg-white"
                    >
                      <option value="plumbing">Plumbing & Water Leakage</option>
                      <option value="electrical">Electrical, Lighting & Sockets</option>
                      <option value="carpentry">Carpentry, Desks & Wardrobes</option>
                      <option value="lock_key">Door Lock & Padlock</option>
                      <option value="wifi_network">Wi-Fi & Network Access Point</option>
                      <option value="window_glass">Window Glazing & Latches</option>
                      <option value="pest_control">Fumigation & Pest Control</option>
                      <option value="other">General Facilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden bg-white"
                    >
                      <option value="low">Low (Routine maintenance)</option>
                      <option value="medium">Medium (Standard 24-hour turnaround)</option>
                      <option value="urgent">Urgent (Immediate safety / water leak)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Problem Summary
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken study desk hinge or dripping shower head"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific details to help the technician arrive with the right tools..."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="px-5 py-2 rounded-lg bg-[#0B1D33] text-white text-xs font-semibold hover:bg-[#06101E] disabled:opacity-50"
                  >
                    {submittingTicket ? 'Submitting...' : 'Dispatch Ticket'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets List */}
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No maintenance tickets logged. Your room has a clean maintenance record.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0B1D33]">
                        {t.ticketNumber}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {t.categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {t.status === 'resolved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Resolved
                        </span>
                      ) : t.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Reported
                        </span>
                      )}

                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          t.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : t.priority === 'medium'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#0B1D33]">{t.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                    <span>Location: {t.hallName} · Room {t.roomNumber}</span>
                    {t.technicianAssigned && (
                      <span className="text-[#0B1D33]">
                        Assigned: <strong>{t.technicianAssigned}</strong>
                      </span>
                    )}
                    <span>Logged on {new Date(t.createdAt).toLocaleDateString('en-KE')}</span>
                  </div>

                  {t.resolutionNotes && (
                    <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-lg text-xs text-emerald-950">
                      <strong>Resolution Note:</strong> {t.resolutionNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HOSTEL APPLICATION */}
      {activeTab === 'application' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Application Status Banner */}
          {application && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                    Application Ref: {application.applicationNumber}
                  </span>
                  <h3 className="text-sm font-bold text-[#0B1D33] mt-0.5">
                    {application.academicYear} · Semester {application.semester} Room Booking
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  {application.status === 'submitted' ? 'Under Review' : application.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">1st Preference</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {application.firstPreferenceHall}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">2nd Preference</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {application.secondPreferenceHall}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Room Type: <strong className="text-slate-800 capitalize">{application.preferredRoomType}</strong></span>
                {application.decisionDate && (
                  <span>Decision Expected: <strong className="text-slate-800 font-mono">{application.decisionDate}</strong></span>
                )}
              </div>
            </div>
          )}

          {appSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{appSuccessMsg}</span>
            </div>
          )}

          {/* New / Re-apply Application Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#0B1D33]">
                {application ? 'Update Hostel Application' : 'Apply for Campus Hostel'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit room preferences for the upcoming semester allocation cycle. Allocations are prioritized by academic standing and special accommodations.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  1st Choice Residence Hall
                </label>
                <select
                  value={prefHall1}
                  onChange={(e) => setPrefHall1(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden bg-white"
                >
                  <option value="Hall 3 (Mount Kenya Residence)">Hall 3 - Mount Kenya Residence (Female)</option>
                  <option value="Hall 5 (Kilimanjaro Hall)">Hall 5 - Kilimanjaro Hall (Female)</option>
                  <option value="Hall 1 (Aberdares Hall)">Hall 1 - Aberdares Hall (Male)</option>
                  <option value="Hall 2 (Menengai Hall)">Hall 2 - Menengai Hall (Male)</option>
                  <option value="Hall 4 (Elgon Postgraduate Suite)">Hall 4 - Elgon Suites (Mixed / Postgrad)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  2nd Choice Residence Hall
                </label>
                <select
                  value={prefHall2}
                  onChange={(e) => setPrefHall2(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden bg-white"
                >
                  <option value="Hall 5 (Kilimanjaro Hall)">Hall 5 - Kilimanjaro Hall (Female)</option>
                  <option value="Hall 3 (Mount Kenya Residence)">Hall 3 - Mount Kenya Residence (Female)</option>
                  <option value="Hall 2 (Menengai Hall)">Hall 2 - Menengai Hall (Male)</option>
                  <option value="Hall 4 (Elgon Postgraduate Suite)">Hall 4 - Elgon Suites</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Preferred Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden bg-white"
                >
                  <option value="double">Double Occupancy (2 Students)</option>
                  <option value="single">Single Private Room (Subject to seniority & fee surcharge)</option>
                  <option value="quad">Quad Occupancy (4 Students, Budget tier)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Special Accommodation Requests (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ground floor preference for mobility, proximity to laboratories, medical dietary requirements..."
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-[#0B1D33] outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="w-full py-2.5 rounded-lg bg-[#0B1D33] text-white text-xs font-semibold hover:bg-[#06101E] transition disabled:opacity-50"
                >
                  {submittingApp ? 'Submitting Application...' : 'Submit Hostel Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: ROOMMATE MATCHING */}
      {activeTab === 'roommates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C59B27]" />
              <h2 className="text-base font-bold text-[#0B1D33]">
                Roommate Compatibility Engine
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Find compatible campus roommates based on verified study habits, sleep schedules, cleanliness, and quiet hours tolerance. Pair up prior to room allocation for mutual placement.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialMatches.map((match) => {
              const isConnected = connectedRoommateIds.includes(match.id);
              return (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#C59B27]/70 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-[#0B1D33]">{match.name}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {match.admissionNumber} · Year {match.yearOfStudy}
                        </p>
                        <p className="text-xs text-slate-700 font-medium mt-0.5">
                          {match.program}
                        </p>
                      </div>

                      <div className="bg-[#0B1D33] text-[#FCD34D] px-2.5 py-1 rounded-lg text-right shrink-0">
                        <span className="font-mono text-sm font-bold">{match.matchScore}%</span>
                        <span className="text-[9px] block text-slate-300 font-sans uppercase">Match</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      &quot;{match.bio}&quot;
                    </p>

                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sleep Schedule:</span>
                        <span className="font-medium text-slate-800 capitalize">
                          {match.preferences.sleepSchedule.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Study Habit:</span>
                        <span className="font-medium text-slate-800 capitalize">
                          {match.preferences.studyHabit.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cleanliness:</span>
                        <span className="font-medium text-slate-800 capitalize">
                          {match.preferences.cleanliness.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-1">
                      {match.mutualInterests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={`mailto:${match.contactEmail}`}
                      className="text-xs text-[#0B1D33] hover:text-[#C59B27] font-semibold flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>

                    <button
                      type="button"
                      onClick={() => toggleConnectRoommate(match.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-[#0B1D33] text-white hover:bg-[#06101E]'
                      }`}
                    >
                      {isConnected ? 'Request Sent' : 'Request Pairing'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: WARDEN ANNOUNCEMENTS */}
      {activeTab === 'warden' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1D33]">Hostel Warden Bulletins</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official notices from Hall Wardens, Matrons, and Dean of Students.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {initialAnnouncements.length} Active Memos
            </span>
          </div>

          <div className="space-y-3">
            {initialAnnouncements.map((memo) => (
              <div
                key={memo.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3 transition ${
                  memo.isImportant
                    ? 'border-l-4 border-l-[#C59B27] border-slate-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-[#0B1D33]">{memo.title}</h3>
                    {memo.isImportant && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        Priority
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(memo.publishedAt).toLocaleDateString('en-KE')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{memo.content}</p>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-50">
                  <span>Scope: <strong className="text-slate-800">{memo.hallScope}</strong></span>
                  <span className="font-medium text-slate-700">
                    Issued by: {memo.wardenName} ({memo.wardenRole})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: VERIFIED OFF-CAMPUS HOUSES */}
      {activeTab === 'off_campus' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#0B1D33]">
                    University-Verified Private Housing
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Inspected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Private student accommodations inspected and accredited for security, water reliability, and student safety.
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                {filteredOffCampus.length} Approved Residences
              </span>
            </div>

            {/* Filter controls */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, gate, or avenue..."
                  value={offCampusSearch}
                  onChange={(e) => setOffCampusSearch(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-[#0B1D33] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Max Rent:</span>
                <span className="font-mono font-bold text-[#0B1D33]">
                  KES {maxRentFilter.toLocaleString('en-KE')} / mo
                </span>
                <input
                  type="range"
                  min={5000}
                  max={12000}
                  step={500}
                  value={maxRentFilter}
                  onChange={(e) => setMaxRentFilter(Number(e.target.value))}
                  className="w-32 accent-[#0B1D33]"
                />
              </div>
            </div>
          </div>

          {/* Housing Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOffCampus.map((house) => (
              <div
                key={house.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#C59B27] transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {house.accreditationReference}
                      </div>
                      <h3 className="font-bold text-sm text-[#0B1D33]">{house.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C59B27] shrink-0" />
                        {house.location}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-[#0B1D33] font-mono">
                        KES {house.monthlyRentKes.toLocaleString('en-KE')}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-sans">/ month</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                    <span>{house.distanceFromCampusKm * 1000}m from gate</span>
                    <span className="font-semibold">{house.walkTimeMinutes} min walk</span>
                    <span>Security: {house.securityRating}/5</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Available Room Types:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {house.roomTypesAvailable.map((rt, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                        >
                          {rt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Key Amenities:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {house.amenities.slice(0, 4).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3 h-3 text-[#C59B27] shrink-0" />
                          <span className="truncate">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Caretaker</span>
                    <span className="font-bold text-slate-800">{house.caretakerName}</span>
                  </div>

                  <a
                    href={`tel:${house.contactPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1D33] text-white font-semibold hover:bg-[#06101E] transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#FCD34D]" /> Call to Book
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
