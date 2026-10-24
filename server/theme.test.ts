import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./router.js";
import type { User } from "../db/schema.js";

const settings = vi.hoisted(() => new Map<string, { value: string }>());
vi.mock("./lib/firebase.js", async (original) => ({
  ...(await original<typeof import("./lib/firebase.js")>()),
  firebaseConfigured: () => true,
}));
vi.mock("./queries/connection.js", async (original) => ({
  ...(await original<typeof import("./queries/connection.js")>()),
  getDb: () => ({
    collection: (collection: string) => ({
      doc: (id: string) => ({
        get: async () => ({ data: () => settings.get(`${collection}/${id}`) }),
        set: async (value: { value: string }) => {
          settings.set(`${collection}/${id}`, value);
        },
      }),
    }),
  }),
}));
const admin: User = {
  id: 1,
  unionId: "owner",
  name: "Owner",
  email: "owner@example.com",
  avatar: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};
const caller = (user?: User) =>
  appRouter.createCaller({
    req: new Request("https://cms.example"),
    resHeaders: new Headers(),
    user,
  });
beforeEach(() => settings.clear());
describe("Site-wide theme persistence", () => {
  it("serves the administrator's saved theme to a separate anonymous visitor", async () => {
    expect(await caller().theme.active()).toEqual({ theme: "mediteran" });
    await caller(admin).theme.setActive({ themeKey: "obala" });
    expect(await caller().theme.active()).toEqual({ theme: "obala" });
    await caller(admin).theme.setActive({ themeKey: "noc" });
    expect(await caller().theme.active()).toEqual({ theme: "noc" });
  });
  it("prevents visitors and non-admins from changing the site's default", async () => {
    await expect(
      caller().theme.setActive({ themeKey: "noc" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller({ ...admin, role: "user" }).theme.setActive({ themeKey: "noc" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(settings.size).toBe(0);
  });
  it("falls back safely when an old setting contains an unknown theme", async () => {
    settings.set("site_settings/activeTheme", { value: "unknown" });
    expect(await caller().theme.active()).toEqual({ theme: "mediteran" });
  });
});
