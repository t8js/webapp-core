import type { ErrorController } from "../types/ErrorController.ts";
import { emitLog } from "../utils/emitLog.ts";

export const unhandledError: ErrorController = () => async (err, req, res) => {
  emitLog(req.app, "Unhandled error", {
    level: "error",
    data: err,
    req,
    res,
  });

  res
    .status(500)
    .send(await req.app.renderStatus?.(req, res, "unhandled_error"));
};
