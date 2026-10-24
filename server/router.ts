import { authRouter } from "./auth-router.js";
import { createRouter, publicQuery } from "./middleware.js";
import { propertiesRouter } from "./propertiesRouter.js";
import { bookingRouter } from "./bookingRouter.js";
import { cmsRouter, themeRouter } from "./cmsRouter.js";
import { icalRouter } from "./icalRouter.js";
import { mediaRouter } from "./mediaRouter.js";
import { settingsRouter } from "./settingsRouter.js";
import { adminUsersRouter } from "./adminUsersRouter.js";
import { setupRouter } from "./setupRouter.js";

import { contactRouter } from "./contactRouter.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  properties: propertiesRouter,
  booking: bookingRouter,
  contact: contactRouter,
  cms: cmsRouter,
  theme: themeRouter,
  ical: icalRouter,
  media: mediaRouter,
  settings: settingsRouter,
  adminUsers: adminUsersRouter,
  setup: setupRouter,
});

export type AppRouter = typeof appRouter;
