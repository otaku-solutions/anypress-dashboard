# Sales kit

What the dashboard's Sell page shows sellers and resellers: one playbook per customer group, plus guides every group shares. Sellers' customers must never see the platform's name, so nothing in here says it. Every file is Markdown with placeholders the Sell page fills in from the storefront's branding and prices.

| Placeholder | Filled with |
|---|---|
| `{{brand}}` | The storefront's brand name (Branding page), else its name |
| `{{shop}}` | The storefront's shop address |
| `{{sender}}` | The signed-in person's name |
| `{{support}}` | The storefront's support email |
| `{{price.website}}`, `{{price.bookings}}`, `{{price.store}}`, `{{price.community}}`, `{{price.everything}}` | The seller's own monthly price for each plan, or the suggested price when none is set |
| `{{demo}}` | The live demo link for the playbook's plan |
| `{{plan}}`, `{{price}}` | In the call script: the playbook's plan name and the seller's price for it |
| `{{prices.costs}}`, `{{prices.suggested}}`, `{{prices.tiers}}`, `{{prices.sizes}}`, `{{prices.yearly}}`, `{{prices.free}}`, `{{prices.wholesale}}`, `{{prices.example}}` | Guides only: the cost and suggested price tables and the volume, size, yearly and reseller terms, from the price list, so a guide never types a price |
| `{{prospect}}`, `{{business}}`, `{{city}}`, `{{day}}`, `{{marketplace}}` (where a shop sells today, such as Etsy) | Left for the seller to fill per message |

## Files

- `groups/<id>.md`: one playbook per customer group. The ids match the CRM's customer group field: `shops`, `regulated`, `courses`, `chambers`, `churches`, `franchises`, `agencies`, `developers`.
- `guides/pricing.md`: what to charge and what you keep.
- `guides/objections.md`: answers to what prospects say.
- `guides/call-script.md`: a first call, start to finish.
- `guides/onboarding.md`: from yes to a live site.

The Guides tab shows the four guides as one path, in the order a sale happens, and reads each guide's `##` sections by their shape (`lib/sell-guides.ts`), so keep to it:

- Every guide: the text before the first `##` is the guide's one-line lead. A `>` paragraph shows as a notice. A list whose items all start with `**Label:**` shows as tiles.
- `call-script.md`: a section named `Name (N minutes)` is one part of the call: a line in quotes to say, a list of things to do, then one tip. Under it, a `### Practice` list of `**You:**`, `**They:**` and `**Note:**` lines shows how that part can go when a seller practises the call. Sections without minutes (Before the call, After the call) are checklists.
- `objections.md`: each section is what the prospect says, in quotes, with `**Topic:**`, `**Ask back:**` and `**Then say:**` lines.
- `onboarding.md`: each section is a step with a `**When:**` line and a checklist; a list of `**Site type:**` items shows one site type at a time. A section without `**When:**` is the closing tip.

Each playbook has the same parts in the same order, so the Sell page can show them as tabs: Who, Where to find them, What to lead with, Offer, Outreach (emails, texts, social), Objections, Demo.

"What to lead with" starts with three labelled lines that the offer sheet, the pitch deck and the group page read:

- `**Headline:**` the outcome in one line, the sheet's and the deck's headline.
- `**Today:**` what the group deals with today, separated by semicolons.
- `**Setup includes:**` (optional) the one setup job this group gets, shown first under What's Included.

The Show items under it are written to the prospect ("your", "you"), since the sheet and deck speak to them.
