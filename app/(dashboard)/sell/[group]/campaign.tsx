"use client";

import * as React from "react";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  MessageSquareQuoteIcon,
  MonitorPlayIcon,
  PhoneIcon,
  PresentationIcon,
  Share2Icon,
  UsersRoundIcon,
  type LucideIcon
} from "lucide-react";

import { useSellPrices } from "@/hooks/use-sell-prices";
import {
  PLAN_NAMES,
  dollars,
  fill,
  keep,
  playbookMarkdown,
  type KitDemo,
  type KitContext,
  type Pitch,
  type Playbook,
  type Step
} from "@/lib/sales-kit";
import { PiecePreview } from "@/app/print/sell/print-sheet";
import { Inline, KitMarkdown } from "@/components/admin/kit-markdown";
import { callScript } from "@/lib/sell-guides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardIcon } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "cn";
import { CopyButton, download, slug } from "../kit-ui";
import { OutreachAutomation } from "./outreach-automation";

const CHANNEL: Record<Step["channel"], { icon: LucideIcon; label: string }> = {
  post: { icon: MegaphoneIcon, label: "Post" },
  social: { icon: Share2Icon, label: "Direct message" },
  email: { icon: MailIcon, label: "Email" },
  text: { icon: MessageSquareIcon, label: "Text" },
  call: { icon: PhoneIcon, label: "Call" }
};

const dayLabel = (day: number) => (day === 0 ? "Before You Start" : `Day ${day}`);

/** A prospect whose website is read, so a sheet or deck can be made for them. */
export type ReadyProspect = { id: string; company: string };

const ANYONE = "anyone";

