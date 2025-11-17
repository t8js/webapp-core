import type { TransformContent } from "../types/TransformContent.ts";

export const injectNonce: TransformContent = (req, _res, { content }) => {
  let { nonce } = req.ctx;

  return nonce ? content.replace(/\{\{nonce\}\}/g, nonce) : content;
};
