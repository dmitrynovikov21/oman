import { constructMetadata } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
    title: "Analytics – ExpertOS",
    description: "Case statistics and performance metrics.",
});

// Mock data
const stats = {
    totalCases: 156,
    activeCases: 12,
    completedThisMonth: 8,
    avgCompletionDays: 18,
    totalRevenue: 45600,
    pendingPayments: 3200,
};

const monthlyData: { month: string; cases: number; revenue: number }[] = [
    { month: "Jan", cases: 8, revenue: 4500 },
    { month: "Feb", cases: 12, revenue: 6200 },
    { month: "Mar", cases: 10, revenue: 5800 },
    { month: "Apr", cases: 15, revenue: 7200 },
    { month: "May", cases: 11, revenue: 5400 },
    { month: "Jun", cases: 14, revenue: 6800 },
];

const casesByType = [
    { type: "Labor Disputes", count: 89, percentage: 57 },
    { type: "Salary Claims", count: 42, percentage: 27 },
    { type: "Unfair Dismissal", count: 18, percentage: 12 },
    { type: "Other", count: 7, percentage: 4 },
];

const recentPayments = [
    { id: "1", case: "1409/2024", amount: 500, date: "2024-01-20", status: "RECEIVED" },
    { id: "2", case: "1387/2024", amount: 300, date: "2024-01-18", status: "RECEIVED" },
    { id: "3", case: "1356/2024", amount: 450, date: "2024-01-15", status: "PENDING" },
    { id: "4", case: "1298/2024", amount: 600, date: "2024-01-12", status: "RECEIVED" },
];

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: string; positive: boolean };
}) {
    return (
        <div className="bg-white border border-zinc-100 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-500">{title}</span>
                <Icon className="size-4 text-zinc-400" />
            </div>
            <p className="text-3xl font-light text-zinc-900 tracking-tight">{value}</p>
            <p className="text-sm text-zinc-500 mt-2">
                {description}
                {trend && (
                    <span className="ml-2 bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 text-xs">
                        {trend.positive ? "↑" : "↓"} {trend.value}
                    </span>
                )}
            </p>
        </div>
    );
}

function BarChart({ data }: { data: typeof monthlyData }) {
    const maxValue = Math.max(...data.map((d) => d.cases));

    return (
        <div className="flex items-end gap-3 h-48">
            {data.map((item, index) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <div
                        className="w-full bg-zinc-900 rounded-t-lg transition-all hover:bg-zinc-700"
                        style={{ height: `${(item.cases / maxValue) * 100}%`, minHeight: "8px" }}
                    />
                    <span className="text-xs text-zinc-500">{item.month}</span>
                </div>
            ))}
        </div>
    );
}

function TypeDistribution({ data }: { data: typeof casesByType }) {
    const shades = ['bg-zinc-900', 'bg-zinc-600', 'bg-zinc-400', 'bg-zinc-300'];

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div key={item.type}>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-700">{item.type}</span>
                        <span className="font-medium text-zinc-900">{item.count}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${shades[index] || 'bg-zinc-400'} rounded-full transition-all`}
                            style={{ width: `${item.percentage}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <>
            <DashboardHeader
                heading="Analytics"
                text="Track your performance and case statistics"
            />

            {/* Monochrome Hero KPIs */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                {/* Revenue MTD */}
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-zinc-100 rounded-2xl">
                            <Icons.billing className="size-6 text-zinc-600" />
                        </div>
                        <span className="text-sm text-zinc-500">Revenue MTD</span>
                    </div>
                    <p className="text-4xl font-light text-zinc-900 tracking-tight">
                        {stats.totalRevenue.toLocaleString()}
                        <span className="text-lg font-normal text-zinc-400 ml-1">OMR</span>
                    </p>
                    <span className="inline-block mt-3 bg-zinc-100 text-zinc-600 rounded-full px-2.5 py-1 text-xs">
                        ↑ 12% vs last month
                    </span>
                </div>

                {/* Avg Turnaround */}
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-zinc-100 rounded-2xl">
                            <Icons.timer className="size-6 text-zinc-600" />
                        </div>
                        <span className="text-sm text-zinc-500">Avg Turnaround</span>
                    </div>
                    <p className="text-4xl font-light text-zinc-900 tracking-tight">
                        {stats.avgCompletionDays}
                        <span className="text-lg font-normal text-zinc-400 ml-1">days</span>
                    </p>
                    <span className="inline-block mt-3 bg-zinc-100 text-zinc-600 rounded-full px-2.5 py-1 text-xs">
                        2 days faster than avg
                    </span>
                </div>

                {/* Active Cases */}
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-zinc-100 rounded-2xl">
                            <Icons.fileText className="size-6 text-zinc-600" />
                        </div>
                        <span className="text-sm text-zinc-500">Open Cases</span>
                    </div>
                    <p className="text-4xl font-light text-zinc-900 tracking-tight">
                        {stats.activeCases}
                        <span className="text-lg font-normal text-zinc-400 ml-1">active</span>
                    </p>
                    <p className="text-sm text-zinc-500 mt-3">
                        of {stats.totalCases} total cases
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard
                    title="Total Cases"
                    value={stats.totalCases.toString()}
                    description="All time"
                    icon={Icons.fileText}
                    trend={{ value: "12%", positive: true }}
                />
                <StatCard
                    title="Active Cases"
                    value={stats.activeCases.toString()}
                    description="In progress"
                    icon={Icons.timer}
                />
                <StatCard
                    title="Completed"
                    value={stats.completedThisMonth.toString()}
                    description="This month"
                    icon={Icons.check}
                    trend={{ value: "8%", positive: true }}
                />
                <StatCard
                    title="Avg. Completion"
                    value={`${stats.avgCompletionDays} days`}
                    description="Per case"
                    icon={Icons.lineChart}
                    trend={{ value: "2 days", positive: true }}
                />
            </div>

            {/* Revenue Stats - Monochrome */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">Total Revenue</p>
                            <p className="text-3xl font-light text-zinc-900 tracking-tight">{stats.totalRevenue.toLocaleString()} OMR</p>
                            <p className="text-xs text-zinc-400 mt-1">Year to date</p>
                        </div>
                        <div className="p-4 bg-zinc-100 rounded-full">
                            <Icons.billing className="size-8 text-zinc-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">Pending Payments</p>
                            <p className="text-3xl font-light text-zinc-900 tracking-tight">{stats.pendingPayments.toLocaleString()} OMR</p>
                            <p className="text-xs text-zinc-400 mt-1">4 invoices outstanding</p>
                        </div>
                        <div className="p-4 bg-zinc-100 rounded-full">
                            <Icons.timer className="size-8 text-zinc-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cases by Month</CardTitle>
                        <CardDescription>Number of cases completed each month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChart data={monthlyData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cases by Type</CardTitle>
                        <CardDescription>Distribution of case categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TypeDistribution data={casesByType} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payments - Monochrome */}
            <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">Recent Payments</h3>
                <div className="space-y-3">
                    {recentPayments.map((payment) => (
                        <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-zinc-100">
                                    <Icons.billing className="size-4 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-zinc-900">Case {payment.case}</p>
                                    <p className="text-xs text-zinc-400">{payment.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-zinc-900">{payment.amount} OMR</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === "RECEIVED"
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-600"
                                    }`}>
                                    {payment.status === "RECEIVED" ? "Received" : "Pending"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
