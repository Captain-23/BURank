import { describe, it, expect } from "vitest";
import { parseCsvLine, parseRosterCsv } from "./roster";

describe("parseCsvLine", () => {
  it("parses quoted fields that contain commas", () => {
    expect(
      parseCsvLine('nealwu,"last, first@bennett.edu.in",2026-01-01,3rd,E21CSE001'),
    ).toEqual([
      "nealwu",
      "last, first@bennett.edu.in",
      "2026-01-01",
      "3rd",
      "E21CSE001",
    ]);
  });
});

describe("parseRosterCsv", () => {
  it("parses rows and lowercases username/email", () => {
    const csv =
      "username,email,addedAt,yearStudying,enrollmentNo\n" +
      "NealWu,Neal@BU.edu,2026-01-01,3rd,E21CSE001\n";
    const rows = parseRosterCsv(csv);
    expect(rows).toEqual([
      {
        username: "nealwu",
        email: "neal@bu.edu",
        addedAt: "2026-01-01",
        yearStudying: "3rd",
        enrollmentNo: "E21CSE001",
      },
    ]);
  });

  it("normalizes enrollment numbers", () => {
    const csv =
      "username,email,addedAt,yearStudying,enrollmentNo\n" +
      "bob,b@x.com,2026-01-01,2nd,a23 0521026\n";
    const rows = parseRosterCsv(csv);
    expect(rows[0]?.enrollmentNo).toBe("A230521026");
  });

  it("handles quoted email fields without shifting columns", () => {
    const csv =
      "username,email,addedAt,yearStudying,enrollmentNo\n" +
      'alice,"last, first@bennett.edu.in",2026-01-01,4th,A230521026\n';
    const rows = parseRosterCsv(csv);
    expect(rows[0]).toEqual({
      username: "alice",
      email: "last, first@bennett.edu.in",
      addedAt: "2026-01-01",
      yearStudying: "4th",
      enrollmentNo: "A230521026",
    });
  });

  it("parses legacy rows without an email column", () => {
    const csv =
      "username,addedAt,yearStudying,enrollmentNo,password\n" +
      "bob,2024-01-01,3rd,A230521026,secret\n";
    const rows = parseRosterCsv(csv);
    expect(rows[0]).toEqual({
      username: "bob",
      email: "",
      addedAt: "2024-01-01",
      yearStudying: "3rd",
      enrollmentNo: "A230521026",
    });
  });

  it("parses legacy rows when addedAt was stored in the email column", () => {
    const csv =
      "username,email,addedAt,yearStudying,enrollmentNo\n" +
      "carol,2024-01-01,3rd,A230521027\n";
    const rows = parseRosterCsv(csv);
    expect(rows[0]).toEqual({
      username: "carol",
      email: "",
      addedAt: "2024-01-01",
      yearStudying: "3rd",
      enrollmentNo: "A230521027",
    });
  });

  it("skips the header and blank/empty-username rows", () => {
    const csv = "username,email,addedAt,yearStudying,enrollmentNo\n,,,,\nbob,b@x.com,,,\n";
    const rows = parseRosterCsv(csv);
    expect(rows.map((r) => r.username)).toEqual(["bob"]);
  });

  it("tolerates short rows by defaulting missing fields to empty string", () => {
    const csv = "username,email,addedAt,yearStudying,enrollmentNo\nalice\n";
    const rows = parseRosterCsv(csv);
    expect(rows[0]).toEqual({
      username: "alice",
      email: "",
      addedAt: "",
      yearStudying: "",
      enrollmentNo: "",
    });
  });
});
