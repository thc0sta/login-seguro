import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../server/security";

describe("proteção de senha", () => {
  it("aceita a senha correta", () => {
    const stored = hashPassword("segredo");
    expect(verifyPassword("segredo", stored)).toBe(true);
  });

  it("recusa a senha incorreta", () => {
    const stored = hashPassword("segredo");
    expect(verifyPassword("errada", stored)).toBe(false);
  });

  it("usa salt diferente a cada hash", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });
});
