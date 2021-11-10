/**
 * When we browserify the source, buffer in elliptic/node_modules/bn.js is null.
 * Add the code to fix that.
 */
if (typeof globalThis.window !== "undefined") {
  var window: any = globalThis.window;
  if (typeof window.Buffer == "undefined") {
    const Buffer = require("buffer/index").Buffer;
    window.Buffer = Buffer;
  }
}

export * from "./bsv";
