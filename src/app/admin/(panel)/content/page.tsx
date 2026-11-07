import { requireStaff } from "@/lib/server/auth";
import { getSiteContent } from "@/lib/data/catalog";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveContent } from "../../actions/settings";

const d = (c: number) => (c / 100).toFixed(2);

export default async function ContentPage() {
  await requireStaff("MANAGER");
  const c = await getSiteContent();
  return (
    <>
      <PageHeader title="Website & settings" kicker="Changes go live on the next page load" />
      <ActionForm action={saveContent} submitLabel="Save everything">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Homepage hero">
            <div className="space-y-3">
              <Field label="Headline, behind the burger"><input name="lineBack" defaultValue={c.hero.lineBack} className="admin-input" /></Field>
              <Field label="Headline, in front (orange)"><input name="lineFront" defaultValue={c.hero.lineFront} className="admin-input" /></Field>
              <Field label="Supporting line"><input name="sub" defaultValue={c.hero.sub} className="admin-input" /></Field>
              <Field label="Final headline"><input name="finaleHeadline" defaultValue={c.finale.headline} className="admin-input" /></Field>
              <Field label="Final headline, orange part"><input name="finaleAccent" defaultValue={c.finale.accent} className="admin-input" /></Field>
            </div>
          </Card>
          <Card title="Announcement banner">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="bannerEnabled" defaultChecked={c.banner.enabled} className="accent-[#ff5722]" /> Show the banner at the top of the site</label>
              <Field label="Text"><input name="bannerText" defaultValue={c.banner.text} className="admin-input" /></Field>
              <Field label="Link"><input name="bannerHref" defaultValue={c.banner.href} className="admin-input" /></Field>
            </div>
          </Card>
          <Card title="Restaurant information">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Business name"><input name="name" defaultValue={c.business.name} className="admin-input" /></Field>
              <Field label="Phone"><input name="phone" defaultValue={c.business.phone} className="admin-input" /></Field>
              <Field label="Email"><input name="email" type="email" defaultValue={c.business.email} className="admin-input" /></Field>
              <Field label="Google Maps link"><input name="mapsUrl" defaultValue={c.business.mapsUrl} className="admin-input" /></Field>
              <Field label="Address (one line per row)" className="md:col-span-2"><textarea name="address" rows={2} defaultValue={c.business.addressLines.join("\n")} className="admin-input" /></Field>
              <Field label="Opening hours" hint='One per row: "Mon – Thu | 12:00-22:00"' className="md:col-span-2">
                <textarea name="hours" rows={3} defaultValue={c.business.hours.map((h) => `${h.days} | ${h.open}-${h.close}`).join("\n")} className="admin-input" />
              </Field>
              <Field label="Social links" hint='One per row: "Instagram | https://…"' className="md:col-span-2">
                <textarea name="socials" rows={2} defaultValue={c.business.socials.map((s) => `${s.label} | ${s.url}`).join("\n")} className="admin-input" />
              </Field>
            </div>
          </Card>
          <Card title="Delivery, pricing & tax">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Delivery fee ($)"><input name="deliveryFee" defaultValue={d(c.delivery.feeCents)} className="admin-input" /></Field>
              <Field label="Free delivery over ($)"><input name="freeOver" defaultValue={d(c.delivery.freeOverCents)} className="admin-input" /></Field>
              <Field label="Minimum delivery order ($)"><input name="minOrder" defaultValue={d(c.delivery.minOrderCents)} className="admin-input" /></Field>
              <Field label="Tax rate (%)" hint="0 if prices already include tax"><input name="taxRate" defaultValue={(c.taxRate * 100).toString()} className="admin-input" /></Field>
              <Field label="Delivery time, min (minutes)"><input name="etaMin" defaultValue={c.delivery.etaMinutes[0]} className="admin-input" /></Field>
              <Field label="Delivery time, max (minutes)"><input name="etaMax" defaultValue={c.delivery.etaMinutes[1]} className="admin-input" /></Field>
            </div>
          </Card>
        </div>
      </ActionForm>
    </>
  );
}
