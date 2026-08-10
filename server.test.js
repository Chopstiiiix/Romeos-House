// Self-check for the bits of server.js that can silently break: Range parsing
// (wrong bytes = broken video scrubbing) and path escaping (wrong = file leak).
// Run: node server.test.js
const assert = require("assert");
const path = require("path");
const { parseRange, resolve } = require("./server");

const SIZE = 1000;
assert.deepStrictEqual(parseRange("bytes=0-99", SIZE), { start: 0, end: 99 });
assert.deepStrictEqual(parseRange("bytes=500-", SIZE), { start: 500, end: 999 });
assert.deepStrictEqual(parseRange("bytes=-100", SIZE), { start: 900, end: 999 });
assert.deepStrictEqual(parseRange("bytes=0-99999", SIZE), { start: 0, end: 999 }, "clamp past EOF");
assert.strictEqual(parseRange(undefined, SIZE), null, "no header = full body");
assert.strictEqual(parseRange("", SIZE), null);
assert.strictEqual(parseRange("bytes=-", SIZE), null, "malformed = full body");
assert.strictEqual(parseRange("bytes=1000-", SIZE), "invalid", "start at EOF = 416");
assert.strictEqual(parseRange("bytes=900-800", SIZE), "invalid", "reversed = 416");
assert.strictEqual(parseRange("bytes=-0", SIZE), "invalid", "zero-length suffix = 416");

// The invariant that matters: nothing resolves outside ROOT. path.normalize
// clamps leading ".." at the root, so these land inside ROOT and 404 rather
// than escaping — either way the file system above ROOT is unreachable.
const ROOT = __dirname;
for (const attack of ["/../../etc/passwd", "/assets/../../../etc/passwd",
                      "/%2e%2e/%2e%2e/etc/passwd", "/..%2f..%2fetc/passwd"]) {
  const got = resolve(attack);
  assert.ok(got === null || got.startsWith(ROOT + path.sep), `escaped ROOT: ${attack} -> ${got}`);
}
assert.ok(resolve("/").endsWith(path.join(path.sep, "index.html")), "/ serves index.html");
assert.ok(resolve("/assets/hero.mp4").endsWith(path.join("assets", "hero.mp4")));

console.log("server.test.js: all checks passed");
