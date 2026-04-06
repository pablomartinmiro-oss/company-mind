import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTenantForUser } from '@/lib/get-tenant';

const scoringCriteria = [
  { name: "Rapport Building", weight: 15, color: "bg-violet-500" },
  { name: "Needs Discovery", weight: 25, color: "bg-blue-500" },
  { name: "Active Listening", weight: 20, color: "bg-emerald-500" },
  { name: "Value Proposition", weight: 20, color: "bg-amber-500" },
  { name: "Next Steps", weight: 20, color: "bg-rose-500" },
];

export default async function SettingsPage() {
  const { tenantId } = await getTenantForUser();
  return (
    <div className="mx-auto max-w-3xl px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-1 text-[13px] text-zinc-400">
          Configure your Company Mind instance, scoring rubrics, and
          integrations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tenant Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Configuration</CardTitle>
            <CardDescription>
              Core details about your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tenant Name
              </label>
              <Input value="Company Mind" readOnly disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Industry
              </label>
              <Input value="SaaS" readOnly disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tenant ID
              </label>
              <p className="font-mono text-xs text-muted-foreground/70 select-all">
                {tenantId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Rubric */}
        <Card>
          <CardHeader>
            <CardTitle>Scoring Rubric</CardTitle>
            <CardDescription>
              Criteria and weights used to evaluate sales calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scoringCriteria.map((criterion, i) => (
              <div key={criterion.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1.5 tabular-nums">
                      {i + 1}.
                    </span>
                    {criterion.name}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {criterion.weight}%
                  </span>
                </div>
                {/* Weight bar */}
                <div className="h-2 w-full rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${criterion.color} transition-all`}
                    style={{ width: `${criterion.weight}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-3">
              <Button variant="outline" disabled className="text-zinc-400 cursor-not-allowed">
                Edit Rubric
                <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">Soon</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              External services connected to your instance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-100">
              <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                    <span className="text-[11px] font-bold text-orange-600">GHL</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Go High Level</p>
                    <p className="text-[11px] text-zinc-400">CRM &amp; pipeline sync</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <span className="text-[11px] font-bold text-blue-600">AI</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">AssemblyAI</p>
                    <p className="text-[11px] text-zinc-400">Call transcription &amp; analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-600">Connected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
