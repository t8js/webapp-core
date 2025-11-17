import type { Middleware } from "../types/Middleware.ts";
import { emitLog } from "../utils/emitLog.ts";
import { getStatusMessage } from "../utils/getStatusMessage.ts";

/**
 * Adds event handlers, like logging, to essential request phases.
 */
export const requestEvents: Middleware = () => (req, res, next) => {
  let finished = false;

  res.on("finish", () => {
    finished = true;

    emitLog(req.app, getStatusMessage("Finished", res.statusCode), {
      req,
      res,
    });
  });

  res.on("close", () => {
    if (!finished)
      emitLog(req.app, getStatusMessage("Closed", res.statusCode), {
        req,
        res,
      });
  });

  next();
};
