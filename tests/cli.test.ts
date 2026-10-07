import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const homes: string[] = [];
afterEach(() => { for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true }); });
function fixture() {
  const home = mkdtempSync(join(tmpdir(), "slipway-test-"));
  homes.push(home);
  mkdirSync(join(home, ".config/slipway"), { recursive: true });
  mkdirSync(join(home, "bin"));
  writeFileSync(join(home, ".config/slipway/config"), "TEST_HOST=fixture.local\nTEST_USER=builder\n");
  writeFileSync(join(home, "bin/ssh"), '#!/bin/sh\nprintf "%s\\n" "$@" > "$SSH_CAPTURE"\nexit "${SSH_EXIT:-0}"\n', { mode: 0o755 });
  const run = (...args: string[]) => Bun.spawnSync(["bash", resolve("slipway"), ...args], {
    env: { ...process.env, HOME: home, PATH: `${home}/bin:${process.env.PATH}`, SSH_CAPTURE: `${home}/ssh.txt`, CODEX_THREAD_ID: "fixture-session" },
  });
  const events = () => readFileSync(join(home, "Library/Logs/slipway/activity.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  return { home, run, events };
}
test("help and capabilities work without Tart and do not log", () => {
  const { home, run } = fixture();
  expect(run("--help").exitCode).toBe(0);
  const result = run("capabilities", "--json");
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString()).name).toBe("slipway");
  expect(() => readFileSync(`${home}/Library/Logs/slipway/activity.jsonl`)).toThrow();
});
test("notes preserve Unicode, quotes and newlines in the monitor contract", () => {
  const { run, events } = fixture();
  const note = 'Check “Save”\nwith "quotes" and \\slashes';
  expect(run("note", note).exitCode).toBe(0);
  const [start, end] = events();
  expect(start).toMatchObject({ v: 1, event: "start", command: "note", args: [note], agent: "codex", session: "fixture-session", target: "fixture.local" });
  expect(end).toMatchObject({ event: "end", id: start.id, status: 0 });
});
test("remote commands use the renamed key, shared socket and host-key checks", () => {
  const { home, run, events } = fixture();
  expect(run("run", "printf hello").exitCode).toBe(0);
  const args = readFileSync(`${home}/ssh.txt`, "utf8");
  expect(args).toContain(`${home}/.ssh/slipway_ed25519`);
  expect(args).toContain("ControlPath=/tmp/slipway-ssh-%C");
  expect(args).toContain("StrictHostKeyChecking=accept-new");
  expect(args).toContain("builder@fixture.local");
  expect(events().at(-1).status).toBe(0);
});
test("unknown commands and missing note arguments fail", () => {
  const { run, events } = fixture();
  expect(run("unknown").exitCode).toBe(1);
  expect(run("note").exitCode).toBe(1);
  expect(events().at(-1).status).toBe(1);
});
test("SSH failures retain the exit code and reach the activity log", () => {
  const { home, run, events } = fixture();
  writeFileSync(`${home}/bin/ssh`, "#!/bin/sh\necho connection-failed >&2\nexit 23\n", { mode: 0o755 });
  expect(run("run", "false").exitCode).toBe(23);
  expect(events().at(-1)).toMatchObject({ status: 23, last: "connection-failed" });
});
