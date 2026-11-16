import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseGuide } from "./sales-kit";
import { callScript, launchPlan, notice, objections, sections, tiles } from "./sell-guides";

const guide = (id: string) => parseGuide(readFileSync(path.join(process.cwd(), "content", "sales-kit", "guides", `${id}.md`), "utf8")).body;

describe("the Guides tab reads each guide by its shape", () => {
  it("splits the pricing guide into its lead, package tiles and the regulated notice", () => {
    const { lead, sections: all } = sections(guide("pricing"));
    expect(lead).toMatch(/^What you pay/);
    expect(all.map((s) => tiles(s.body)?.map((t) => t.label)).filter(Boolean)).toEqual([["Care plan", "Done for you", "Do it yourself", "Yearly"]]);
    expect(all.filter((s) => notice(s.body)).map((s) => s.title)).toEqual(["Regulated products"]);
  });

  it("turns the call script into a 15-minute clock with something to say in every part", () => {
    const call = callScript(guide("call-script"));
    expect(call.stages.map((s) => [s.name, s.minutes])).toEqual([
      ["Open", 1],
      ["Ask", 5],
      ["Show", 5],
      ["Price", 2],
      ["Next step", 2]
    ]);
    for (const s of call.stages) {
      expect(s.say, s.name).not.toBe("");
      expect(s.say, s.name).not.toMatch(/^"|"$/);
      expect(s.steps.length, s.name).toBeGreaterThan(0);
      expect(s.tip, s.name).not.toBe("");
    }
    expect(call.checklists.map((c) => c.title)).toEqual(["Before the call", "After the call"]);
  });

  it("gives every objection a topic, a question back and an answer", () => {
    const { items } = objections(guide("objections"));
    expect(items.length).toBeGreaterThanOrEqual(8);
    for (const o of items) {
      expect(o.says).not.toMatch(/^"|"$/);
      expect([o.topic, o.ask, o.answer].every(Boolean), o.says).toBe(true);
    }
  });

  it("lays out yes-to-live as timed steps with one content list per site type", () => {
    const plan = launchPlan(guide("onboarding"));
    expect(plan.steps.map((s) => s.when)).toEqual(["Day 0", "Within 2 days", "First week", "Go-live day", "Weeks 1 to 4"]);
    expect(plan.steps.find((s) => s.byType)?.byType?.map((t) => t.label)).toEqual(["Website", "Store", "Bookings", "Community"]);
    expect(plan.steps.filter((s) => !s.byType).every((s) => s.items.length > 0)).toBe(true);
    expect(plan.closing).toMatch(/^Customers stay/);
  });
});
