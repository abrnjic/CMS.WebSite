import { createRouter, publicQuery, authedQuery } from "./middleware.js";
export const authRouter = createRouter({
  me: publicQuery.query(({ ctx }) => ctx.user ?? null),
  logout: authedQuery.mutation(() => ({ success: true })),
});
