import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { Request, Response } from "express";
import type { Controller } from "../types/Controller";
import type { TransformContent } from "../types/TransformContent";
import { emitLog } from "../utils/emitLog";
import {
  type ResolveFilePathParams,
  resolveFilePath,
} from "../utils/resolveFilePath";

const defaultExt = ["html", "htm"];
const defaultName = (req: Request) => req.path.split("/").at(-1);

type ZeroTransform = false | null | undefined;

export type DirParams = Partial<
  Pick<ResolveFilePathParams, "supportedLocales" | "index">
> & {
  /** Directory path to serve files from. */
  path: string;
  /**
   * File name.
   * By default, the portion of `req.path` after the last slash.
   */
  name?:
    | string
    | undefined
    | ((req: Request, res: Response) => string | undefined);
  /**
   * Allowed file extensions.
   *
   * @defaultValue `['html', 'htm']`
   */
  ext?: ResolveFilePathParams["ext"];
  /**
   * Custom transforms applied to the file content.
   *
   * Example: Use `injectNonce` from this package to inject the `nonce`
   * value generated for the current request into the `{{nonce}}`
   * placeholders in an HTML file.
   */
  transform?:
    | TransformContent
    | ZeroTransform
    | (TransformContent | ZeroTransform)[];
  supportedLocales?: string[];
};

/**
 * Serves files from the specified directory path in a locale-aware
 * fashion after applying optional transforms.
 *
 * A file ending with `.<lang>.<ext>` is picked first if the `<lang>`
 * part matches `req.ctx.lang`. If the `supportedLocales` array is
 * provided, the `*.<lang>.<ext>` file is picked only if the given
 * array contains `req.ctx.lang`. Otherwise, a file without the locale
 * in its path (`*.<ext>`) is picked.
 */
export const dir: Controller<DirParams> = ({
  path,
  name = defaultName,
  ext = defaultExt,
  transform,
  supportedLocales,
  index = true,
}) => {
  if (typeof path !== "string") throw new Error(`'path' is not a string`);

  let transformSet = (
    Array.isArray(transform) ? transform : [transform]
  ).filter((item) => typeof item === "function");

  return async (req, res) => {
    let fileName = typeof name === "function" ? name(req, res) : name;

    emitLog(req.app, `Name: ${JSON.stringify(fileName)}`, {
      req,
      res,
    });

    if (fileName === undefined) {
      res.status(404).send(await req.app.renderStatus?.(req, res));

      return;
    }

    let filePath = await resolveFilePath({
      name: fileName,
      dir: path,
      ext,
      supportedLocales,
      lang: req.ctx?.lang,
      index,
    });

    emitLog(req.app, `Path: ${JSON.stringify(filePath)}`, {
      req,
      res,
    });

    if (!filePath) {
      res.status(404).send(await req.app.renderStatus?.(req, res));

      return;
    }

    let content = (await readFile(filePath)).toString();

    for (let transformItem of transformSet)
      content = await transformItem(req, res, {
        content,
        path: filePath,
        name: basename(filePath, extname(filePath)),
      });

    res.send(content);
  };
};
