import { Suspense } from "react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
  title: "Dashboard – ExpertOS",
  description: "Manage your cases and documents.",
});

// KPI Card Component
function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {title}
        </CardTitle>
        <Icon className="size-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-light text-zinc-900 tracking-tight">{value}</div>
        <p className="text-sm text-zinc-500 mt-1">
          {description}
          {trend && <span className="ml-2 bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 text-xs">{trend}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

// Upload Zone - Client Component imported
import { FileUploadZone } from "@/components/dashboard/file-upload-zone";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardStatsGrid } from "@/components/dashboard/stats-grid";

// Recent Cases Table
function RecentCases() {
  const cases = [
    { id: "1", number: "1409/2024", court: "Primary Labor Court", status: "Active", deadline: "2024-02-15" },
    { id: "2", number: "1387/2024", court: "Seeb Court", status: "Review", deadline: "2024-02-10" },
    { id: "3", number: "1356/2024", court: "Muscat Primary", status: "Draft", deadline: "2024-02-20" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Your active and pending cases</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50/80 transition-colors border-b border-zinc-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-zinc-100 p-2">
                  <Icons.fileText className="size-4 text-zinc-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{c.number}</p>
                  <p className="text-sm text-zinc-500">{c.court}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-zinc-900 text-white' :
                    c.status === 'Review' ? 'bg-zinc-200 text-zinc-700' :
                      'bg-zinc-100 text-zinc-600'
                  }`}>
                  {c.status}
                </span>
                <span className="text-sm text-zinc-400">
                  Due: {c.deadline}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Deadline Feed
function DeadlineFeed() {
  const deadlines = [
    { case: "1409/2024", action: "Submit Final Report", days: 3, urgent: true },
    { case: "1387/2024", action: "Meeting Scheduled", days: 5, urgent: false },
    { case: "1356/2024", action: "Document Review", days: 7, urgent: false },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.timer className="size-4 text-zinc-400" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl ${d.urgent ? 'bg-zinc-100 border border-zinc-200' : 'hover:bg-zinc-50/80 border-b border-zinc-50 last:border-0'
                }`}
            >
              <div>
                <p className="font-medium text-sm text-zinc-900">{d.action}</p>
                <p className="text-xs text-zinc-400">Case: {d.case}</p>
              </div>
              <span className={`text-sm font-medium ${d.urgent ? 'text-zinc-900' : 'text-zinc-500'
                }`}>
                {d.days} days
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome back, ${user?.name || 'Expert'}!`}
      />

      {/* Dynamic KPI Grid */}
      <DashboardStatsGrid />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Cases & Upload */}
        <div className="lg:col-span-2 space-y-6">
          <FileUploadZone />
          <Suspense fallback={<div>Loading cases...</div>}>
            <RecentCases />
          </Suspense>
        </div>

        {/* Right Column - Deadlines & Activity */}
        <div className="space-y-6">
          <DeadlineFeed />
          <Card>
            <CardContent className="pt-6">
              <ActivityFeed />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
