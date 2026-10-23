import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createRouter, adminQuery } from "./middleware";
import { storage } from "./lib/storage";
import { rows, insert, remove } from "./queries/connection";

// slike do 3 MB (base64 je ~4/3 veci)
const MAX_BYTES = 3 * 1024 * 1024;

export const mediaRouter = createRouter({
  list: adminQuery.query(async () => {
    return (await rows("media_files")).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }),

  upload: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        contentBase64: z.string().max(Math.ceil((MAX_BYTES * 4) / 3)),
        contentType: z
          .string()
          .regex(
            /^image\/(jpeg|png|webp|gif|avif)$/,
            "Dozvoljene su samo slike (jpg/png/webp/gif/avif)",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      if (bytes.byteLength > MAX_BYTES) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Slika je veca od 3 MB",
        });
      }
      const safeName = input.name.replace(/[\\]/g, "").replace(/\.\./g, "");
      try {
        const saved = await storage.uploadFile({
          fileContent: bytes,
          fileName: `media/${safeName}`,
          contentType: input.contentType,
        });
        await insert("media_files", {
          key: saved.key,
          name: safeName,
          size: saved.size,
          contentType: input.contentType,
          uploadedBy: ctx.user.id,
          createdAt: new Date(),
        });
        return { key: saved.key, size: saved.size };
      } catch (e) {
        const code = (e as { code?: string }).code ?? "";
        if (code === "STORAGE_QUOTA_EXCEEDED")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Pohrana je puna — obrisite stare datoteke ili prosirite kvotu.",
          });
        if (code === "STORAGE_REVIEW_REJECTED")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Sadrzaj slike nije prosao provjeru — pokusajte drugu sliku.",
          });
        throw e;
      }
    }),

  remove: adminQuery
    .input(z.object({ key: z.string().min(1).max(512) }))
    .mutation(async ({ input }) => {
      const [file] = await rows("media_files", "key", input.key);
      if (!file)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Datoteka ne postoji",
        });
      await storage.deleteFile({ fileKey: input.key });
      await remove("media_files", file.id);
    }),
});
