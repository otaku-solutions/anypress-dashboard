"use client";

import * as React from "react";
import { ChevronRightIcon, DownloadIcon, PlayIcon, SearchIcon, SkipForwardIcon, SquareIcon } from "lucide-react";

import { KitMarkdown, Inline } from "@/components/admin/kit-markdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { PLANS, PLAN_NAMES, SUGGESTED_PRICES, cost, dollars, fill, type Guide, type KitContext, type Plan } from "@/lib/sales-kit";
import PRICES from "@/lib/pricing.json";
import { callScript, launchPlan, notice, objections, sections, tiles, type CallStage, type PracticeLine } from "@/lib/sell-guides";
import { cn } from "cn";
import { CopyButton, download, slug } from "./kit-ui";

/** The guides as one path, in the order a sale happens. Guides the path doesn't know show after it. */
const PATH: Record<string, { name: string; when: string }> = {
  pricing: { name: "Set Your Prices", when: "Before you sell" },
  "call-script": { name: "Have The Call", when: "The first call" },
  objections: { name: "Answer Questions", when: "When they hesitate" },
  onboarding: { name: "Get Them Live", when: "After they say yes" }
};
const step = (g: Guide) => PATH[g.id] ?? { name: g.title, when: "Guide" };

type Props = {
  guides: Guide[];
  ctx: KitContext;
  productId: string;
  setPrice: (plan: Plan, value: number) => void;
  wholesalePercent: number | null;
};

export function Guides(props: Props) {
  const { guides } = props;
  const [open, setOpen] = React.useState(guides[0]?.id);
  const guide = guides.find((g) => g.id === open) ?? guides[0];
  if (!guide) return null;
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Guides, in the order of a sale" className="bg-card shadow-raised grid gap-1 rounded-[5px] p-1 sm:grid-cols-2 xl:grid-cols-4">
        {guides.map((g, i) => (
          <PathStep key={g.id} index={i} guide={g} active={g.id === guide.id} onOpen={() => setOpen(g.id)} />
        ))}
      </nav>
      <GuideView key={guide.id} guide={guide} {...props} />
    </div>
  );
}

function PathStep({ index, guide, active, onOpen }: { index: number; guide: Guide; active: boolean; onOpen: () => void }) {
  const s = step(guide);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active ? "step" : undefined}
      className={cn(
        "hover:bg-muted focus-visible:ring-ring/50 flex min-w-0 items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left transition-colors outline-none focus-visible:ring-3",
        active && "bg-muted"
      )}
    >
      <span
        className={cn(
          "grid size-6 flex-none place-items-center rounded-full border-[1.5px] text-xs font-semibold tabular-nums transition-colors",
          active ? "border-primary bg-primary text-primary-foreground" : "border-step-ring bg-card"
        )}
      >
        {index + 1}
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">{s.name}</span>
      <span className="text-muted-foreground truncate text-xs">{s.when}</span>
    </button>
  );
}

