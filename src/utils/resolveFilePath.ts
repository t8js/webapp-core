import { access } from "node:fs/promises";
import { join } from "node:path";
import { toLanguage } from "../lib/lang/toLanguage.ts";

export type ResolveFilePathParams = {
  name: string;
  dir?: string;
  lang?: string;
  supportedLocales?: string[];
  /** Allowed file extensions. */
  ext?: string | string[];
  /**
   * Whether an index file should be checked if the resolved file name
   * doesn't correspond to an existing file.
   *
   * @defaultValue `true`
   */
  index?: boolean;
};

export async function resolveFilePath({
  name,
  dir = ".",
  lang,
  supportedLocales = [],
  ext,
  index,
}: ResolveFilePathParams) {
  let cwd = process.cwd();

  let localeSet = new Set(supportedLocales);
  let langSet = new Set(supportedLocales.map(toLanguage));

  let availableNames = [
    name,
    ...[...localeSet, ...langSet].map((item) => `${name}.${item}`),
  ];

  let preferredLangNames: string[] | undefined;

  if (
    lang &&
    (!supportedLocales.length || localeSet.has(lang) || langSet.has(lang))
  )
    preferredLangNames = [`${name}.${lang}`, `${name}.${toLanguage(lang)}`];

  let names = new Set(
    preferredLangNames
      ? [...preferredLangNames, ...availableNames]
      : availableNames,
  );

  let exts = Array.isArray(ext) ? ext : [ext];

  for (let item of names) {
    for (let itemExt of exts) {
      let path = join(cwd, dir, `${item}${itemExt ? `.${itemExt}` : ""}`);

      try {
        await access(path);
        return path;
      } catch {}
    }
  }

  if (index) {
    for (let item of names) {
      for (let itemExt of exts) {
        let path = join(cwd, dir, item, `index${itemExt ? `.${itemExt}` : ""}`);

        try {
          await access(path);
          return path;
        } catch {}
      }
    }
  }
}
