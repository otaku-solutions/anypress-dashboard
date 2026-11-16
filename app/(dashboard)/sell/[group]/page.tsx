import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { GROUP_IDS, campaign, demosFor, objectionList, pitch, sitePictures, titleCase, type GroupId } from "@/lib/sales-kit";
import { getAdminApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { loadKitFor, pickProduct } from "../load";
import { GroupIcon } from "../kit-ui";
import { Campaign } from "./campaign";

type Params = Promise<{ group: string }>;
type Search = Promise<{ product?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { group } = await params;
  return { title: `Sales Kit · ${titleCase(group)}` };
}

export default async function SellGroupPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ group }, { product: productId }] = await Promise.all([params, searchParams]);
  if (!GROUP_IDS.includes(group as GroupId)) notFound();
  const { product, first } = await pickProduct(productId);
  if (!product) {
    if (first) redirect(`/sell/${group}?product=${first.id}`);
    redirect("/sell");
  }
  const [kit, list] = await Promise.all([
    loadKitFor(product),
    getAdminApi()
      .prospectDemos(product.id)
      .catch(() => null)
  ]);
  // Prospects whose website is read, newest first: a sheet or deck can be made for them.
  const prospects = (list?.prospects ?? []).filter((p) => p.statusCode === 1).map((p) => ({ id: p.id, company: p.company }));
  const playbook = kit.playbooks.find((p) => p.id === group)!;
  const section = (title: string) => playbook.sections.find((s) => s.title === title)?.body ?? "";
  const callScript = kit.guides.find((g) => g.id === "call-script");

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon">
          <Link href={`/sell?product=${encodeURIComponent(product.id)}`}>
            <ChevronLeft />
            <span className="sr-only">Back to the Sales Kit</span>
          </Link>
        </Button>
        <GroupIcon id={playbook.id} className="size-10 max-sm:hidden" />
        <div className="min-w-0">
          <h1 className="text-xl text-balance sm:truncate font-bold tracking-tight lg:text-2xl">{titleCase(playbook.title)}</h1>
          <p className="text-muted-foreground text-sm sm:truncate">{pitch(playbook).headline}</p>
        </div>
      </div>
      <Campaign
        productId={product.id}
        playbook={playbook}
        steps={campaign(playbook)}
        pitch={pitch(playbook)}
        who={section("Who")}
        where={section("Where to find them")}
        objections={objectionList(section("Objections"))}
        demo={section("Demo")}
        demos={demosFor(playbook.id)}
        callScript={callScript?.body ?? ""}
        context={kit.context}
        look={kit.look}
        pictures={sitePictures(playbook.id)}
        prospects={prospects}
        wholesalePercent={kit.wholesalePercent}
      />
    </div>
  );
}