function GuideView(props: Props & { guide: Guide }) {
  const { guide, ctx } = props;
  switch (guide.id) {
    case "pricing":
      return <PricingGuide {...props} />;
    case "call-script":
      return <CallGuide guide={guide} ctx={ctx} productId={props.productId} />;
    case "objections":
      return <ObjectionsGuide guide={guide} ctx={ctx} />;
    case "onboarding":
      return <LaunchGuide guide={guide} ctx={ctx} productId={props.productId} />;
    default:
      return (
        <GuideCard guide={guide} ctx={ctx} lead="">
          <KitMarkdown source={guide.body.replace(/^## /gm, "### ")} ctx={ctx} />
        </GuideCard>
      );
  }
}

/** The open guide: its one-line lead, the Markdown download, then the guide itself. The path above names it. */
function GuideCard({ guide, ctx, lead, children }: { guide: Guide; ctx: KitContext; lead: string; children: React.ReactNode }) {
  return (
    <section aria-label={step(guide).name} className="bg-card shadow-raised flex min-w-0 flex-col gap-3 rounded-[5px] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-[0.8125rem]">{lead && <Inline text={lead} ctx={ctx} />}</p>
        <Button variant="ghost" size="sm" onClick={() => download(`${slug(ctx.brand)}-${guide.id}.md`, `# ${guide.title}\n\n${fill(guide.body, ctx)}\n`)}>
          <DownloadIcon data-icon="inline-start" />
          Download
        </Button>
      </div>
      {children}
    </section>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s: string) => s.replace(/\b\w/g, (l) => l.toUpperCase());

const Label = ({ children }: { children: React.ReactNode }) => <p className="text-muted-foreground text-xs font-semibold">{children}</p>;

/** One tile in a row of tiles: the shape every guide shares. */
function Tile({ n, title, aside, className, children }: { n?: number; title?: string; aside?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-muted flex min-w-0 flex-col gap-2 rounded-[5px] p-3", className)}>
      {title && (
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {n !== undefined && <span className="border-step-ring bg-card grid size-5 flex-none place-items-center rounded-full border-[1.5px] text-[0.6875rem] tabular-nums">{n}</span>}
          {title}
          {aside && <span className="text-muted-foreground text-xs font-semibold">{aside}</span>}
        </h3>
      )}
      {children}
    </div>
  );
}

function Chip({ on, onClick, small = false, children }: { on: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 rounded-full transition-colors outline-none focus-visible:ring-3",
        small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[0.8125rem]",
        on ? "bg-foreground text-background" : "bg-foreground/[0.06] hover:bg-foreground/10"
      )}
    >
      {children}
    </button>
  );
}

const Tip = ({ text, ctx }: { text: string; ctx: KitContext }) => (
  <p className="text-muted-foreground border-step-ring border-l-2 pl-2.5 text-[0.8125rem]">
    <Inline text={text} ctx={ctx} />
  </p>
);

/** Text to say, on a white card, with a copy button; placeholders the seller fills show as chips. */
function SayThis({ text, ctx, label }: { text: string; ctx: KitContext; label: string }) {
  return (
    <div className="bg-card flex flex-col gap-1.5 rounded-[5px] p-3">
      <p className="text-[0.9375rem] leading-relaxed">
        <Inline text={text} ctx={ctx} />
      </p>
      <div className="self-end">
        <CopyButton text={fill(text, ctx)} label={label} />
      </div>
    </div>
  );
}

/** Ticked items as stored: only `true`/`false` values count, anything else is dropped. */
function parseTicks(raw: string | null): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((e): e is [string, boolean] => typeof e[1] === "boolean"));
  } catch {
    return {};
  }
}

