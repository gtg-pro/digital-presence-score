import { SiteLogo } from "@/components/shared/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { adminSettingsDemo } from "@/features/admin/data/admin.mock";

export function SettingsPage() {
  const settings = adminSettingsDemo;

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Frontend placeholders only. Changes are not saved and authentication
          is not implemented.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">General</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Application name" value={settings.applicationName} />
          <Field label="Branding" value={settings.brandingNote} />
        </div>
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-background px-4">
          <SiteLogo width={180} className="max-w-[14rem]" />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">
          Report configuration
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA text" value={settings.reportCtaText} />
          <Field label="Booking destination" value={settings.bookingDestination} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Scoring</h3>
        <Field label="Methodology version" value={settings.scoringVersion} />
        <ul className="space-y-2 text-sm">
          {settings.categoryWeights.map((item) => (
            <li
              key={item.category}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span>{item.category}</span>
              <span className="font-mono text-muted-foreground">{item.max} pts</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Category weights are read-only in this demo UI.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Email</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sender name" value={settings.senderName} />
          <Field label="Sender email" value={settings.senderEmail} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Administrator</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={settings.adminProfile.name} />
          <Field label="Role" value={settings.adminProfile.role} />
          <Field label="Email" value={settings.adminProfile.email} />
        </div>
        <Button type="button" disabled>
          Save settings
        </Button>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} defaultValue={value} readOnly aria-readonly="true" />
    </div>
  );
}
