import Link from "next/link";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
    title: "Calendar – ExpertOS",
    description: "View deadlines and schedule.",
});

// Mock deadlines data
const deadlines = [
    { id: "1", caseNumber: "1409/2024", title: "Report Submission", date: "2024-02-15", daysLeft: 7, priority: "HIGH" },
    { id: "2", caseNumber: "1387/2024", title: "Court Appearance", date: "2024-02-10", daysLeft: 2, priority: "URGENT" },
    { id: "3", caseNumber: "1356/2024", title: "Document Review", date: "2024-02-20", daysLeft: 12, priority: "MEDIUM" },
    { id: "4", caseNumber: "1298/2024", title: "Final Report", date: "2024-02-25", daysLeft: 17, priority: "LOW" },
    { id: "5", caseNumber: "1409/2024", title: "Meeting with Parties", date: "2024-02-08", daysLeft: 0, priority: "URGENT" },
];

// Mock meetings
const upcomingMeetings = [
    { id: "m1", title: "Party Meeting", caseNumber: "1409/2024", time: "10:00 AM", date: "2024-02-08" },
    { id: "m2", title: "Document Review", caseNumber: "1387/2024", time: "2:00 PM", date: "2024-02-10" },
    { id: "m3", title: "Expert Consultation", caseNumber: "1356/2024", time: "11:30 AM", date: "2024-02-15" },
];

function getPriorityColor(priority: string) {
    switch (priority) {
        case "URGENT":
            return "bg-zinc-900 text-white border-zinc-800";
        case "HIGH":
            return "bg-zinc-200 text-zinc-800 border-zinc-300";
        case "MEDIUM":
            return "bg-zinc-100 text-zinc-600 border-zinc-200";
        case "LOW":
            return "bg-zinc-50 text-zinc-500 border-zinc-100";
        default:
            return "bg-zinc-100 text-zinc-600";
    }
}

// Simple Calendar Grid
function CalendarGrid() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentMonth = "February 2024";

    // Generate calendar days (simplified)
    type CalendarDay = { day: number; hasEvent: boolean; isToday: boolean; isUrgent: boolean };
    const calendarDays: CalendarDay[] = [];
    for (let i = 0; i < 35; i++) {
        const dayNum = i - 3; // Start from Thursday (Feb 1)
        if (dayNum >= 1 && dayNum <= 29) {
            calendarDays.push({
                day: dayNum,
                hasEvent: [8, 10, 15, 20, 25].includes(dayNum),
                isToday: dayNum === 8,
                isUrgent: [8, 10].includes(dayNum),
            });
        } else {
            calendarDays.push({ day: 0, hasEvent: false, isToday: false, isUrgent: false });
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{currentMonth}</CardTitle>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                            <Icons.chevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                            Today
                        </Button>
                        <Button variant="outline" size="sm">
                            <Icons.arrowRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {days.map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-zinc-400 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((d, i) => (
                        <div
                            key={i}
                            className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center relative ${d.day === 0
                                ? "text-zinc-300"
                                : d.isToday
                                    ? "bg-zinc-900 text-white font-bold"
                                    : d.hasEvent
                                        ? "bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                                        : "hover:bg-zinc-50 cursor-pointer"
                                }`}
                        >
                            <span className="text-sm">{d.day > 0 ? d.day : ""}</span>
                            {d.hasEvent && (
                                <span
                                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${d.isUrgent ? "bg-zinc-900" : "bg-zinc-400"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Deadlines List
function DeadlinesList() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Tasks requiring your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {deadlines.sort((a, b) => a.daysLeft - b.daysLeft).map((deadline) => (
                    <Link key={deadline.id} href={`/cases/case-${deadline.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50/80 transition-colors border-b border-zinc-50 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${deadline.daysLeft <= 2 ? "bg-zinc-200" : "bg-zinc-100"
                                    }`}>
                                    <Icons.timer className={`size-4 ${deadline.daysLeft <= 2 ? "text-zinc-900" : "text-zinc-400"
                                        }`} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{deadline.title}</p>
                                    <p className="text-xs text-zinc-500">
                                        Case {deadline.caseNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(deadline.priority)}`}>
                                    {deadline.daysLeft === 0 ? "TODAY" : `${deadline.daysLeft}d`}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}

// Meetings List
function MeetingsList() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Scheduled Meetings</CardTitle>
                    <Button variant="outline" size="sm">
                        <Icons.add className="size-4 mr-2" />
                        Schedule
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                    <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-zinc-100">
                                <Icons.messages className="size-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{meeting.title}</p>
                                <p className="text-xs text-zinc-500">
                                    Case {meeting.caseNumber}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-sm">{meeting.time}</p>
                            <p className="text-xs text-zinc-500">{meeting.date}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function CalendarPage() {
    return (
        <>
            <DashboardHeader
                heading="Calendar"
                text="Manage deadlines and schedule meetings"
            >
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Icons.arrowUpRight className="mr-2 size-4" />
                        Export
                    </Button>
                    <Button>
                        <Icons.add className="mr-2 size-4" />
                        Add Event
                    </Button>
                </div>
            </DashboardHeader>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Calendar */}
                <div className="lg:col-span-2">
                    <CalendarGrid />
                </div>

                {/* Right Column - Lists */}
                <div className="space-y-6">
                    <DeadlinesList />
                    <MeetingsList />
                </div>
            </div>
        </>
    );
}
