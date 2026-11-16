"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, MonitorPlayIcon, PrinterIcon, XIcon } from "lucide-react";

import { useSellPrices } from "@/hooks/use-sell-prices";
import { PLAN_NAMES, fill, included, textOn, titleCase, type KitContext, type Pitch, type Plan } from "@/lib/sales-kit";
import { Button } from "@/components/ui/button";

type Prospect = { company: string; demo: string | null; qr: string | null };

export type PieceProps = {
  kind: "offer" | "deck";
  productId: string;
  group: string;
  plan: Plan;
  pitch: Pitch;
  objections: { q: string; a: string }[];
  /** Their site, desktop and phone: a site of the prospect's type, else the group's. */
  pictures: Pictures;
  prospect: Prospect | null;
  brand: string;
  color: string | null;
  logo: string | null;
  support: string | null;
  shop: string | null;
  sender: string | null;
};

type Piece = PieceProps & { price: number; ctx: KitContext };

/** Printed pages stay light and use the seller's colour as the one accent. */
const PAGE = "bg-white text-[#141a18] [print-color-adjust:exact]";
const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric"
});

/** The seller's prices, the filled-in placeholders and the seller's colour, shared by the pages and their previews. */
function usePiece(props: PieceProps) {
  const [prices] = useSellPrices(props.productId);
  const accent = props.color ?? "#0f5d52";
  const ctx: KitContext = {
    brand: props.brand,
    shop: props.shop,
    sender: props.sender,
    support: props.support,
    demo: props.prospect?.demo ?? null,
    prices,
    plan: props.plan
  };
  const style = {
    "--brand": accent,
    "--on-brand": textOn(accent),
    "--brand-soft": `color-mix(in srgb, ${accent} 10%, white)`
  } as React.CSSProperties;
  return { price: prices[props.plan], ctx, style };
}

/** A small live picture of the offer sheet or the deck's cover, for the Sales Kit page. */
export function PiecePreview({ kind, ...props }: PieceProps) {
  const { price, ctx, style } = usePiece({ kind, ...props });
  const piece = { kind, ...props, price, ctx };
  return (
    <div style={style} className="pointer-events-none select-none" aria-hidden>
      {kind === "deck" ? slides(piece)[0] : <Offer {...piece} />}
    </div>
  );
}

export function PrintSheet(props: PieceProps) {
  const { price, ctx, style } = usePiece(props);
  const [presenting, setPresenting] = React.useState(false);

  return (
    <div style={style} className="min-h-screen bg-neutral-100 py-6 print:bg-white print:py-0">
      <style>{`@page { size: ${props.kind === "deck" ? "11in 6.1875in" : "letter"}; margin: 0; }`}</style>
      <Toolbar company={props.prospect?.company} deck={props.kind === "deck"} onPresent={() => setPresenting(true)} />
      {props.kind === "deck" ? (
        <Deck {...props} price={price} ctx={ctx} presenting={presenting} onClose={() => setPresenting(false)} />
      ) : (
        <Offer {...props} price={price} ctx={ctx} />
      )}
    </div>
  );
}

function Toolbar({ company, deck, onPresent }: { company?: string; deck: boolean; onPresent: () => void }) {
  return (
    <div className="mx-auto mb-4 flex max-w-[11in] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
      <p className="text-sm text-neutral-600">{company ? `Made for ${company}. ` : ""}Prices come from Your Prices on the Sales Kit page.</p>
      <div className="flex gap-2">
        {deck && (
          <Button size="sm" variant="outline" onClick={onPresent}>
            <MonitorPlayIcon data-icon="inline-start" />
            Present
          </Button>
        )}
        <Button size="sm" onClick={() => window.print()}>
          <PrinterIcon data-icon="inline-start" />
          Save As PDF
        </Button>
      </div>
    </div>
  );
}

