import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { firebaseAuth } from "./lib/firebase";
import { upsertUser } from "./queries/users";
export type TrpcContext = { req: Request; resHeaders: Headers; user?: User };
export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  const bearer = opts.req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    try {
      const token = await firebaseAuth().verifyIdToken(bearer.slice(7), true);
      if (token.email_verified)
        ctx.user = await upsertUser({
          unionId: token.uid,
          email: token.email ?? null,
          name: token.name ?? null,
          avatar: token.picture ?? null,
        });
    } catch {
      /* Invalid or expired tokens never authenticate a request. */
    }
  }
  return ctx;
}
