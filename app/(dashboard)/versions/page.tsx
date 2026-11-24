import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreIcon } from "lucide-react";

import { getViewer } from "@/auth";
import { getAdminApi } from "@/lib/api/client";
import type { ProductDetail } from "@/lib/api/types";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VersionsManager } from "./versions-manager";

export const metadata: Metadata = { title: "Templates" };

const CHANGE_IT = "Change it by building a new version, check it, then make it production.";

function header(product: ProductDetail) {
  return product.storefrontTemplate
    ? { title: "Seller storefront template", description: `The shop every seller and reseller gets when their storefront is built. ${CHANGE_IT}` }
    : { title: "Templates", description: `The website every new store from ${product.name} starts as. ${CHANGE_IT}` };
}

/** For the platform admin: the stores' templates, or the seller storefront template (which the switcher leaves out). */
function TemplatePicker({ current, storefrontTemplate }: { current: ProductDetail; storefrontTemplate: ProductDetail }) {
  const onTemplate = current.storefrontTemplate;
  return (
    <nav aria-label="Which template" className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant={onTemplate ? "outline" : "secondary"}>
        <Link href={onTemplate ? "/versions" : `/versions?product=${current.id}`} aria-current={onTemplate ? undefined : "page"}>
          Store templates
        </Link>
      </Button>
      <Button asChild size="sm" variant={onTemplate ? "secondary" : "outline"}>
        <Link href={`/versions?product=${storefrontTemplate.id}`} aria-current={onTemplate ? "page" : undefined}>
          Seller storefront template
        </Link>
      </Button>
    </nav>
  );
}

export default async function VersionsPage({ searchParams }: { searchParams: Promise<{ product?: string; tab?: string }> }) {
  const { product: productId, tab } = await searchParams;
  const api = getAdminApi();
  const all = await api.products();
  // The seller storefront template is a template, not a shop: the switcher leaves it out, so it is reached from here.
  const storefrontTemplate = all.find((p) => p.storefrontTemplate);
  const products = all.filter((p) => !p.storefrontTemplate);
  // A customer has one storefront, so their pages open on it.
  const viewer = await getViewer();
  const isAdmin = viewer?.isAdmin === true;
  const onlyOne = !isAdmin && products.length === 1 ? products[0] : undefined;
  const product = all.find((p) => p.id === productId) ?? onlyOne;

  // These pages are about one storefront. With none picked, open the first rather than showing only a picker;
  // the switcher at the top moves between them.
  if (!product) {
    if (products[0]) redirect(`/versions?product=${products[0].id}${tab ? `&tab=${encodeURIComponent(tab)}` : ""}`);
    return (
      <div className="space-y-4 lg:space-y-6">
        <PageHeader title="Templates" />
        <Card>
          <EmptyState icon={StoreIcon} title="No storefronts yet">
            Each storefront has its own templates. A storefront is set up when a seller or reseller is approved.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const [versions, templates] = await Promise.all([api.versions(product.id), api.templates(product.id)]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader {...header(product)} />
      {isAdmin && storefrontTemplate && <TemplatePicker current={product} storefrontTemplate={storefrontTemplate} />}
      <VersionsManager productId={product.id} versions={versions} templates={templates} tab={tab} />
    </div>
  );
}
