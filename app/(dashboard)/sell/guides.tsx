"use client";

import * as React from "react";
import { ChevronRightIcon, DownloadIcon, PlayIcon, SearchIcon, SquareIcon } from "lucide-react";

import { KitMarkdown, Inline } from "@/components/admin/kit-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { PLANS, PLAN_NAMES, cost, dollars, fill, type Guide, type KitContext, type Plan } from "@/lib/sales-kit";
import PRICES from "@/lib/pricing.json";
import { callScript, launchPlan, notice, objections, sections, tiles, type CallStage } from "@/lib/sell-guides";
import { cn } from "cn";
import { CopyButton, download, slug } from "./kit-ui";

/** The guides as one path, in the order a sale happens. Guides the path doesn't know show after it. */
const PATH: Record<string, { name: string; when: string; line: string }> = {
  pricing: { name: "Set Your Prices", when: "Before you sell", line: "What you pay, what you charge, what you keep." },
  "call-script": { name: "Have The Call", when: "The first call", line: "15 minutes: ask, show, price, next step." },
  objections: { name: "Answer Questions", when: "When they hesitate", line: "What people say, and what to say back." },
  onboarding: { name: "Get Them Live", when: "After they say yes", line: "From sign-up to a happy first month." }
};
const step = (g: Guide) => PATH[g.id] ?? { name: g.title, when: "Guide", line: "" };

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
    <div className="flex flex-col gap-4">
      <nav aria-label="Guides, in the order of a sale" className="bg-card shadow-raised grid gap-1 rounded-[5px] p-1.5 sm:grid-cols-2 xl:grid-cols-4">
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
        "hover:bg-muted focus-visible:ring-ring/50 grid grid-cols-[auto_1fr] content-start gap-x-3 gap-y-0.5 rounded-[5px] p-3 text-left transition-colors outline-none focus-visible:ring-3",
        active && "bg-muted"
      )}
    >
      <span
        className={cn(
          "row-span-2 grid size-7 place-items-center rounded-full border-[1.5px] text-xs font-semibold tabular-nums transition-colors",
          active ? "border-primary bg-primary text-primary-foreground" : "border-step-ring bg-card"
        )}
      >
        {index + 1}
      </span>
      <span className="text-muted-foreground text-xs font-semibold">{s.when}</span>
      <span className="text-[0.9375rem] font-semibold tracking-tight">{s.name}</span>
      {s.line && <span className="text-muted-foreground col-start-2 text-[0.8125rem]">{s.line}</span>}
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

/** The guide's card: its name, its lead and the Markdown download. */
function GuideCard({ guide, ctx, lead, children }: { guide: Guide; ctx: KitContext; lead: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{step(guide).name}</CardTitle>
        {lead && (
          <CardDescription>
            <Inline text={lead} ctx={ctx} />
          </CardDescription>
        )}
        <CardAction>
          <Button variant="ghost" size="sm" onClick={() => download(`${slug(ctx.brand)}-${guide.id}.md`, `# ${guide.title}\n\n${fill(guide.body, ctx)}\n`)}>
            <DownloadIcon data-icon="inline-start" />
            Download
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Label = ({ children }: { children: React.ReactNode }) => <p className="text-muted-foreground mb-2 text-xs font-semibold">{children}</p>;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 rounded-full px-3 py-1 text-[0.8125rem] transition-colors outline-none focus-visible:ring-3",
        on ? "bg-foreground text-background" : "bg-foreground/[0.06] hover:bg-foreground/10"
      )}
    >
      {children}
    </button>
  );
}

function Notice({ text, ctx }: { text: string; ctx: KitContext }) {
  return (
    <p className="rounded-[5px] border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm">
      <Inline text={text} ctx={ctx} />
    </p>
  );
}

