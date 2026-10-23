import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { propertiesRouter } from "./propertiesRouter";
import { bookingRouter } from "./bookingRouter";
import { cmsRouter, themeRouter } from "./cmsRouter";
import { icalRouter } from "./icalRouter";
import { mediaRouter } from "./mediaRouter";
import { settingsRouter } from "./settingsRouter";
import { adminUsersRouter } from "./adminUsersRouter";
import { setupRouter } from "./setupRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  properties: propertiesRouter,
  booking: bookingRouter,
  cms: cmsRouter,
  theme: themeRouter,
  ical: icalRouter,
  media: mediaRouter,
  settings: settingsRouter,
  adminUsers: adminUsersRouter,
  setup: setupRouter,
});

export type AppRouter = typeof appRouter;
