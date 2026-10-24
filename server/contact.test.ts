import { beforeEach, expect, it, vi } from "vitest";
import { contactRouter } from "./contactRouter.js";
import type { User } from "../db/schema.js";

const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  next: 0,
}));
vi.mock("./queries/connection.js", () => ({
  decode: (value: unknown) => value,
  getDb: () => ({
    collection: (name: string) => ({
      doc: (id = String(++state.next).padStart(20, "0")) => ({
        id,
        path: `${name}/${id}`,
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            docs: [...state.docs.entries()]
              .filter(([k]) => k.startsWith(`${name}/`))
              .map(([, v]) => ({ data: () => v })),
          }),
        }),
      }),
    }),
    runTransaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        get: async (ref: { path: string }) => ({
          exists: state.docs.has(ref.path),
          data: () => state.docs.get(ref.path),
        }),
        set: (ref: { path: string }, data: Record<string, unknown>) =>
          state.docs.set(ref.path, data),
        create: (ref: { path: string }, data: Record<string, unknown>) =>
          state.docs.set(ref.path, data),
        update: (ref: { path: string }, data: Record<string, unknown>) =>
          state.docs.set(ref.path, { ...state.docs.get(ref.path), ...data }),
      }),
  }),
}));
const admin = { id: 1, role: "admin" } as User;
const caller = (user?: User) =>
  contactRouter.createCaller({
    req: new Request("https://cms.example"),
    resHeaders: new Headers(),
    user,
  });
const input = {
  name: "Test Guest",
  email: "Guest@example.com",
  message: "Imam pitanje o raspoloživom smještaju.",
};
beforeEach(() => {
  state.docs.clear();
  state.next = 0;
});
it("persists an anonymous inquiry for admins and keeps handled inquiries", async () => {
  await caller().submit(input);
  const [message] = await caller(admin).list();
  expect(message).toMatchObject({
    name: input.name,
    email: "guest@example.com",
    message: input.message,
    status: "new",
  });
  await caller(admin).setStatus({ id: message.id, status: "handled" });
  expect(await caller(admin).list()).toEqual([
    expect.objectContaining({ id: message.id, status: "handled" }),
  ]);
});
it("keeps contact details private and prevents unauthorized status changes", async () => {
  await expect(caller().list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(caller({ ...admin, role: "user" }).list()).rejects.toMatchObject(
    { code: "FORBIDDEN" },
  );
  await expect(
    caller().setStatus({ id: "00000000000000000001", status: "handled" }),
  ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
});
it("rejects invalid data, duplicate submissions, and ignores the spam trap", async () => {
  await expect(
    caller().submit({ ...input, email: "invalid" }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(
    caller().submit({ ...input, message: " " }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await caller().submit({ ...input, website: "spam.example" });
  expect(state.docs.size).toBe(0);
  await caller().submit(input);
  await expect(caller().submit(input)).rejects.toMatchObject({
    code: "TOO_MANY_REQUESTS",
  });
  expect(await caller(admin).list()).toHaveLength(1);
});