/** "Say this" text with a copy button; placeholders the seller fills show as chips. */
function SayThis({ label, text, ctx, large = false }: { label: string; text: string; ctx: KitContext; large?: boolean }) {
  return (
    <div className="bg-muted relative rounded-[5px] p-4 pr-24">
      <Label>{label}</Label>
      <p className={cn("leading-relaxed", large ? "text-[0.9375rem]" : "text-sm")}>
        <Inline text={text} ctx={ctx} />
      </p>
      <div className="absolute top-3 right-3">
        <CopyButton text={fill(text, ctx)} label={label.toLowerCase()} />
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
  // Used only where this browser won't keep anything (private windows, blocked storage).
  const [visit, setVisit] = React.useState<Record<string, boolean>>({});
  const ticks = React.useMemo(() => ({ ...visit, ...parseTicks(saved) }), [visit, saved]);
  const toggle = (id: string, on: boolean) => {
    try {
      localStorage.setItem(key, JSON.stringify({ ...parseTicks(read()), [id]: on }));
      tickListeners.forEach((l) => l());
    } catch {
      setVisit((v) => ({ ...v, [id]: on }));
    }
  };
  return [ticks, toggle] as const;
}

function Checklist({ items, ctx, ticks, onTick, prefix }: { items: string[]; ctx: KitContext; ticks: Record<string, boolean>; onTick: (id: string, on: boolean) => void; prefix: string }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        const id = `${prefix}:${i}`;
        return (
          <li key={id}>
            <label className="hover:bg-muted flex cursor-pointer items-start gap-2.5 rounded-[5px] px-2 py-1.5 text-sm">
              <Checkbox className="mt-0.5" checked={!!ticks[id]} onCheckedChange={(v) => onTick(id, v === true)} />
              <span className={cn(ticks[id] && "text-muted-foreground line-through")}>
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
        <div key={s.title}>
          <Label>{s.title}</Label>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {tiles(s.body)!.map((t) => (
              <div key={t.label} className="bg-muted rounded-[5px] p-3">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-muted-foreground text-[0.8125rem]">
                  <Inline text={capital(t.text)} ctx={ctx} />
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      {notices.map((s) => (
        <Notice key={s.title} text={`**${s.title}:** ${notice(s.body)}`} ctx={ctx} />
      ))}
      {details.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium">
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
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-4">
        <div>
          <Label>Plan</Label>
          <div className="flex flex-wrap gap-1.5">
            {PLANS.map((p) => (
              <Chip key={p} on={p === plan} onClick={() => setPlan(p)}>
                {PLAN_NAMES[p]}
              </Chip>
            ))}
          </div>
        </div>
        <Slider id="guide-price" label={`You charge a month: $${price}`} min={5} max={Math.max(500, price)} value={price} onChange={(v) => setPrice(plan, v)} />
        {wholesalePercent === null ? (
          <div>
            <Slider id="guide-sites" label={`Live sites you sell: ${sites}`} min={1} max={30} value={sites} onChange={setSites} />
            <Tiers sites={sites} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Your cost is our list price less your {wholesalePercent}% wholesale discount.</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Chip on={yearly} onClick={() => setYearly(!yearly)}>
            Paid yearly
          </Chip>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-muted rounded-[5px] p-4">
          <p className="text-muted-foreground text-xs font-semibold">{loss ? "You lose each month" : "You keep each month"}</p>
          <p className={cn("text-3xl font-semibold tracking-tight tabular-nums", loss && "text-rose-700 dark:text-rose-300")}>
            {loss && "−"}${dollars(Math.abs(kept))}
          </p>
          <p className="text-muted-foreground text-xs">
            per site{sites > 1 && ` · ${loss ? "−" : ""}$${dollars(Math.abs(Math.round(kept * sites * 100) / 100))} across ${sites} sites`}
            {yearly && " · yearly, as a monthly average"}
          </p>
          <div className="bg-card mt-3 flex h-2.5 overflow-hidden rounded-full" aria-hidden>
            <span className="bg-step-ring transition-[width]" style={{ width: `${share}%` }} />
            <span className="bg-green-600 transition-[width] dark:bg-green-400" style={{ width: `${100 - share}%` }} />
          </div>
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>Your cost ${dollars(each)}</span>
            <span>Yours</span>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Your prices are saved in this browser and used in every message, offer sheet and deck.</p>
      </div>
    </div>
  );
}

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
    <div className="mt-2 grid grid-cols-4 gap-1">
      {tiers.map((t) => (
        <div
          key={t.sites}
          className={cn(
            "rounded-[5px] px-1 py-1.5 text-center text-[0.6875rem] leading-tight transition-colors",
            t === active ? "bg-green-600/10 font-semibold text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"
          )}
        >
          {t.sites}+ sites
          <br />
          {t.percent ? `${t.percent}% off` : "list price"}
        </div>
      ))}
    </div>
  );
}

/* ---------- Have the call ---------- */

/** Practice runs the 15 minutes this many times faster, so the clock can be seen moving. */
const PRACTICE_SPEED = 20;

function CallGuide({ guide, ctx, productId }: { guide: Guide; ctx: KitContext; productId: string }) {
  const { lead, stages, checklists } = React.useMemo(() => callScript(guide.body), [guide.body]);
  const [ticks, onTick] = useTicks(productId, guide.id);
  const [current, setCurrent] = React.useState(0);
  const practice = usePractice(stages, setCurrent);
  const stage = stages[current];
  return (
    <>
      <GuideCard guide={guide} ctx={ctx} lead={lead}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>The {stages.reduce((a, s) => a + s.minutes, 0)} minutes</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums" aria-live="off">
              {practice.clock}
            </span>
            <Button size="sm" onClick={practice.toggle}>
              {practice.running ? <SquareIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {practice.running ? "Stop" : "Practise The Call"}
            </Button>
          </div>
        </div>
        <div className="flex h-11 gap-0.5" role="group" aria-label="Parts of the call">
          {stages.map((s, i) => (
            <button
              key={s.name}
              type="button"
              aria-pressed={i === current}
              onClick={() => setCurrent(i)}
              style={{ flex: s.minutes }}
              className={cn(
                "focus-visible:ring-ring/50 relative flex min-w-0 flex-col justify-center overflow-hidden rounded-[5px] px-2 text-left outline-none focus-visible:ring-3",
                i === current ? "bg-primary/15" : "bg-muted hover:bg-foreground/10"
              )}
            >
              <span className="bg-primary/20 absolute inset-y-0 left-0" style={{ width: `${practice.fill(i) * 100}%` }} aria-hidden />
              <span className="relative truncate text-xs font-semibold">{s.name}</span>
              <span className="text-muted-foreground relative text-[0.6875rem] max-sm:hidden">{s.minutes} min</span>
            </button>
          ))}
        </div>
        {stage && <Stage stage={stage} ctx={ctx} ticks={ticks} onTick={onTick} />}
      </GuideCard>
      <div className="grid gap-4 md:grid-cols-2">
        {checklists.map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <CardTitle>{c.title.replace(/\b\w/g, (l) => l.toUpperCase())}</CardTitle>
            </CardHeader>
            <CardContent>
              <Checklist items={c.items} ctx={ctx} ticks={ticks} onTick={onTick} prefix={c.title} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function Stage({ stage, ctx, ticks, onTick }: { stage: CallStage; ctx: KitContext; ticks: Record<string, boolean>; onTick: (id: string, on: boolean) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      {stage.say && <SayThis label="Say something like" text={stage.say} ctx={ctx} large />}
      <div className="flex flex-col gap-3">
        <Checklist items={stage.steps} ctx={ctx} ticks={ticks} onTick={onTick} prefix={`part:${stage.name}`} />
        {stage.tip && <p className="text-muted-foreground border-step-ring border-l-2 pl-3 text-[0.8125rem]">{stage.tip}</p>}
      </div>
    </div>
  );
}

/** The practice timer: runs the call at PRACTICE_SPEED and moves to each part as its time comes. */
function usePractice(stages: CallStage[], setCurrent: (i: number) => void) {
  const [elapsed, setElapsed] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const total = stages.reduce((a, s) => a + s.minutes, 0) * 60;
  React.useEffect(() => {
    if (!running) return;
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const seconds = Math.min(total, ((performance.now() - start) / 1000) * PRACTICE_SPEED);
      setElapsed(seconds);
      let acc = 0;
      const at = stages.findIndex((s) => (acc += s.minutes * 60) > seconds);
      if (at >= 0) setCurrent(at);
      if (seconds < total) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, stages, total, setCurrent]);
  const startOf = (i: number) => stages.slice(0, i).reduce((a, s) => a + s.minutes * 60, 0);
  return {
    running,
    clock: `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, "0")}`,
    fill: (i: number) => Math.max(0, Math.min(1, (elapsed - startOf(i)) / (stages[i]!.minutes * 60))),
    toggle: () => {
      if (!running) setElapsed(0);
      setRunning(!running);
    }
  };
}

/* ---------- Answer questions ---------- */

function ObjectionsGuide({ guide, ctx }: { guide: Guide; ctx: KitContext }) {
  const { lead, items } = React.useMemo(() => objections(guide.body), [guide.body]);
  const topics = ["All", ...new Set(items.map((o) => o.topic).filter(Boolean))];
  const [topic, setTopic] = React.useState("All");
  const [term, setTerm] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(items[0]?.says ?? null);
  const q = term.trim().toLowerCase();
  const shown = items.filter((o) => (topic === "All" || o.topic === topic) && `${o.says} ${o.ask} ${o.answer}`.toLowerCase().includes(q));
  return (
    <GuideCard guide={guide} ctx={ctx} lead={lead}>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input id="guide-objection-search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search what they said, e.g. contract, price, leave" aria-label="Search objections" className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Chip key={t} on={t === topic} onClick={() => setTopic(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {shown.length === 0 && <p className="bg-muted text-muted-foreground rounded-[5px] p-4 text-center text-sm">Nothing matches &ldquo;{term}&rdquo;. Try a shorter word.</p>}
        {shown.map((o) => {
          const isOpen = open === o.says;
          return (
            <div key={o.says} className="bg-card shadow-raised rounded-[5px]">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.says)} className="focus-visible:ring-ring/50 flex w-full items-center gap-2.5 rounded-[5px] px-3.5 py-3 text-left outline-none focus-visible:ring-3">
                {o.topic && <Badge variant="info">{o.topic}</Badge>}
                <span className="flex-1 font-semibold">&ldquo;{o.says}&rdquo;</span>
                <ChevronRightIcon className={cn("text-muted-foreground size-4 transition-transform", isOpen && "rotate-90")} aria-hidden />
              </button>
              {isOpen && (
                <div className="grid gap-2.5 px-3.5 pb-3.5 md:grid-cols-[1fr_1.6fr]">
                  <div className="bg-muted rounded-[5px] p-3 text-sm">
                    <Label>Ask back</Label>
                    <Inline text={o.ask} ctx={ctx} />
                  </div>
                  <SayThis label="Then say" text={o.answer} ctx={ctx} />
                </div>
              )}
            </div>
          );
        })}
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
      <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.title} className="bg-muted flex min-w-0 flex-col gap-2 rounded-[5px] p-3">
            <span className="text-muted-foreground text-xs font-semibold">{s.when}</span>
            <span className="text-sm font-semibold">{s.title.replace(/\b\w/g, (l) => l.toUpperCase())}</span>
            {s.byType && (
              <div className="flex flex-wrap gap-1">
                {s.byType.map((t, j) => (
                  <Chip key={t.label} on={j === type} onClick={() => setType(j)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            )}
            <Checklist items={lists[i]!} ctx={ctx} ticks={ticks} onTick={onTick} prefix={`${s.title}${s.byType ? `:${s.byType[type]?.label}` : ""}`} />
          </li>
        ))}
      </ol>
      {closing && (
        <p className="text-muted-foreground border-step-ring border-l-2 pl-3 text-[0.8125rem]">
          <Inline text={closing} ctx={ctx} />
        </p>
      )}
    </GuideCard>
  );
}
