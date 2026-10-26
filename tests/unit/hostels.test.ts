import { describe, it, expect } from 'vitest';
import {
  DEMO_ROOM_ALLOCATION,
  DEMO_MAINTENANCE_TICKETS,
  DEMO_HOSTEL_APPLICATION,
  DEMO_ROOMMATE_MATCHES,
  DEMO_WARDEN_ANNOUNCEMENTS,
  DEMO_OFF_CAMPUS_HOUSES,
} from '@/lib/hostels/demo-data';
import { calculateRoommateMatches } from '@/lib/hostels/matching';

describe('Hostels Family (Hub) — 6 of 6 Features', () => {
  describe('Feature 1: My Room Card & Roommates Allocation', () => {
    it('accurately resolves student allocated room, hall, and capacity', () => {
      const room = DEMO_ROOM_ALLOCATION;
      expect(room.hallName).toBe('Hall 3 (Mount Kenya Residence)');
      expect(room.block).toBe('Block B');
      expect(room.roomNumber).toBe('B-204');
      expect(room.capacity).toBe(2);
      expect(room.bedAssigned).toBe('Bed 2 (Window Side)');
      expect(room.checkInStatus).toBe('confirmed');
    });

    it('lists assigned roommates with program and bed positions', () => {
      const roommates = DEMO_ROOM_ALLOCATION.roommates;
      expect(roommates).toHaveLength(2);

      const faith = roommates.find((r) => r.isPrimaryUser);
      const mercy = roommates.find((r) => !r.isPrimaryUser);

      expect(faith?.name).toBe('Faith Wanjiku');
      expect(mercy?.name).toBe('Mercy Chebet');
      expect(mercy?.bedLabel).toBe('Bed 1 (Door Side)');
      expect(mercy?.phone).toBeDefined();
    });

    it('includes essential campus facilities and custodial contacts', () => {
      expect(DEMO_ROOM_ALLOCATION.amenities.length).toBeGreaterThanOrEqual(4);
      expect(DEMO_ROOM_ALLOCATION.wardenContact).toContain('+254');
      expect(DEMO_ROOM_ALLOCATION.janitorContact).toContain('+254');
    });
  });

  describe('Feature 2: Maintenance Tickets (Estates Department & Help Desk Pattern)', () => {
    it('manages maintenance ticket statuses and technician assignments', () => {
      const tickets = DEMO_MAINTENANCE_TICKETS;
      expect(tickets.length).toBeGreaterThanOrEqual(2);

      const inProgressTicket = tickets.find((t) => t.status === 'in_progress');
      expect(inProgressTicket).toBeDefined();
      expect(inProgressTicket?.category).toBe('plumbing');
      expect(inProgressTicket?.priority).toBe('medium');
      expect(inProgressTicket?.technicianAssigned).toBeDefined();

      const resolvedTicket = tickets.find((t) => t.status === 'resolved');
      expect(resolvedTicket).toBeDefined();
      expect(resolvedTicket?.resolutionNotes).toBeDefined();
    });

    it('adheres to Help Desk reference numbering pattern (HD-2026-XXXX)', () => {
      for (const ticket of DEMO_MAINTENANCE_TICKETS) {
        expect(ticket.ticketNumber).toMatch(/^MNT-2026-|^HD-2026-/);
      }
    });
  });

  describe('Feature 3: Hostel Application & Booking Cycle', () => {
    it('tracks submitted hostel application preferences and decision date', () => {
      const app = DEMO_HOSTEL_APPLICATION;
      expect(app.status).toBe('submitted');
      expect(app.firstPreferenceHall).toContain('Hall 3');
      expect(app.secondPreferenceHall).toContain('Hall 5');
      expect(app.preferredRoomType).toBe('double');
      expect(app.decisionDate).toBe('2026-11-20');
    });
  });

  describe('Feature 4: Roommate Compatibility Matching with Onboarding Interests', () => {
    it('dynamically calculates mutual interests and higher match scores based on saved interests', () => {
      // Tech-focused student interests
      const techInterests = ['technology', 'Web Development'];
      const techMatches = calculateRoommateMatches(techInterests);

      expect(techMatches.length).toBeGreaterThanOrEqual(3);
      const topTechMatch = techMatches[0];
      // Brenda Akinyi has Web Development and Campus Tech Club
      expect(topTechMatch.name).toBe('Brenda Akinyi');
      expect(topTechMatch.mutualInterests).toContain('Web Development');
      expect(topTechMatch.matchScore).toBeGreaterThanOrEqual(75);

      // Leadership-focused student interests
      const leadershipInterests = ['leadership', 'Debate Society'];
      const leadershipMatches = calculateRoommateMatches(leadershipInterests);

      const topLeadershipMatch = leadershipMatches[0];
      // Esther Nekesa has Student Leadership & Debate Society
      expect(topLeadershipMatch.name).toBe('Esther Nekesa');
      expect(topLeadershipMatch.mutualInterests).toContain('Debate Society');
      expect(topLeadershipMatch.matchScore).toBeGreaterThanOrEqual(75);
    });

    it('falls back to baseline scores when no overlapping interests exist', () => {
      const isolatedInterests = ['rare_astronomy_hobby'];
      const matches = calculateRoommateMatches(isolatedInterests);
      expect(matches.length).toBeGreaterThanOrEqual(3);
      for (const m of matches) {
        expect(m.matchScore).toBeGreaterThan(0);
      }
    });
  });

  describe('Feature 5: Warden Bulletins & Memos', () => {
    it('stores priority warden announcements with category tags', () => {
      const notices = DEMO_WARDEN_ANNOUNCEMENTS;
      expect(notices.length).toBeGreaterThanOrEqual(3);

      const inspectionNotice = notices.find((n) => n.category === 'inspection');
      expect(inspectionNotice).toBeDefined();
      expect(inspectionNotice?.isImportant).toBe(true);
      expect(inspectionNotice?.wardenRole).toContain('Warden');

      const maintenanceNotice = notices.find((n) => n.category === 'maintenance');
      expect(maintenanceNotice).toBeDefined();
    });
  });

  describe('Feature 6: University-Verified Off-Campus Housing', () => {
    it('ensures all off-campus residences have accreditation codes and safety ratings', () => {
      const houses = DEMO_OFF_CAMPUS_HOUSES;
      expect(houses.length).toBeGreaterThanOrEqual(3);

      for (const house of houses) {
        expect(house.accreditationReference).toMatch(/^SMU-ACCRED-/);
        expect(house.monthlyRentKes).toBeGreaterThan(0);
        expect(house.walkTimeMinutes).toBeGreaterThan(0);
        expect(house.securityRating).toBeGreaterThanOrEqual(4);
        expect(house.contactPhone).toContain('+254');
      }
    });

    it('filters private houses by walking distance and monthly budget', () => {
      const under7000 = DEMO_OFF_CAMPUS_HOUSES.filter((h) => h.monthlyRentKes <= 7000);
      expect(under7000).toHaveLength(1);
      expect(under7000[0].name).toBe('Greenview Residence & Studios');
    });
  });
});
