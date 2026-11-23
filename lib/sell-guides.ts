/**
 * The Guides tab reads each sales kit guide by its shape (content/sales-kit/README.md), so the guides stay
 * plain Markdown for the download while the page shows a call as a clock, objections as cards and so on.
 */

export type GuideSection = { title: string; body: string };

/** A guide's lead (the text before its first `##`) and its sections. */
export function sections(body: string): { lead: string; sections: GuideSection[] } {
  const [lead = "", ...rest] = body.split(/^## /m);
  return {
    lead: lead.trim(),
    sections: rest.map((chunk) => {
      const newline = chunk.indexOf("\n");
      return newline < 0 ? { title: chunk.trim(), body: "" } : { title: chunk.slice(0, newline).trim(), body: chunk.slice(newline + 1).trim() };
    })
  };
}

/** The `- ` or `1. ` items of a section, in order. */
function listItems(body: string): string[] {
  return [...body.matchAll(/^\s*(?:-|\d+\.)\s+(.+)$/gm)].map((m) => m[1]!.trim());
}

/** The paragraphs of a section that aren't lists, `**Field:**` lines or notices. */
function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(?:-|\d+\.)\s/.test(p) && !/^\*\*[^*]+:\*\*/.test(p) && !p.startsWith(">"));
}

/** The value of a `**Name:** value` line, or "". */
function field(body: string, name: string): string {
  return new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+)$`, "m").exec(body)?.[1]?.trim() ?? "";
}

/** A `> ` notice in a section, or "". */
export function notice(body: string): string {
  return [...body.matchAll(/^>\s?(.*)$/gm)].map((m) => m[1]).join(" ").trim();
}

/** A list whose items all start with `**Label:**`, as tiles; null when the list isn't one. */
export function tiles(body: string): { label: string; text: string }[] | null {
  const items = listItems(body).map((item) => /^\*\*(.+?):\*\*\s*(.*)$/.exec(item));
  if (!items.length || items.some((m) => !m)) return null;
  return items.map((m) => ({ label: m![1]!, text: m![2]! }));
}

/** One line of a practice call: you, the prospect, or a note on what happens. */
export type PracticeLine = { who: "you" | "they" | "note"; text: string };

/** One part of the call: what to say, what to do, a tip, its minutes, and how it can go. */
export type CallStage = { name: string; minutes: number; say: string; steps: string[]; tip: string; practice: PracticeLine[] };

/** A part's `### Practice` list of `**You:**`, `**They:**` and `**Note:**` lines. */
function practiceLines(body: string): PracticeLine[] {
  return listItems(body).flatMap((item) => {
    const m = /^\*\*(You|They|Note):\*\*\s*(.+)$/.exec(item);
    return m ? [{ who: m[1]!.toLowerCase() as PracticeLine["who"], text: m[2]!.trim() }] : [];
  });
}

/** The call script: its timed parts, and the checklists before and after. */
export function callScript(body: string): { lead: string; stages: CallStage[]; checklists: { title: string; items: string[] }[] } {
  const { lead, sections: all } = sections(body);
  const stages: CallStage[] = [];
  const checklists: { title: string; items: string[] }[] = [];
  for (const s of all) {
    const timed = /^(.+?)\s*\((\d+) minutes?\)$/.exec(s.title);
    if (!timed) {
      checklists.push({ title: s.title, items: listItems(s.body) });
      continue;
    }
    const [main = "", practice = ""] = s.body.split(/^### Practice\s*$/m);
    const prose = paragraphs(main);
    const say = prose.find((p) => /^["“]/.test(p)) ?? "";
    stages.push({
      name: timed[1]!,
      minutes: Number(timed[2]),
      say: say.replace(/^["“]|["”]$/g, ""),
      steps: listItems(main),
      tip: prose.filter((p) => p !== say).join(" "),
      practice: practiceLines(practice)
    });
  }
  return { lead, stages, checklists };
}

/** One objection: what the prospect says, its topic, what to ask back and what to say. */
export type Objection = { says: string; topic: string; ask: string; answer: string };

export function objections(body: string): { lead: string; items: Objection[] } {
  const { lead, sections: all } = sections(body);
  return {
    lead,
    items: all.map((s) => ({
      says: s.title.replace(/^["“]|["”]$/g, ""),
      topic: field(s.body, "Topic"),
      ask: field(s.body, "Ask back").replace(/^["“]|["”]$/g, ""),
      answer: field(s.body, "Then say")
    }))
  };
}

/** One step from yes to a live site: when, its checklist, or one checklist per site type. */
export type LaunchStep = { title: string; when: string; items: string[]; byType: { label: string; text: string }[] | null };

export function launchPlan(body: string): { lead: string; steps: LaunchStep[]; closing: string } {
  const { lead, sections: all } = sections(body);
  const steps: LaunchStep[] = [];
  let closing = "";
  for (const s of all) {
    const when = field(s.body, "When");
    if (!when) {
      closing = paragraphs(s.body).join(" ");
      continue;
    }
    const byType = tiles(s.body);
    steps.push({ title: s.title, when, items: byType ? [] : listItems(s.body), byType });
  }
  return { lead, steps, closing };
}
