import { handle } from "@hono/node-server/vercel";
import app from "../server/boot.js";
export default handle(app);