export function Brand({ brand, logo, light }: { brand: string; logo: string | null; light?: boolean }) {
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={brand} className="h-9 w-auto max-w-[12rem] object-contain" />
  ) : (
    <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : ""}`}>{brand}</span>
  );
}

export function Contact({ sender, support, shop, className = "text-sm" }: Pick<PieceProps, "sender" | "support" | "shop"> & { className?: string }) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      {sender && <p className="font-medium">{sender}</p>}
      {support && <p>{support}</p>}
      {shop && <p>{shop.replace(/^https:\/\//, "")}</p>}
    </div>
  );
}

/** The seller's logo, or their name beside a square of their colour, sized by the surrounding text. */
function Logo({ brand, logo }: { brand: string; logo: string | null }) {
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={brand} className="h-[2.2em] w-auto max-w-[12em] object-contain" />
  ) : (
    <span className="flex items-center gap-[0.5em] font-extrabold tracking-tight">
      <span className="size-[1.3em] rounded-[0.3em] bg-[var(--brand)]" aria-hidden />
      {brand}
    </span>
  );
}

type Pictures = { desktop: string; phone: string };

/**
 * Their site on a laptop and a phone, the way product sheets show software: the whole width of the page on the laptop
 * and the phone beside it, so they see a real site and not a cropped corner of one.
 */
function Devices({ pictures, className = "" }: { pictures: Pictures; className?: string }) {
  return (
    <div className={`relative aspect-[16/9.4] w-full ${className}`}>
      <div className="absolute top-0 left-[2%] w-[80%]">
        <div className="rounded-t-[1.2em] bg-[#1d2120] p-[1.6%] pb-[2.4%] shadow-[0_1em_2.4em_rgba(0,0,0,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pictures.desktop} alt="" className="block aspect-[16/10] w-full rounded-[0.25em] bg-white object-cover object-top" />
        </div>
        <div className="mx-[-6%] h-[0.9em] rounded-b-[0.9em] bg-gradient-to-b from-[#d5d9d7] to-[#aeb4b1]" aria-hidden />
      </div>
      <div className="absolute right-[2%] bottom-0 w-[21%] rounded-[1.6em] bg-[#1d2120] p-[1.1%] shadow-[0_1em_2.4em_rgba(0,0,0,0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pictures.phone} alt="" className="block aspect-[9/19] w-full rounded-[1.25em] bg-white object-cover object-top" />
      </div>
    </div>
  );
}

function Made({ prospect, className = "" }: { prospect: Prospect | null; className?: string }) {
  if (!prospect) return null;
  return (
    <span
      className={`absolute rounded-full bg-[var(--brand)] px-[0.9em] py-[0.35em] font-semibold text-[var(--on-brand)] shadow-[0_0.3em_0.8em_rgba(0,0,0,0.2)] ${className}`}
    >
      Made for {prospect.company}
    </span>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-[0.5em]">
      <svg viewBox="0 0 16 16" className="mt-[0.15em] size-[1.05em] shrink-0" aria-hidden>
        <circle cx="8" cy="8" r="8" fill="var(--brand)" />
        <path d="M4.3 8.4l2.4 2.4 5-5" fill="none" stroke="var(--on-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

function Qr({ svg, className = "" }: { svg: string; className?: string }) {
  return (
    <div
      className={`shrink-0 bg-white p-[0.35em] [&_svg]:block [&_svg]:h-full [&_svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Offer({ brand, logo, group, plan, pitch, price, sender, support, shop, pictures, prospect }: Piece) {
  return (
    <article
      className={`${PAGE} mx-auto flex aspect-[8.5/11] w-full max-w-[8.5in] flex-col overflow-hidden shadow-sm [container-type:inline-size] print:aspect-auto print:h-[11in] print:shadow-none`}
    >
      <div className="flex h-full flex-col text-[1.5cqw] leading-[1.4]">
        <header className="flex items-center justify-between px-[7%] pt-[6%]">
          <span className="text-[1.25em]">
            <Logo brand={brand} logo={logo} />
          </span>
          <span className="text-[0.9em] text-[#59625f]">{prospect?.company ? `Prepared for ${prospect.company}` : `For ${titleCase(group)}`}</span>
        </header>
        <p role="heading" aria-level={1} className="mx-[7%] mt-[4%] text-[3.4em] leading-[1.04] font-bold tracking-[-0.03em] text-balance">
          {pitch.headline}
        </p>
        <p className="mx-[7%] mt-[2%] max-w-[46ch] text-[1.15em] text-[#59625f]">{pitch.answer}</p>
        <div className="relative mx-auto mt-[3%] w-[62%]">
          <Devices pictures={pictures} />
          <Made prospect={prospect} className="top-[2%] right-0 text-[0.95em]" />
        </div>
        <ul className="mx-[7%] mt-[4%] grid grid-cols-3 gap-[4%]">
          {pitch.show.map((item, i) => (
            <li key={item}>
              <span
                className="grid size-[2.2em] place-items-center rounded-[0.5em] bg-[var(--brand-soft)] font-extrabold text-[var(--brand)] [print-color-adjust:exact]"
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="mt-[0.5em]">{item}</p>
            </li>
          ))}
        </ul>
        <div className="mx-[7%] mt-[4%] mb-[4%] grid grid-cols-[1.35fr_1fr] overflow-hidden rounded-[0.8em] border border-[#e4e7e5]">
          <div className="p-[4%]">
            <p className="font-bold">What&apos;s Included</p>
            <ul className="mt-[0.4em] space-y-[0.3em]">
              {included(pitch.setup).map((x) => (
                <Check key={x}>{x}</Check>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center bg-[#141a18] p-[5%] text-white [print-color-adjust:exact]">
            <p className="text-[0.9em] text-[#b9c2bf]">{PLAN_NAMES[plan]} plan</p>
            <p className="text-[4.2em] leading-none font-extrabold tracking-[-0.03em]">${price}</p>
            <p className="text-[0.9em] text-[#b9c2bf]">a month</p>
          </div>
        </div>
        <OfferFooter sender={sender} support={support} shop={shop} prospect={prospect} />
      </div>
    </article>
  );
}

function OfferFooter({ sender, support, shop, prospect }: Pick<Piece, "sender" | "support" | "shop" | "prospect">) {
  const qr = prospect?.qr;
  return (
    <footer className="mt-auto flex items-center gap-[4%] bg-[var(--brand-soft)] px-[7%] py-[3.5%] [print-color-adjust:exact]">
      {qr && <Qr svg={qr} className="size-[6em]" />}
      <div>
        <p className="text-[1.3em] font-bold">{qr ? "Open Your Demo" : "See Yours Before You Decide"}</p>
        <p className="text-[#59625f]">
          {qr ? "Scan to click through it. Nothing to install." : "We'll set up a free demo with your name and details."}
        </p>
      </div>
      <div className="ml-auto text-right">
        <Contact sender={sender} support={support} shop={shop} className="text-[1em]" />
      </div>
    </footer>
  );
}

/** One 16:9 slide; sizes follow its width, so it reads the same on screen, presenting and in print. */
function Slide({ children, dark, className = "" }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <section
      className={`${dark ? "bg-[#0e1513] text-white [print-color-adjust:exact]" : PAGE} relative aspect-[16/9] w-full overflow-hidden [container-type:inline-size] print:h-[6.1875in] ${className}`}
    >
      <div className="flex h-full flex-col justify-center px-[7%] py-[6%] text-[1.5cqw] leading-[1.35]">{children}</div>
    </section>
  );
}

function Kicker({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[0.8em] font-bold tracking-[0.1em] uppercase ${light ? "text-white/70" : "text-[var(--brand)]"}`}>{children}</p>;
}

function Big({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-[0.5em] max-w-[24ch] text-[2.4em] leading-[1.08] font-bold tracking-[-0.03em] text-balance">{children}</h2>;
}

function CoverSlide({ brand, logo, group, pitch, sender, pictures, prospect }: Piece) {
  return (
    <Slide dark>
      <div className="grid h-full grid-cols-[1fr_1.35fr] items-center gap-[5%]">
        <div>
          <span className="text-[1.1em]">
            <Logo brand={brand} logo={logo} />
          </span>
          <p className="mt-[2em] text-[0.85em] font-bold tracking-[0.1em] text-white/70 uppercase">
            Prepared for {prospect?.company ?? titleCase(group)}
          </p>
          <p role="heading" aria-level={1} className="mt-[0.4em] text-[2.6em] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
            {pitch.headline}
          </p>
          <p className="mt-[1em] text-white/70">{[sender, MONTH.format(new Date())].filter(Boolean).join(" · ")}</p>
        </div>
        <Devices pictures={pictures} className="text-[0.8em]" />
      </div>
    </Slide>
  );
}

function TodaySlide({ pitch }: Piece) {
  return (
    <Slide>
      <div className="grid grid-cols-[1fr_1.1fr] items-center gap-[6%]">
        <div>
          <Kicker>What You Deal With Today</Kicker>
          <Big>{pitch.today[0]}.</Big>
        </div>
        <ul className="grid gap-[0.8em]">
          {pitch.today.slice(1).map((t) => (
            <li
              key={t}
              className="flex items-start gap-[0.6em] rounded-[0.6em] bg-[#f6efec] p-[1em] text-[1.3em] leading-[1.25] [print-color-adjust:exact]"
            >
              <span className="font-extrabold text-[#b4472b]" aria-hidden>
                ×
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

function AnswerSlide({ pitch, sender, brand }: Piece) {
  return (
    <Slide>
      <Kicker>What Changes</Kicker>
      <p className="mt-[2em] border-l-[0.25em] border-[var(--brand)] pl-[0.8em] text-[2.4em] leading-[1.2] font-semibold tracking-[-0.02em] text-balance">
        &ldquo;{pitch.answer}&rdquo;
      </p>
      <p className="mt-[1em] pl-[1.1em] text-[#59625f]">{[sender, brand].filter(Boolean).join(", ")}</p>
    </Slide>
  );
}

function SiteSlide({ pictures, prospect }: Piece) {
  return (
    <Slide>
      <Kicker>{prospect ? `Your Site, ${prospect.company}` : "Your Site"}</Kicker>
      <div className="relative mx-auto mt-[2%] w-[64%] text-[0.75em]">
        <Devices pictures={pictures} />
        <Made prospect={prospect} className="top-[2%] right-0 text-[1.1em]" />
      </div>
    </Slide>
  );
}

function ShowSlide({ pitch }: Piece) {
  return (
    <Slide>
      <Kicker>What You Can Do</Kicker>
      <Big>Everything on one site, with your name on it.</Big>
      <ul className="mt-[2em] grid grid-cols-3 gap-[3%]">
        {pitch.show.map((item, i) => (
          <li key={item} className="flex flex-col gap-[0.5em] rounded-[0.8em] bg-[#f2f5f4] p-[1.2em] [print-color-adjust:exact]">
            <span className="text-[1.8em] leading-none font-extrabold text-[var(--brand)]">{i + 1}</span>
            <span className="text-[1.05em]">{item}</span>
          </li>
        ))}
      </ul>
    </Slide>
  );
}

/** The three steps from yes to a live site; the first two follow the demo and the group's setup job. */
function startSteps(pitch: Piece["pitch"], hasDemo: boolean): [string, string][] {
  return [
    ["Pick A Design", hasDemo ? "Start from the demo you've seen, or pick another." : "Choose a ready-made design, or we pick one with you."],
    [
      "We Set It Up",
      pitch.setup ? `${pitch.setup}, with your logo, photos and details.` : "Your logo, photos, services and details, all added for you."
    ],
    ["Go Live", "On your own address, looked after every month."]
  ];
}

function StartSlide({ pitch, prospect }: Piece) {
  return (
    <Slide>
      <Kicker>How We Start</Kicker>
      <Big>You send what you have. We do the rest.</Big>
      <ol className="mt-[2em] grid grid-cols-3 gap-[3%]">
        {startSteps(pitch, Boolean(prospect?.demo)).map(([title, about], i) => (
          <li key={title} className="border-t-[0.25em] border-[var(--brand)] pt-[0.8em]">
            <p className="text-[0.85em] font-semibold text-[#59625f]">Step {i + 1}</p>
            <p className="text-[1.4em] font-bold">{title}</p>
            <p className="text-[#59625f]">{about}</p>
          </li>
        ))}
      </ol>
    </Slide>
  );
}

function AsksSlide({ objections, ctx }: Piece) {
  return (
    <Slide>
      <Kicker>What People Ask</Kicker>
      <dl className="mt-[2em] grid grid-cols-2 gap-[4%]">
        {objections.map((o) => (
          <div key={o.q}>
            <dt className="text-[1.7em] leading-[1.2] font-bold tracking-[-0.02em] text-balance">&ldquo;{fill(o.q, ctx)}&rdquo;</dt>
            <dd className="mt-[0.6em] text-[1.15em] text-[#59625f]">{fill(o.a, ctx)}</dd>
          </div>
        ))}
      </dl>
    </Slide>
  );
}

function PriceSlide({ pitch, price, plan }: Piece) {
  return (
    <Slide>
      <Kicker>What It Costs</Kicker>
      <div className="mt-[2em] grid grid-cols-[auto_1fr] items-end gap-[8%]">
        <div>
          <p className="text-[6em] leading-none font-extrabold tracking-[-0.04em]">${price}</p>
          <p className="mt-[0.4em] text-[1.1em] text-[#59625f]">a month, {PLAN_NAMES[plan]} plan</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-[2em] gap-y-[0.7em] text-[1.15em]">
          {included(pitch.setup).map((x) => (
            <Check key={x}>{x}</Check>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

function NextSlide({ sender, support, shop, prospect }: Piece) {
  const qr = prospect?.qr;
  return (
    <Slide dark>
      <div className="grid h-full grid-cols-[1fr_auto] items-center gap-[6%]">
        <div>
          <Kicker light>Next Step</Kicker>
          <h2 className="mt-[0.4em] text-[2.8em] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
            {qr ? "Click through your demo this week." : "Let's set up a free demo with your details."}
          </h2>
          <div className="mt-[1.5em] text-white/80 [&_p]:text-[1.1em]">
            <Contact sender={sender} support={support} shop={shop} className="text-[1em]" />
          </div>
        </div>
        {qr && <Qr svg={qr} className="size-[11em] rounded-[0.5em]" />}
      </div>
    </Slide>
  );
}

/** The deck, in order; What People Ask only when the playbook has objections. */
function slides(piece: Piece): React.ReactNode[] {
  const order = [CoverSlide, TodaySlide, AnswerSlide, SiteSlide, ShowSlide, StartSlide, AsksSlide, PriceSlide, NextSlide];
  return order.filter((S) => S !== AsksSlide || piece.objections.length > 0).map((S, i) => <S key={i} {...piece} />);
}

function Deck(props: Piece & { presenting: boolean; onClose: () => void }) {
  const all = slides(props);
  return (
    <>
      <div className="mx-auto flex max-w-[11in] flex-col gap-6 px-4 print:block print:max-w-none print:px-0">
        {all.map((s, i) => (
          <div key={i} className="shadow-sm break-after-page last:break-after-auto print:shadow-none">
            {s}
          </div>
        ))}
      </div>
      {props.presenting && <Presenter slides={all} onClose={props.onClose} />}
    </>
  );
}

const NEXT_KEYS = ["ArrowRight", "PageDown", " "];
const BACK_KEYS = ["ArrowLeft", "PageUp"];

/** The presenter's keys. Space is taken from a focused button so it moves one slide, not two; Tab stays inside. */
function presenterKey(e: KeyboardEvent, el: HTMLElement | null, go: (n: number) => void, onClose: () => void) {
  if (e.key === "Escape") return onClose();
  if (e.key === "Tab") return keepFocusIn(e, el);
  const step = NEXT_KEYS.includes(e.key) ? 1 : BACK_KEYS.includes(e.key) ? -1 : 0;
  if (!step) return;
  e.preventDefault();
  go(step);
}

/** Wraps Tab and Shift+Tab around the presenter's own buttons. */
function keepFocusIn(e: KeyboardEvent, el: HTMLElement | null) {
  const buttons = [...(el?.querySelectorAll<HTMLElement>("button") ?? [])];
  if (!buttons.length) return;
  const at = buttons.indexOf(document.activeElement as HTMLElement);
  const next = (at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
  e.preventDefault();
  buttons[at === -1 && e.shiftKey ? buttons.length - 1 : next]!.focus();
}

/** One slide at a time, filling the screen: arrows, space or a click move on; Escape ends. */
function Presenter({ slides: all, onClose }: { slides: React.ReactNode[]; onClose: () => void }) {
  const [i, setI] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const go = React.useCallback((n: number) => setI((cur) => Math.min(all.length - 1, Math.max(0, cur + n))), [all.length]);
  React.useEffect(() => {
    const el = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    el?.focus();
    el?.requestFullscreen?.().catch(() => {});
    const key = (e: KeyboardEvent) => presenterKey(e, el, go, onClose);
    const left = () => !document.fullscreenElement && onClose();
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", left);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", left);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      opener?.focus();
    };
  }, [go, onClose]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Presenting the pitch deck"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black print:hidden"
    >
      <button type="button" className="w-[min(100vw,177.78vh)]" onClick={() => go(1)} aria-label="Next slide">
        {all[i]}
      </button>
      <div className="absolute right-4 bottom-4 flex items-center gap-2 text-sm text-white/70">
        <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => go(-1)} aria-label="Previous slide">
          <ChevronLeftIcon />
        </Button>
        <span className="tabular-nums">
          {i + 1} / {all.length}
        </span>
        <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => go(1)} aria-label="Next slide">
          <ChevronRightIcon />
        </Button>
        <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose} aria-label="Stop presenting">
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
