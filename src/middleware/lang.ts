import type { CookieOptions } from "express";
import { getEffectiveLocale } from "../lib/lang/getEffectiveLocale.ts";
import { getLocales } from "../lib/lang/getLocales.ts";
import { toLanguage } from "../lib/lang/toLanguage.ts";
import type { Middleware } from "../types/Middleware.ts";
import { emitLog } from "../utils/emitLog.ts";

const defaultLangCookieOptions: CookieOptions = {
  maxAge: 90 * 86_400_000,
};

export type LangParams = {
  supportedLocales?: string[];
  shouldSetCookie?: boolean;
  shouldRedirect?: boolean;
  langCookieOptions?: CookieOptions;
};

export const lang: Middleware<LangParams | void> = ({
  supportedLocales = [],
  shouldSetCookie = true,
  shouldRedirect = true,
  langCookieOptions = defaultLangCookieOptions,
} = {}) => {
  let langSet = new Set(supportedLocales.map(toLanguage));
  let localeSet = new Set(supportedLocales);

  return (req, res, next) => {
    let langParam = req.query.lang as string[] | string | undefined;
    let lang = (Array.isArray(langParam) ? langParam[0] : langParam) ?? "";

    if (localeSet.has(lang) || langSet.has(lang)) {
      if (shouldSetCookie) {
        emitLog(req.app, `Set lang cookie: ${JSON.stringify(lang)}`, {
          req,
          res,
        });

        res.cookie("lang", lang, langCookieOptions);
      }

      if (shouldRedirect) {
        let { originalUrl } = req;
        let nextUrl = originalUrl.replace(/[?&]lang=[^&]+/g, "");

        if (nextUrl !== originalUrl) {
          emitLog(req.app, "Strip lang param and redirect", {
            req,
            res,
          });

          res.redirect(nextUrl);
          return;
        }
      }
    }

    let langCookie = shouldSetCookie
      ? (req.cookies.lang as string | undefined)
      : undefined;

    let userAgentLocales = getLocales(req.get("accept-language"));
    let preferredLocales = langCookie
      ? [langCookie, ...userAgentLocales]
      : userAgentLocales;

    let effectiveLang = getEffectiveLocale(preferredLocales, supportedLocales);

    if (req.ctx && effectiveLang) req.ctx.lang = effectiveLang;

    emitLog(req.app, `Detected lang: ${JSON.stringify(effectiveLang)}`, {
      req,
      res,
      data: {
        userAgentLocales,
        langCookie,
        lang: effectiveLang,
      },
    });

    next();
  };
};
