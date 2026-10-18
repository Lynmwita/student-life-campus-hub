import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerStudentAction, deleteStudentForCleanupAction } from "@/lib/actions/sync";
import { getAuditLogsAction } from "@/lib/actions/audit";

describe("Staff Console: Register Student Feature", () => {
  beforeEach(async () => {
    // Clean up test student before each run
    await deleteStudentForCleanupAction("test.register.qa@summit.ac.ke");
    await deleteStudentForCleanupAction("brian.otieno@summit.ac.ke");
  });

  it("successfully registers and provisions a new student via existing ingestion pipeline", async () => {
    const res = await registerStudentAction({
      fullName: "Test Register QA",
      email: "test.register.qa@summit.ac.ke",
      registrationNumber: "SMU/BIT/2026/0998",
      faculty: "School of Computing & Informatics",
      department: "Information Technology",
      yearOfStudy: 1,
      campusCode: "SMU-MAIN",
      initialPassword: "StudentPassword123!",
    });

    expect(res.success).toBe(true);
    expect(res.student).toBeDefined();
    expect(res.student?.fullName).toBe("Test Register QA");
    expect(res.student?.email).toBe("test.register.qa@summit.ac.ke");
    expect(res.student?.registrationNumber).toBe("SMU/BIT/2026/0998");
    expect(res.student?.yearOfStudy).toBe(1);
    expect(res.student?.initialPassword).toBe("StudentPassword123!");

    // Verify audit log has student_registered
    const auditRes = await getAuditLogsAction();
    expect(auditRes.success).toBe(true);
    const registeredLog = auditRes.logs.find(
      (l) => l.action === "student_registered" && l.targetId === "SMU/BIT/2026/0998"
    );
    expect(registeredLog).toBeDefined();
    expect(registeredLog?.actorRole).toBe("staff");
  });

  it("rejects duplicate email with friendly inline error", async () => {
    // Register first time
    const res1 = await registerStudentAction({
      fullName: "Test Register QA",
      email: "test.register.qa@summit.ac.ke",
      registrationNumber: "SMU/BIT/2026/0998",
      faculty: "School of Computing & Informatics",
      department: "Information Technology",
      yearOfStudy: 1,
      campusCode: "SMU-MAIN",
      initialPassword: "StudentPassword123!",
    });
    expect(res1.success).toBe(true);

    // Attempt second time with same email but different reg number
    const res2 = await registerStudentAction({
      fullName: "Another Name",
      email: "test.register.qa@summit.ac.ke",
      registrationNumber: "SMU/BIT/2026/9999",
      faculty: "School of Computing & Informatics",
      department: "Information Technology",
      yearOfStudy: 1,
      campusCode: "SMU-MAIN",
      initialPassword: "StudentPassword123!",
    });

    expect(res2.success).toBe(false);
    expect(res2.error).toBe("A student with this email already exists");
  });

  it("rejects duplicate registration number with friendly inline error", async () => {
    // Register first time
    const res1 = await registerStudentAction({
      fullName: "Brian Otieno",
      email: "brian.otieno@summit.ac.ke",
      registrationNumber: "SMU/BIT/2026/1002",
      faculty: "School of Computing & Informatics",
      department: "Information Technology",
      yearOfStudy: 1,
      campusCode: "SMU-MAIN",
      initialPassword: "StudentPassword123!",
    });
    expect(res1.success).toBe(true);

    // Attempt second time with different email but same reg number
    const res2 = await registerStudentAction({
      fullName: "Another Student",
      email: "different.email@summit.ac.ke",
      registrationNumber: "SMU/BIT/2026/1002",
      faculty: "School of Computing & Informatics",
      department: "Information Technology",
      yearOfStudy: 1,
      campusCode: "SMU-MAIN",
      initialPassword: "StudentPassword123!",
    });

    expect(res2.success).toBe(false);
    expect(res2.error).toBe("A student with this registration number already exists");
  });

  it("validates required fields and password length", async () => {
    const res = await registerStudentAction({
      fullName: "",
      email: "not-an-email",
      registrationNumber: "",
      faculty: "",
      department: "",
      yearOfStudy: 0,
      campusCode: "SMU-MAIN",
      initialPassword: "short",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
