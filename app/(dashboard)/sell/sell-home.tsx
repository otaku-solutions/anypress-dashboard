"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, CircleDollarSignIcon } from "lucide-react";

import { useSellPrices } from "@/hooks/use-sell-prices";
import { PLANS, PLAN_NAMES, VOLUME_IN_WORDS, cost, dollars, keep, type GroupId, type Guide, type KitContext, type Plan } from "@/lib/sales-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardIcon } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupIcon } from "./kit-ui";
import { ProspectFinder } from "./prospect-finder";
import { ProspectList } from "./prospect-list";
import { Guides } from "./guides";

export type GroupSummary = {
  id: GroupId;
  title: string;
  /** The title in Title Case, for the card. */
  label: string;
  plan: Plan;
  who: string;
  /** The first thing they put up with today, the card's one line. */
  pain: string;
  /** A full-page picture of the site they would get. */
  picture: string;
  finder: string[];
};

export function SellHome({
  productId,
  groups,
  guides,
  context,
  wholesalePercent,
  initialTab
}: {
  productId: string;
  /** The tab to open on (the old prospect board's address opens Prospects). */
  initialTab?: string;
  groups: GroupSummary[];
  guides: Guide[];
  context: Omit<KitContext, "prices" | "plan">;
  /** The reseller's wholesale discount, or null on a seller's storefront. */
  wholesalePercent: number | null;
}) {
  const [prices, setPrice] = useSellPrices(productId);
  const [tab, setTab] = React.useState(initialTab === "prospects" ? "prospects" : "groups");
  // Bumped when the finder reads websites, so the Prospects tab shows them.
  const [added, setAdded] = React.useState(0);
  const openProspects = () => {
    setAdded((n) => n + 1);
    setTab("prospects");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4 lg:gap-6">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [&::-webkit-scrollbar]:hidden">
        <TabsTrigger value="groups">Who To Sell To</TabsTrigger>
        <TabsTrigger value="find">Find Prospects</TabsTrigger>
        <TabsTrigger value="prospects">Your Prospects</TabsTrigger>
        <TabsTrigger value="prices">Your Prices</TabsTrigger>
        <TabsTrigger value="guides">Guides</TabsTrigger>
      </TabsList>
      </div>

      <TabsContent value="groups">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/sell/${g.id}?product=${encodeURIComponent(productId)}`}
              className="group/card bg-card hover:border-foreground/20 focus-visible:ring-ring/50 flex flex-col overflow-hidden rounded-[1.125rem] border transition-colors outline-none focus-visible:ring-3"
            >
              <div className="bg-muted relative aspect-[16/7] overflow-hidden border-b">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.picture} alt="" loading="lazy" className="absolute inset-x-[6%] top-[10%] w-[88%] rounded-t-md shadow-sm transition-transform duration-300 group-hover/card:-translate-y-1" />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4 pb-3">
                <div className="flex items-center gap-2">
                  <GroupIcon id={g.id} className="size-6" />
                  <h2 className="text-sm leading-snug font-semibold">{g.label}</h2>
                </div>
                <p className="text-muted-foreground text-sm text-pretty">{g.pain}.</p>
              </div>
              <div className="mt-auto flex items-end justify-between gap-2 border-t px-4 py-3">
                <div>
                  <p className="text-muted-foreground text-xs">{PLAN_NAMES[g.plan]}</p>
                  <p className="text-sm font-medium tabular-nums">
                    ${prices[g.plan]}/mo <span className="text-muted-foreground font-normal">· you keep ${dollars(keep(g.plan, prices[g.plan], wholesalePercent))}</span>
                  </p>
                </div>
                <ArrowRightIcon className="text-muted-foreground group-hover/card:text-foreground size-4 shrink-0 transition-transform group-hover/card:translate-x-0.5" aria-hidden />
              </div>
            </Link>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="find" forceMount className="data-[state=inactive]:hidden">
        <ProspectFinder productId={productId} groups={groups} onRead={openProspects} />
      </TabsContent>

      <TabsContent value="prospects">
        <ProspectList productId={productId} sender={context.sender} brand={context.brand} refresh={added} />
      </TabsContent>

      <TabsContent value="prices">
        <Prices prices={prices} setPrice={setPrice} wholesalePercent={wholesalePercent} />
      </TabsContent>

      <TabsContent value="guides">
        <Guides guides={guides} ctx={{ ...context, prices }} productId={productId} setPrice={setPrice} wholesalePercent={wholesalePercent} />
      </TabsContent>
    </Tabs>
  );
}

function Prices({ prices, setPrice, wholesalePercent }: { prices: Record<Plan, number>; setPrice: (plan: Plan, value: number) => void; wholesalePercent: number | null }) {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardIcon>
          <CircleDollarSignIcon />
        </CardIcon>
        <CardTitle>What you charge</CardTitle>
        <CardDescription>
          Your monthly price for each plan. Every message, offer sheet and deck uses these. Suggested prices are filled in until you change them, and they&apos;re kept in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-left text-xs">
            <tr className="border-b">
              <th className="py-2 pr-3 font-medium">Plan</th>
              <th className="py-2 pr-3 font-medium">Your cost</th>
              <th className="py-2 pr-3 font-medium">Your price</th>
              <th className="py-2 text-right font-medium">You keep</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((plan) => (
              <tr key={plan} className="border-b last:border-0">
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap">{PLAN_NAMES[plan]}</td>
                <td className="text-muted-foreground py-2.5 pr-3 tabular-nums">${dollars(cost(plan, wholesalePercent))}</td>
                <td className="py-2.5 pr-3">
                  <div className="relative w-24">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2">$</span>
                    <Input
                      aria-label={`Your price for ${PLAN_NAMES[plan]}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="pl-6 tabular-nums"
                      value={prices[plan]}
                      onChange={(e) => setPrice(plan, Math.max(0, Math.round(Number(e.target.value) || 0)))}
                    />
                  </div>
                </td>
                <td className="py-2.5 text-right font-medium tabular-nums">${dollars(keep(plan, prices[plan], wholesalePercent))}/mo</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-muted-foreground mt-3 text-xs">
          {wholesalePercent !== null
            ? `Costs are for a Small site a month: our list price less your ${wholesalePercent}% wholesale discount, as your monthly bill charges it. Medium costs 2× and Large 4×.`
            : `Costs are for a Small site billed monthly, at our list price. Your cost drops ${VOLUME_IN_WORDS}. Medium costs 2× and Large 4×.`}
        </p>
      </CardContent>
    </Card>
  );
}
