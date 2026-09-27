/* Session-redirect matrix. Follows redirects with a hard cap so any loop
 * shows up as a failure instead of hanging.
 *   node scripts/redirect-check.mjs */
const BASE = process.env.BASE_URL ?? "http://localhost:3001";

const login = async (email, password) => {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.headers.get("set-cookie")?.match(/qfs_session=([^;]+)/)?.[1] ?? null;
};

const follow = async (path, cookie, cap = 6) => {
  const chain = [];
  let url = path;
  for (let i = 0; i < cap; i++) {
    const res = await fetch(BASE + url, {
      headers: cookie ? { cookie: `qfs_session=${cookie}` } : {},
      redirect: "manual",
    });
    const loc = res.headers.get("location");
    chain.push(`${res.status} ${url}`);
    if (!loc) return { chain, final: url.split("?")[0], status: res.status, loop: false };
    url = loc.startsWith("http") ? loc.replace(BASE, "") : loc;
  }
  return { chain, final: url.split("?")[0], status: null, loop: true };
};

const user = await login("john@example.com", "Demo12345!");
const admin = await login("admin@qfs.local", "Admin1234!");
if (!user || !admin) throw new Error("login failed");

const cases = [
  ["no cookie  -> dashboard", "/user/user/dashboard", null, "/user/user/login"],
  ["no cookie  -> login", "/user/user/login", null, "/user/user/login"],
  ["no cookie  -> register", "/user/user/register", null, "/user/user/register"],
  ["bad cookie -> dashboard", "/user/user/dashboard", "deadbeef", "/user/user/login"],
  ["bad cookie -> login", "/user/user/login", "deadbeef", "/user/user/login"],
  ["bad cookie -> register", "/user/user/register", "deadbeef", "/user/user/register"],
  ["bad cookie -> /user/admin", "/user/admin", "deadbeef", "/user/user/login"],
  ["user       -> dashboard", "/user/user/dashboard", user, "/user/user/dashboard"],
  ["user       -> login", "/user/user/login", user, "/user/user/dashboard"],
  ["user       -> register", "/user/user/register", user, "/user/user/dashboard"],
  ["user       -> /user/admin", "/user/admin", user, "/user/user/dashboard"],
  ["admin      -> login", "/user/user/login", admin, "/user/admin"],
  ["admin      -> register", "/user/user/register", admin, "/user/admin"],
  ["admin      -> /user/admin", "/user/admin", admin, "/user/admin"],
  ["admin      -> dashboard", "/user/user/dashboard", admin, "/user/user/dashboard"]
];

let fail = 0;
for (const [name, path, cookie, expect] of cases) {
  const r = await follow(path, cookie);
  const ok = !r.loop && r.final === expect && r.status === 200;
  if (!ok) fail++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name.padEnd(26)} ${r.loop ? "REDIRECT LOOP" : r.status} @ ${r.final}` +
      (ok ? "" : `\n        expected 200 @ ${expect}`)
  );
  if (!ok) console.log("        " + r.chain.join("  ->  "));
}
console.log(fail ? `\n${fail} case(s) wrong` : "\nall redirect cases correct");
process.exit(fail ? 1 : 0);
