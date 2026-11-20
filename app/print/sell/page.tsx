import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { getViewer } from "@/auth";
import { getAdminApi } from "@/lib/api/client";
import { GROUP_IDS, customerFacingShop, sitePictures, objectionList, pitch, titleCase, type GroupId } from "@/lib/sales-kit";
import { loadSalesKit } from "@/lib/sales-kit-files";
import { PrintSheet } from "./print-sheet";

type Search = Promise<{ product?: string; group?: string; kind?: string; prospect?: string }>;

/** A demo's full address: demo links can be paths on this dashboard, so they take this request's origin, port included. */
async function absolute(url: string) {
  if (/^https?:/.test(url)) return url;
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]!.trim();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (host.startsWith("localhost") ? "http" : "https");
  return new URL(url, `${proto}://${host}`).toString();
}

/** The prospect a sheet or deck is made for, when one is picked and their demo is ready. */
async function prospectFor(productId: string, prospectId: string | undefined) {
  if (!prospectId) return null;
  const list = await getAdminApi()
    .prospectDemos(productId)
    .catch(() => null);
  const p = list?.prospects.find((d) => d.id === prospectId);
  if (!p) return null;
  return { company: p.company, siteType: p.siteType, demo: p.demoUrl ? await absolute(p.demoUrl) : null };
}

/**
 * A printable offer sheet or pitch deck for one customer group, in the storefront's brand, outside the dashboard's
 * frame so the browser's Save as PDF gives a clean file. With a prospect it is made for them: their name on it, a
 * site of their type, and a QR code that opens their demo.
 */
async function load(searchParams: Search) {
  const { product: productId, group, kind, prospect: prospectId } = await searchParams;
  if (!GROUP_IDS.includes(group as GroupId)) notFound();
  const api = getAdminApi();
  const viewer = await getViewer();
  const products = await api.products();
  const product = products.find((p) => p.id === productId) ?? products.find((p) => p.id === viewer?.active?.productId) ?? products[0];
  if (!product) notFound();
  const [kit, branding, storefront, prospect] = await Promise.all([
    loadSalesKit(),
    api.branding(product.id).catch(() => null),
    api.storefront(product.id).catch(() => null),
    prospectFor(product.id, prospectId)
  ]);
  const playbook = kit.playbooks.find((p) => p.id === group)!;
  const qr = prospect?.demo ? await QRCode.toString(prospect.demo, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) : null;
  return {
    product,
    playbook,
    kind: kind === "deck" ? ("deck" as const) : ("offer" as const),
    brand: branding?.shown.name ?? product.name,
    color: branding?.shown.color ?? null,
    logo: branding?.shown.logoUrl ?? null,
    support: branding?.shown.supportEmail ?? null,
    shop: customerFacingShop(storefront?.domain),
    sender: viewer?.user.name || null,
    prospect: prospect && { company: prospect.company, demo: prospect.demo, qr },
    pictures: sitePictures(playbook.id, prospect?.siteType),
    objections: objectionList(playbook.sections.find((s) => s.title === "Objections")?.body ?? "").slice(0, 2)
  };
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { brand, playbook, kind, prospect } = await load(searchParams);
  // The PDF's file name comes from the title, so it carries the seller's brand only.
  const what = kind === "deck" ? "Pitch Deck" : "Offer Sheet";
  return { title: { absolute: `${brand} ${what} for ${prospect?.company ?? titleCase(playbook.title)}` } };
}

export default async function PrintSellPage({ searchParams }: { searchParams: Search }) {
  const data = await load(searchParams);
  return (
    <PrintSheet
      kind={data.kind}
      productId={data.product.id}
      group={data.playbook.title}
      plan={data.playbook.plan}
      pitch={pitch(data.playbook)}
      objections={data.objections}
      pictures={data.pictures}
      prospect={data.prospect}
      brand={data.brand}
      color={data.color}
      logo={data.logo}
      support={data.support}
      shop={data.shop}
      sender={data.sender}
    />
  );
}