export function Campaign({
  productId,
  playbook,
  steps,
  pitch,
  who,
  where,
  objections,
  demo,
  demos,
  callScript,
  context,
  look,
  pictures,
  prospects,
  wholesalePercent
}: {
  productId: string;
  playbook: Playbook;
  steps: Step[];
  pitch: Pitch;
  who: string;
  where: string;
  objections: { q: string; a: string }[];
  demo: string;
  demos: KitDemo[];
  callScript: string;
  context: Omit<KitContext, "prices" | "plan">;
  /** The seller's colour and logo, for the previews. */
  look: { color: string | null; logo: string | null };
  pictures: { desktop: string; phone: string };
  prospects: ReadyProspect[];
  /** The reseller's wholesale discount, or null on a seller's storefront. */
  wholesalePercent: number | null;
}) {
  const [prices] = useSellPrices(productId);
  const ctx: KitContext = { ...context, prices, plan: playbook.plan };
  const price = prices[playbook.plan];
  // Kept here so the picked prospect stays picked when the seller looks at another tab and comes back.
  const [forId, setFor] = React.useState(ANYONE);

  return (
    <Tabs defaultValue="pitch" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="max-w-full justify-start">
            <TabsTrigger value="pitch">The Pitch</TabsTrigger>
            <TabsTrigger value="plan">32-Day Plan</TabsTrigger>
            <TabsTrigger value="find">Where To Find Them</TabsTrigger>
            <TabsTrigger value="objections">Objections</TabsTrigger>
          </TabsList>
        </div>
        <p className="text-muted-foreground text-sm">
          Sell them <span className="text-foreground font-medium">{PLAN_NAMES[playbook.plan]}</span> at{" "}
          <span className="text-foreground font-medium tabular-nums">${price}</span> a month · you keep{" "}
          <span className="text-foreground font-medium tabular-nums">${dollars(keep(playbook.plan, price, wholesalePercent))}</span>
        </p>
      </div>

      <TabsContent value="pitch">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
          <PitchCard pitch={pitch} demo={demo} demos={demos} ctx={ctx} />
          <Pieces
            productId={productId}
            playbook={playbook}
            pitch={pitch}
            objections={objections}
            context={context}
            look={look}
            pictures={pictures}
            prospects={prospects}
            forId={forId}
            onFor={setFor}
            ctx={ctx}
          />
        </div>
      </TabsContent>

      <TabsContent value="plan">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDaysIcon className="text-muted-foreground size-4" aria-hidden />
                  Your Plan, Day By Day
                </CardTitle>
                <CardDescription>
                  Send each message on its day, and stop when they reply. Dashed boxes are yours to fill in for each prospect.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => download(`${slug(context.brand)}-${playbook.id}-playbook.md`, playbookMarkdown(playbook, ctx))}
              >
                <DownloadIcon data-icon="inline-start" />
                Playbook
              </Button>
            </CardHeader>
            <CardContent className="lg:max-h-[calc(100dvh-17rem)] lg:overflow-y-auto">
              <DayPlan steps={steps} ctx={ctx} callScript={callScript} />
            </CardContent>
          </Card>
          <OutreachAutomation productId={productId} group={playbook.title} steps={steps} ctx={ctx} />
        </div>
      </TabsContent>

      <TabsContent value="find">
        <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
          <Card>
            <CardHeader>
              <CardIcon>
                <MapPinIcon />
              </CardIcon>
              <CardTitle>Where To Find Them</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <KitMarkdown source={where} ctx={ctx} />
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium">Search Google Maps For</p>
                <div className="flex flex-wrap gap-1.5">
                  {playbook.finder.map((f) => (
                    <a key={f} href={`https://www.google.com/maps/search/${encodeURIComponent(f)}`} target="_blank" rel="noreferrer">
                      <Badge variant="outline" className="hover:bg-muted gap-1">
                        <MapPinIcon className="size-3" aria-hidden />
                        {f}
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardIcon>
                <UsersRoundIcon />
              </CardIcon>
              <CardTitle>Who They Are</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <KitMarkdown source={who} ctx={ctx} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="objections">
        <Card>
          <CardContent className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {objections.map((o) => (
              <div key={o.q} className="space-y-1">
                <p className="text-sm font-semibold">
                  &ldquo;
                  <Inline text={o.q} ctx={ctx} />
                  &rdquo;
                </p>
                <p className="text-muted-foreground text-sm">
                  <Inline text={o.a} ctx={ctx} />
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function PitchCard({ pitch, demo, demos, ctx }: { pitch: Pitch; demo: string; demos: KitDemo[]; ctx: KitContext }) {
  return (
    <Card>
      <CardHeader>
        <CardIcon>
          <MessageSquareQuoteIcon />
        </CardIcon>
        <CardTitle>What To Say</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm lg:max-h-[calc(100dvh-17rem)] lg:overflow-y-auto">
        <p className="text-lg leading-snug font-medium text-balance">&ldquo;{pitch.answer}&rdquo;</p>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">What They Deal With Today</p>
          <ul className="space-y-1.5">
            {pitch.today.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-muted-foreground mt-px shrink-0" aria-hidden>
                  ×
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">Show Them</p>
          <ul className="space-y-1.5">
            {pitch.show.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckIcon className="text-foreground/70 mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 border-t pt-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <MonitorPlayIcon className="size-3.5" aria-hidden />
            Live Demo
          </p>
          {demos.length ? (
            demos.map((d) => (
              <a
                key={d.kit}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="hover:bg-muted/60 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.business}</span>
                  <span className="text-muted-foreground block text-xs">{d.kind} · opens in about 30 seconds</span>
                </span>
                <ExternalLinkIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </a>
            ))
          ) : (
            <p className="text-muted-foreground">
              <Inline text={demo} ctx={ctx} /> Read a prospect&apos;s website under Your Prospects for a demo made for them.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** The offer sheet and the deck, as live previews, made for a prospect when one is picked. */
function Pieces({
  productId,
  playbook,
  pitch,
  objections,
  context,
  look,
  pictures,
  prospects,
  forId,
  onFor,
  ctx
}: {
  productId: string;
  playbook: Playbook;
  pitch: Pitch;
  objections: { q: string; a: string }[];
  context: Omit<KitContext, "prices" | "plan">;
  look: { color: string | null; logo: string | null };
  pictures: { desktop: string; phone: string };
  prospects: ReadyProspect[];
  forId: string;
  onFor: (id: string) => void;
  ctx: KitContext;
}) {
  const prospect = prospects.find((p) => p.id === forId) ?? null;
  const href = (kind: "offer" | "deck") =>
    `/print/sell?product=${encodeURIComponent(productId)}&group=${playbook.id}&kind=${kind}${prospect ? `&prospect=${encodeURIComponent(prospect.id)}` : ""}`;
  const piece = {
    productId,
    group: playbook.title,
    plan: playbook.plan,
    pitch,
    objections: objections.map((o) => ({ q: fill(o.q, ctx), a: fill(o.a, ctx) })),
    pictures,
    // The preview shows their name; the QR code to their demo is made when the page opens.
    prospect: prospect ? { company: prospect.company, demo: null, qr: null } : null,
    brand: context.brand,
    color: look.color,
    logo: look.logo,
    support: context.support,
    shop: context.shop,
    sender: context.sender
  };
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Offer Sheet And Pitch Deck</CardTitle>
          <CardDescription>
            In the {context.brand} name, with your prices. Pick a prospect to put their name on them and a code that opens their demo.
          </CardDescription>
        </div>
        <Select value={forId} onValueChange={onFor}>
          <SelectTrigger size="sm" className="w-56" aria-label="Made for">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANYONE}>For Anyone In This Group</SelectItem>
            {prospects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                For {p.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)]">
        <PieceTile title="Offer Sheet" about="One page, letter size" icon={FileTextIcon} href={href("offer")} action="Open And Save As PDF">
          <PiecePreview kind="offer" {...piece} />
        </PieceTile>
        <PieceTile
          title="Pitch Deck"
          about={`${objections.length ? 9 : 8} slides, about nine minutes`}
          icon={PresentationIcon}
          href={href("deck")}
          action="Open To Present"
        >
          <PiecePreview kind="deck" {...piece} />
        </PieceTile>
      </CardContent>
    </Card>
  );
}

function PieceTile({
  title,
  about,
  icon: Icon,
  href,
  action,
  children
}: {
  title: string;
  about: string;
  icon: LucideIcon;
  href: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group/piece focus-visible:ring-ring/50 flex flex-col gap-3 rounded-xl outline-none focus-visible:ring-3"
    >
      <div className="bg-muted overflow-hidden rounded-lg border p-3 transition-colors group-hover/piece:border-foreground/20">
        <div className="overflow-hidden rounded-sm shadow-sm">{children}</div>
      </div>
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="text-muted-foreground size-4" aria-hidden />
          {title}
        </p>
        <p className="text-muted-foreground text-xs">{about}</p>
        <p className="text-muted-foreground group-hover/piece:text-foreground flex items-center gap-1 pt-1 text-xs font-medium">
          {action}
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </p>
      </div>
    </a>
  );
}

function DayPlan({ steps, ctx, callScript }: { steps: Step[]; ctx: KitContext; callScript: string }) {
  const days = [...new Set(steps.map((s) => s.day))];
  return (
    <ol className="relative">
      {days.map((day, i) => (
        <li key={day} className="relative grid grid-cols-[1.75rem_1fr] gap-x-3 pb-6 last:pb-0">
          {i < days.length - 1 && <span className="bg-border absolute top-7 bottom-0 left-[0.8125rem] w-px" aria-hidden />}
          <span className="bg-card text-muted-foreground relative z-10 flex size-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums">
            {day === 0 ? <CheckIcon className="size-3.5" aria-hidden /> : day}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="pt-1 text-sm font-semibold">{dayLabel(day)}</p>
            {steps
              .filter((s) => s.day === day)
              .map((s) => (
                <StepCard
                  key={`${s.channel}-${s.title}`}
                  step={s}
                  ctx={ctx}
                  callScript={callScript}
                  defaultOpen={i === 0 || (i === 1 && day === 1)}
                />
              ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepCard({ step, ctx, callScript, defaultOpen }: { step: Step; ctx: KitContext; callScript: string; defaultOpen: boolean }) {
  const { icon: Icon, label } = CHANNEL[step.channel];
  const m = step.message;
  const copy = m ? fill(m.subject ? `Subject: ${m.subject}\n\n${m.body}` : m.body, ctx) : null;
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/step rounded-lg border">
      <div className="flex items-center gap-2 px-3 py-2">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-muted-foreground shrink-0 text-xs max-sm:hidden">{label}</span>
          <span className="line-clamp-2 text-sm font-medium">{m?.subject ? <Inline text={m.subject} ctx={ctx} /> : step.title}</span>
          <ChevronDownIcon
            className="text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/step:rotate-180"
            aria-hidden
          />
        </CollapsibleTrigger>
        {copy && <CopyButton text={copy} label={`${label}: ${step.title}`} variant="ghost" />}
      </div>
      <CollapsibleContent className={cn("border-t px-3 py-3 text-sm")}>
        {m ? (
          <p className="whitespace-pre-line">
            <Inline text={m.body} ctx={ctx} />
          </p>
        ) : (
          <CallOutline script={callScript} ctx={ctx} />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** The call script's steps, short, for the call step. */
function CallOutline({ script, ctx }: { script: string; ctx: KitContext }) {
  const parts = callScript(script).stages.map((s) => s.name);
  return (
    <div className="space-y-2">
      <p>If they haven&apos;t replied, call to book a 15-minute demo. The full script is under Guides.</p>
      <ol className="text-muted-foreground list-inside list-decimal space-y-0.5">
        {parts.map((p) => (
          <li key={p}>
            <Inline text={p} ctx={ctx} />
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground">
        Suggest {PLAN_NAMES[ctx.plan!]} at ${ctx.prices[ctx.plan!]} a month.
      </p>
    </div>
  );
}
