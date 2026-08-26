import { describe, expect, it } from "vitest";
import {
  excludeSuppressedUsers,
  parseSuppressedUsernames,
  withoutSuppressedUsername,
  withSuppressedUsername,
} from "./suppressed-users";

describe("parseSuppressedUsernames", () => {
  it("parses a JSON array and lowercases values", () => {
    expect(parseSuppressedUsernames('["Alice","bob"]')).toEqual(["alice", "bob"]);
  });

  it("returns empty for invalid or missing values", () => {
    expect(parseSuppressedUsernames(undefined)).toEqual([]);
    expect(parseSuppressedUsernames("not-json")).toEqual([]);
    expect(parseSuppressedUsernames("{}")).toEqual([]);
  });
});

describe("withSuppressedUsername / withoutSuppressedUsername", () => {
  it("adds a username once", () => {
    expect(withSuppressedUsername(["bob"], "Bob")).toEqual(["bob"]);
    expect(withSuppressedUsername(["bob"], "alice")).toEqual(["bob", "alice"]);
  });

  it("removes a username", () => {
    expect(withoutSuppressedUsername(["bob", "alice"], "BOB")).toEqual(["alice"]);
  });
});

describe("excludeSuppressedUsers", () => {
  it("drops suppressed usernames case-insensitively", () => {
    expect(
      excludeSuppressedUsers(
        [{ username: "Alice" }, { username: "bob" }],
        ["alice"],
      ),
    ).toEqual([{ username: "bob" }]);
  });
});