/** Tells every open checklist on this page that ticks changed; other tabs hear it through the storage event. */
const tickListeners = new Set<() => void>();
function subscribeTicks(onChange: () => void) {
  tickListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    tickListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Ticked items, kept in this browser per storefront and guide, and in step across tabs. */
function useTicks(productId: string, guideId: string) {
  const key = `anypress:sell-guide-ticks:${productId}:${guideId}`;
  const read = () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const saved = React.useSyncExternalStore(subscribeTicks, read, () => null);
  // Ticks this browser couldn't save (private windows, blocked or full storage); they win over saved ones for this visit.
  const [visit, setVisit] = React.useState<Record<string, boolean>>({});
  const ticks = React.useMemo(() => ({ ...parseTicks(saved), ...visit }), [visit, saved]);
  const toggle = (id: string, on: boolean) => {
    try {
      localStorage.setItem(key, JSON.stringify({ ...parseTicks(read()), [id]: on }));
      setVisit((v) => {
        if (!(id in v)) return v;
        const rest = { ...v };
        delete rest[id];
        return rest;
      });
      tickListeners.forEach((l) => l());
    } catch {
      setVisit((v) => ({ ...v, [id]: on }));
    }
  };
  return [ticks, toggle] as const;
}

function Checklist({
  items,
  ctx,
  ticks,
  onTick,
  prefix,
  playing
}: {
  items: string[];
  ctx: KitContext;
  ticks: Record<string, boolean>;
  onTick: (id: string, on: boolean) => void;
  prefix: string;
  /** While a practice call plays: how many items it has reached, and the one it is on. */
  playing?: { reached: number; now: number };
}) {
  return (
    <ul className="flex flex-col">
      {items.map((item, i) => {
        const id = `${prefix}:${i}`;
        const on = playing ? i < playing.reached : !!ticks[id];
        return (
          <li key={id}>
            <label className={cn("hover:bg-card flex cursor-pointer items-start gap-2 rounded-[5px] px-1.5 py-1 text-[0.8125rem] transition-colors", playing?.now === i && "bg-primary/10")}>
              <Checkbox className="mt-px" checked={on} disabled={!!playing} onCheckedChange={(v) => onTick(id, v === true)} />
              <span className={cn(on && "text-muted-foreground line-through")}>
                <Inline text={item} ctx={ctx} />
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Set your prices ---------- */

/** What one site costs the seller with the volume saving for a number of live sites (resellers: their wholesale price). */
function siteCost(plan: Plan, sites: number, wholesalePercent: number | null) {
  if (wholesalePercent !== null) return cost(plan, wholesalePercent);
  const tier = [...PRICES.volumeTiers].reverse().find((t) => sites >= t.sites);
  return Math.round(cost(plan, null) * (100 - (tier?.percent ?? 0))) / 100;
}

function PricingGuide({ guide, ctx, setPrice, wholesalePercent }: Props & { guide: Guide }) {
  const { lead, sections: all } = sections(guide.body);
  const packs = all.filter((s) => tiles(s.body));
  const notices = all.filter((s) => notice(s.body));
  const details = all.filter((s) => !packs.includes(s) && !notices.includes(s));
  return (
    <GuideCard guide={guide} ctx={ctx} lead={lead}>
      <Calculator prices={ctx.prices} setPrice={setPrice} wholesalePercent={wholesalePercent} />
      {packs.map((s) => (
        <div key={s.title} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="list" aria-label={s.title}>
          {tiles(s.body)!.map((t) => (
            <div key={t.label} role="listitem" className="bg-muted rounded-[5px] px-3 py-2">
              <p className="text-[0.8125rem] font-semibold">{titleCase(t.label)}</p>
              <p className="text-muted-foreground text-xs">
                <Inline text={capital(t.text)} ctx={ctx} />
              </p>
            </div>
          ))}
        </div>
      ))}
      {notices.map((s) => (
        <p key={s.title} className="rounded-[5px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[0.8125rem]">
          <Inline text={`**${s.title}:** ${notice(s.body)}`} ctx={ctx} />
        </p>
      ))}
      {details.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex items-center gap-1 text-[0.8125rem] font-medium">
            <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]:rotate-90" aria-hidden />
            Full price tables and a worked example
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <KitMarkdown source={details.map((s) => `### ${s.title}\n\n${s.body}`).join("\n\n")} ctx={ctx} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </GuideCard>
  );
}

function Calculator({ prices, setPrice, wholesalePercent }: { prices: Record<Plan, number>; setPrice: (plan: Plan, value: number) => void; wholesalePercent: number | null }) {
  const [plan, setPlan] = React.useState<Plan>(PLANS[0]);
  const [sites, setSites] = React.useState(1);
  const [yearly, setYearly] = React.useState(false);
  const price = prices[plan];
  const each = siteCost(plan, sites, wholesalePercent);
  const months = yearly ? PRICES.yearlyMonths / 12 : 1;
  const kept = Math.round((price - each) * months * 100) / 100;
  const loss = kept < 0;
  const share = price > 0 ? Math.min(100, (each / price) * 100) : 100;
  const signed = (n: number) => `${n < 0 ? "−" : ""}$${dollars(Math.abs(n))}`;
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr]">
      <Tile n={1} title="Your Cost">
        <div className="flex flex-wrap gap-1">
          {PLANS.map((p) => (
            <Chip key={p} on={p === plan} onClick={() => setPlan(p)}>
              {PLAN_NAMES[p]}
            </Chip>
          ))}
        </div>
        {wholesalePercent === null ? (
          <>
            <Slider id="guide-sites" label={`Live sites you sell: ${sites}`} min={1} max={30} value={sites} onChange={setSites} />
            <Tiers sites={sites} />
          </>
        ) : (
          <p className="text-muted-foreground text-xs">Our list price less your {wholesalePercent}% wholesale discount.</p>
        )}
        <Row label="You pay a site" value={`$${dollars(each)}`} />
      </Tile>
      <Tile n={2} title="Your Price">
        <Slider id="guide-price" label={`You charge a month: $${price}`} min={5} max={Math.max(500, price)} value={price} onChange={(v) => setPrice(plan, v)} />
        <Row
          label="Suggested"
          value={
            price === SUGGESTED_PRICES[plan] ? (
              `$${SUGGESTED_PRICES[plan]}`
            ) : (
              <button type="button" onClick={() => setPrice(plan, SUGGESTED_PRICES[plan])} className="text-primary font-medium hover:underline">
                ${SUGGESTED_PRICES[plan]}, use it
              </button>
            )
          }
        />
        <div className="flex flex-wrap gap-1">
          <Chip on={yearly} onClick={() => setYearly(!yearly)}>
            Paid yearly ({12 - PRICES.yearlyMonths} months free)
          </Chip>
        </div>
        <p className="text-muted-foreground mt-auto text-xs">Saved in this browser and used in every message, offer sheet and deck.</p>
      </Tile>
      <Tile n={3} title={loss ? "You Lose" : "You Keep"} className="md:col-span-2 xl:col-span-1">
        <p className={cn("text-3xl leading-none font-semibold tracking-tight tabular-nums", loss && "text-rose-700 dark:text-rose-300")}>{signed(kept)}</p>
        <p className="text-muted-foreground text-xs">
          {loss ? "a site each month. Charge more than you pay." : `a site each month${sites > 1 ? ` · ${signed(Math.round(kept * sites * 100) / 100)} across ${sites} sites` : ""}`}
          {yearly && " · yearly, as a monthly average"}
        </p>
        <div className="bg-card flex h-2 overflow-hidden rounded-full" aria-hidden>
          <span className="bg-step-ring transition-[width]" style={{ width: `${share}%` }} />
          <span className="bg-green-600 transition-[width] dark:bg-green-400" style={{ width: `${100 - share}%` }} />
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>Your cost</span>
          <span>Yours</span>
        </div>
      </Tile>
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <p className="flex items-baseline justify-between gap-2 text-[0.8125rem] tabular-nums">
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </p>
);

function Slider({ id, label, min, max, value, onChange }: { id: string; label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="text-muted-foreground mb-1 block text-xs font-semibold">
        {label}
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-primary w-full" />
    </div>
  );
}

function Tiers({ sites }: { sites: number }) {
  const tiers = [{ sites: 1, percent: 0 }, ...PRICES.volumeTiers];
  const active = [...tiers].reverse().find((t) => sites >= t.sites);
  return (
    <div className="grid grid-cols-4 gap-1">
      {tiers.map((t) => (
        <div
          key={t.sites}
          className={cn(
            "rounded-[5px] px-1 py-1 text-center text-[0.6875rem] leading-tight transition-colors",
            t === active ? "bg-green-600/10 font-semibold text-green-700 dark:text-green-300" : "bg-card text-muted-foreground"
          )}
        >
          {t.sites}+ · {t.percent ? `${t.percent}% off` : "list"}
        </div>
      ))}
    </div>
  );
}

/* ---------- Have the call ---------- */

/** A part of the clock: a timed part of the call, or the checklist before or after it. */
type Part = { kind: "stage"; stage: CallStage; index: number } | { kind: "list"; title: string; items: string[] };

function CallGuide({ guide, ctx, productId }: { guide: Guide; ctx: KitContext; productId: string }) {
  const { lead, stages, checklists } = React.useMemo(() => callScript(guide.body), [guide.body]);
  const parts = React.useMemo<Part[]>(() => {
    const lists = checklists.map((c) => ({ kind: "list" as const, title: titleCase(c.title), items: c.items }));
    const before = lists.filter((l) => /before/i.test(l.title));
    return [...before, ...stages.map((stage, index) => ({ kind: "stage" as const, stage, index })), ...lists.filter((l) => !before.includes(l))];
  }, [stages, checklists]);
  const [ticks, onTick] = useTicks(productId, guide.id);
  const [selected, setSelected] = React.useState(() => Math.max(0, parts.findIndex((p) => p.kind === "stage")));
  const practice = usePractice(stages);
  const shownPart = practice.playing && practice.stage !== null ? parts.findIndex((p) => p.kind === "stage" && p.index === practice.stage) : selected;
  const part = parts[shownPart];
  return (
    <GuideCard guide={guide} ctx={ctx} lead={lead}>
      <div className="flex h-10 gap-0.5" role="group" aria-label="Parts of the call">
        {parts.map((p, i) => (
          <button
            key={p.kind === "stage" ? p.stage.name : p.title}
            type="button"
            aria-pressed={i === shownPart}
            disabled={practice.playing}
            onClick={() => setSelected(i)}
            style={p.kind === "stage" ? { flex: p.stage.minutes } : undefined}
            className={cn(
              "focus-visible:ring-ring/50 relative flex min-w-0 flex-col justify-center overflow-hidden rounded-[5px] px-2 text-left outline-none focus-visible:ring-3 disabled:cursor-default",
              p.kind === "list" ? "w-14 flex-none border-[1.5px] border-dashed sm:w-20" : "",
              i === shownPart ? (p.kind === "list" ? "bg-muted border-solid" : "bg-primary/15") : p.kind === "list" ? "border-step-ring hover:bg-muted" : "bg-muted hover:bg-foreground/10"
            )}
          >
            {p.kind === "stage" && <span className="bg-primary/20 absolute inset-y-0 left-0 transition-[width] duration-500" style={{ width: `${practice.fill(p.index) * 100}%` }} aria-hidden />}
            <span className="relative truncate text-xs font-semibold">{p.kind === "stage" ? p.stage.name : p.title.replace(/ the call$/i, "")}</span>
            <span className="text-muted-foreground relative text-[0.6875rem] max-sm:hidden">{p.kind === "stage" ? `${p.stage.minutes} min` : "checklist"}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {part && <PartTile part={part} ctx={ctx} ticks={ticks} onTick={onTick} playing={part.kind === "stage" && practice.playing ? practice.reached(part.index) : undefined} />}
        <Tile>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto text-sm font-semibold">Practise The Call</h3>
            <span className="min-w-10 text-sm font-semibold tabular-nums">{practice.clock}</span>
            <Button size="sm" onClick={practice.toggle}>
              {practice.playing ? <SquareIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {practice.playing ? "Stop" : practice.finished ? "Practise Again" : "Start"}
            </Button>
            <Button size="sm" variant="outline" onClick={practice.next} disabled={!practice.playing}>
              <SkipForwardIcon data-icon="inline-start" />
              Next Line
            </Button>
          </div>
          <Transcript lines={practice.shown} stages={stages} ctx={ctx} finished={practice.finished} />
        </Tile>
      </div>
    </GuideCard>
  );
}

function PartTile({ part, ctx, ticks, onTick, playing }: { part: Part; ctx: KitContext; ticks: Record<string, boolean>; onTick: (id: string, on: boolean) => void; playing?: { reached: number; now: number } }) {
  if (part.kind === "list")
    return (
      <Tile title={part.title} aside="checklist">
        <Checklist items={part.items} ctx={ctx} ticks={ticks} onTick={onTick} prefix={part.title.toLowerCase()} />
      </Tile>
    );
  const s = part.stage;
  return (
    <Tile title={s.name} aside={`${s.minutes} min`}>
      {s.say && <SayThis text={s.say} ctx={ctx} label={`the ${s.name.toLowerCase()} line`} />}
      <Label>{s.steps.every((x) => x.startsWith('"')) ? "Ask, then listen" : "Do this"}</Label>
      <Checklist items={s.steps} ctx={ctx} ticks={ticks} onTick={onTick} prefix={`part:${s.name}`} playing={playing} />
      {s.tip && <Tip text={s.tip} ctx={ctx} />}
    </Tile>
  );
}

type Shown = PracticeLine & { stage: number };

function Transcript({ lines, stages, ctx, finished }: { lines: Shown[]; stages: CallStage[]; ctx: KitContext; finished: boolean }) {
  const box = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [lines.length, finished]);
  return (
    <div ref={box} className="flex h-60 flex-col gap-1.5 overflow-y-auto pr-0.5" aria-live="polite">
      {lines.length === 0 && (
        <p className="text-muted-foreground m-auto max-w-[34ch] text-center text-[0.8125rem]">
          Press Start and the call plays out: what you say, what they might say, and each part&apos;s to-do list ticking itself off.
        </p>
      )}
      {lines.map((l, i) => (
        <React.Fragment key={i}>
          {l.stage !== lines[i - 1]?.stage && (
            <p className="text-muted-foreground self-center pt-1 text-xs font-semibold">
              {stages[l.stage]?.name} · {stages[l.stage]?.minutes} min
            </p>
          )}
          <p
            className={cn(
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 max-w-[88%] rounded-[10px] px-2.5 py-1.5 text-[0.8125rem] leading-snug",
              l.who === "you" && "bg-primary/15 self-end rounded-br-[3px]",
              l.who === "they" && "bg-card self-start rounded-bl-[3px]",
              l.who === "note" && "text-muted-foreground self-center px-1 py-0 text-xs italic"
            )}
          >
            {l.who !== "note" && <span className="text-muted-foreground block text-[0.6875rem] font-semibold">{l.who === "you" ? "You" : "Them"}</span>}
            <Inline text={l.text} ctx={ctx} />
          </p>
        </React.Fragment>
      ))}
      {finished && <p className="text-muted-foreground self-center pt-1 text-xs">That&apos;s the whole call. Click any part above to read it again.</p>}
    </div>
  );
}

/** How long a line stays before the next one: long enough to read it. */
const hold = (line: PracticeLine) => Math.max(1800, line.text.length * 48);

/** The practice call: plays every part's practice lines in order, moving the clock as it goes. */
function usePractice(stages: CallStage[]) {
  const script = React.useMemo<Shown[]>(() => stages.flatMap((s, stage) => s.practice.map((l) => ({ ...l, stage }))), [stages]);
  const [line, setLine] = React.useState(-1);
  const [playing, setPlaying] = React.useState(false);
  const advance = React.useCallback(() => {
    if (line + 1 >= script.length) setPlaying(false);
    setLine(line + 1);
  }, [line, script.length]);
  React.useEffect(() => {
    const current = script[line];
    if (!playing || !current) return;
    const timer = window.setTimeout(advance, hold(current));
    return () => window.clearTimeout(timer);
  }, [playing, line, script, advance]);
  const shown = line < 0 ? [] : script.slice(0, line + 1);
  const at = script[line];
  // Call time: each part's minutes shared out across its lines.
  const startOf = (i: number) => stages.slice(0, i).reduce((a, s) => a + s.minutes * 60, 0);
  const finished = !playing && line >= script.length;
  let seconds = 0;
  if (finished) seconds = startOf(stages.length);
  else if (at) {
    const own = script.filter((l) => l.stage === at.stage);
    seconds = startOf(at.stage) + (stages[at.stage]!.minutes * 60 * (own.indexOf(at) + 1)) / own.length;
  }
  return {
    playing,
    finished,
    shown,
    stage: at?.stage ?? null,
    clock: `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`,
    fill: (i: number) => Math.max(0, Math.min(1, (seconds - startOf(i)) / (stages[i]!.minutes * 60))),
    /** The part's to-dos the call has reached: what you said or did so far, spread over the list. */
    reached: (i: number) => {
      const steps = stages[i]!.steps.length;
      const own = script.filter((l) => l.stage === i && l.who !== "they");
      const said = shown.filter((l) => l.stage === i && l.who !== "they").length;
      const reached = own.length ? Math.ceil((said / own.length) * steps) : 0;
      return { reached, now: at?.stage === i && at.who !== "they" ? reached - 1 : -1 };
    },
    toggle: () => {
      if (playing) setPlaying(false);
      else {
        setLine(0);
        setPlaying(true);
      }
    },
    next: advance
  };
}

/* ---------- Answer questions ---------- */

function ObjectionsGuide({ guide, ctx }: { guide: Guide; ctx: KitContext }) {
  const { lead, items } = React.useMemo(() => objections(guide.body), [guide.body]);
  const topics = ["All", ...new Set(items.map((o) => o.topic).filter(Boolean))];
  const [topic, setTopic] = React.useState("All");
  const [term, setTerm] = React.useState("");
  const [picked, setPicked] = React.useState(items[0]?.says ?? "");
  const q = term.trim().toLowerCase();
  const shown = items.filter((o) => (topic === "All" || o.topic === topic) && `${o.says} ${o.ask} ${o.answer}`.toLowerCase().includes(q));
  const open = shown.find((o) => o.says === picked) ?? shown[0];
  return (
    <GuideCard guide={guide} ctx={ctx} lead={lead}>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Tile>
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
            <Input id="guide-objection-search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search, e.g. contract, price" aria-label="Search objections" className="bg-card pl-8" />
          </div>
          <div className="flex flex-wrap gap-1">
            {topics.map((t) => (
              <Chip key={t} on={t === topic} onClick={() => setTopic(t)}>
                {t}
              </Chip>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="text-muted-foreground p-2 text-[0.8125rem]">Nothing matches &ldquo;{term}&rdquo;. Try a shorter word.</p>
          ) : (
            <ul className="flex max-h-80 flex-col overflow-y-auto" aria-label="What they say">
              {shown.map((o) => (
                <li key={o.says}>
                  <button
                    type="button"
                    aria-pressed={o === open}
                    onClick={() => setPicked(o.says)}
                    className={cn(
                      "focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[0.8125rem] outline-none focus-visible:ring-3",
                      o === open ? "bg-card shadow-raised font-semibold" : "hover:bg-card"
                    )}
                  >
                    <span className="text-muted-foreground w-16 flex-none text-[0.6875rem] font-semibold">{o.topic}</span>
                    <span>&ldquo;{o.says}&rdquo;</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tile>
        {open && (
          <Tile>
            <span className="text-muted-foreground text-xs font-semibold">{open.topic || "Objection"}</span>
            <p className="text-base font-semibold tracking-tight">&ldquo;{open.says}&rdquo;</p>
            <Label>1. Ask back</Label>
            <p className="bg-card rounded-[5px] p-3 text-sm leading-relaxed">
              <Inline text={open.ask} ctx={ctx} />
            </p>
            <Label>2. Then say</Label>
            <SayThis text={open.answer} ctx={ctx} label="the answer" />
          </Tile>
        )}
      </div>
    </GuideCard>
  );
}

/* ---------- Get them live ---------- */

function LaunchGuide({ guide, ctx, productId }: { guide: Guide; ctx: KitContext; productId: string }) {
  const { lead, steps, closing } = React.useMemo(() => launchPlan(guide.body), [guide.body]);
  const [ticks, onTick] = useTicks(productId, guide.id);
  const [type, setType] = React.useState(0);
  const lists = steps.map((s) => (s.byType ? [capital(s.byType[type]?.text ?? "")] : s.items));
  const ids = steps.flatMap((s, i) => lists[i]!.map((_, j) => `${s.title}${s.byType ? `:${s.byType[type]?.label}` : ""}:${j}`));
  const done = ids.filter((id) => ticks[id]).length;
  return (
    <GuideCard guide={guide} ctx={ctx} lead={lead}>
      <div className="flex items-center gap-3">
        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
          <span className={cn("block h-full transition-[width]", done === ids.length ? "bg-green-600 dark:bg-green-400" : "bg-amber-500")} style={{ width: `${ids.length ? (done / ids.length) * 100 : 0}%` }} />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">{done === ids.length ? "All done. They're live." : `${done} of ${ids.length} done`}</span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.title} className="min-w-0">
            <Tile n={i + 1} title={titleCase(s.title)} className="h-full">
              <span className="text-muted-foreground -order-1 text-xs font-semibold">{s.when}</span>
              {s.byType && (
                <div className="flex flex-wrap gap-1">
                  {s.byType.map((t, j) => (
                    <Chip key={t.label} small on={j === type} onClick={() => setType(j)}>
                      {t.label}
                    </Chip>
                  ))}
                </div>
              )}
              <Checklist items={lists[i]!} ctx={ctx} ticks={ticks} onTick={onTick} prefix={`${s.title}${s.byType ? `:${s.byType[type]?.label}` : ""}`} />
            </Tile>
          </li>
        ))}
      </ol>
      {closing && <Tip text={closing} ctx={ctx} />}
    </GuideCard>
  );
}
