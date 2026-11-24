import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreIcon } from "lucide-react";

import { getViewer } from "@/auth";
import { getAdminApi } from "@/lib/api/client";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VersionsManager } from "./versions-manager";

export const metadata: Metadata = { title: "Templates" };

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
  const isStorefrontTemplate = product.storefrontTemplate;

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title={isStorefrontTemplate ? "Seller storefront template" : "Templates"}
        description={
          isStorefrontTemplate
            ? "The shop every seller and reseller gets when their storefront is built. Change it by building a new version, check it, then make it production."
            : `The website every new store from ${product.name} starts as. Change it by building a new version, check it, then make it production.`
        }
      />
      {isAdmin && storefrontTemplate && (
        <nav aria-label="Which template" className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant={isStorefrontTemplate ? "outline" : "secondary"}>
            <Link href={isStorefrontTemplate ? "/versions" : `/versions?product=${product.id}`} aria-current={isStorefrontTemplate ? undefined : "page"}>
              Store templates
            </Link>
          </Button>
          <Button asChild size="sm" variant={isStorefrontTemplate ? "secondary" : "outline"}>
            <Link href={`/versions?product=${storefrontTemplate.id}`} aria-current={isStorefrontTemplate ? "page" : undefined}>
              Seller storefront template
            </Link>
          </Button>
        </nav>
      )}
      <VersionsManager productId={product.id} versions={versions} templates={templates} tab={tab} />
    </div>
  );
}
