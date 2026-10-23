import { randomUUID } from "node:crypto";
import { firebaseBucket } from "./firebase.js";
export const storage = {
  async uploadFile(input: {
    fileContent: Uint8Array;
    fileName: string;
    contentType?: string;
  }) {
    const key = `media/${randomUUID()}-${input.fileName.split("/").pop()}`;
    await firebaseBucket()
      .file(key)
      .save(Buffer.from(input.fileContent), {
        resumable: false,
        metadata: {
          contentType: input.contentType,
          cacheControl: "public,max-age=3600",
        },
      });
    return { key, size: input.fileContent.byteLength };
  },
  async getPresignedUrl({ key }: { key: string }) {
    const [url] = await firebaseBucket()
      .file(key)
      .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
    return { key, url };
  },
  async deleteFile({ fileKey }: { fileKey: string }) {
    await firebaseBucket().file(fileKey).delete({ ignoreNotFound: true });
  },
};
