import { describe, it, expect } from "vitest";
import { calculateQuote } from "./queries/bookings.js";
import { appRouter } from "./router.js";
import type { Unit, User } from "../db/schema.js";
const unit: Unit = {
  id: 1,
  propertyId: 1,
  name: "Test",
  maxGuests: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 1,
  sizeM2: 60,
  basePrice: "100",
  currency: "EUR",
  minNights: 2,
  cleaningFee: "30",
  touristTax: "1.6",
  priceRules: [{ from: "2090-07-01", to: "2090-07-31", pricePerNight: 150 }],
  images: [],
};
describe("Server quote validation", () => {
  it("combines seasonal nightly prices and rounds currency", () => {
    expect(calculateQuote(unit, "2090-06-30", "2090-07-03", 3)).toEqual({
      available: true,
      nights: 3,
      accommodation: 400,
      cleaningFee: 30,
      touristTax: 14.4,
      total: 444.4,
    });
  });
  it.each([
    ["2090-02-30", "2090-03-04", 2],
    ["2090-07-02", "2090-07-01", 2],
    ["2090-07-01", "2090-07-04", 5],
    ["2090-07-01", "2090-07-04", 0],
    ["2090-07-01", "2092-07-04", 2],
  ])(
    "rejects invalid dates, durations or capacity %s",
    (start, end, guests) => {
      expect(calculateQuote(unit, start, end, guests)).toMatchObject({
        available: false,
        reason: "invalid",
      });
    },
  );
  it("rejects stays below minimum nights", () =>
    expect(calculateQuote(unit, "2090-07-01", "2090-07-02", 2)).toMatchObject({
      available: false,
      reason: "min-nights",
    }));
  it("rejects dates in the past", () =>
    expect(calculateQuote(unit, "2000-07-01", "2000-07-04", 2)).toMatchObject({
      available: false,
      reason: "past",
    }));
});
describe("Administrator authorization", () => {
  const user: User = {
    id: 1,
    unionId: "firebase-uid",
    name: "Guest",
    email: "guest@example.com",
    avatar: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  };
  for (const identity of [undefined, user]) {
    const caller = appRouter.createCaller({
      req: new Request("https://cms.example"),
      resHeaders: new Headers(),
      user: identity,
    });
    it(`denies management endpoints to ${identity ? "non-admin" : "anonymous"} visitors`, async () => {
      const calls = [
        () => caller.properties.adminList(),
        () => caller.booking.adminList(),
        () => caller.cms.list(),
        () => caller.media.list(),
        () => caller.ical.feeds({ unitId: 1 }),
        () => caller.settings.set({ key: "siteName", value: "Hacked" }),
        () =>
          caller.theme.set({
            themeKey: "mediteran",
            token: "--primary",
            value: "red",
          }),
        () => caller.setup.complete({ siteName: "Hacked" }),
        () => caller.adminUsers.listUsers(),
      ];
      for (const call of calls)
        await expect(call()).rejects.toMatchObject({
          code: identity ? "FORBIDDEN" : "UNAUTHORIZED",
        });
    });
  }
  it("allows the deployment readiness route without database credentials", async () => {
    const caller = appRouter.createCaller({
      req: new Request("https://cms.example"),
      resHeaders: new Headers(),
    });
    expect(await caller.setup.status()).toMatchObject({
      configured: false,
      completed: false,
    });
  });
});
