/* eslint-disable @typescript-eslint/consistent-type-definitions */
import EventEmitter from "node:events";
import type { RenderStatus } from "../types/RenderStatus.ts";
import type { ReqCtx } from "./ReqCtx.ts";

declare global {
  namespace Express {
    interface Request {
      ctx: ReqCtx;
    }
    interface Application {
      events?: EventEmitter;
      renderStatus?: RenderStatus;
    }
  }
}
