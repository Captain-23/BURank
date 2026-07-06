import { describe, it, expect } from "vitest";
import { parseRosterCsv } from "./roster";

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
