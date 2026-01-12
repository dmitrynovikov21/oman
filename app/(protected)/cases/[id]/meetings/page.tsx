"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";

// Types
interface Meeting {
    id: string;
    title: string;
    date: string;
    duration: string;
    participants: string[];
    status: "PENDING" | "TRANSCRIBED" | "REVIEWED";
    hasRecording: boolean;
}

interface TranscriptLine {
    id: string;
    speaker: string;
    speakerMasked: string;
    text: string;
    timestamp: string;
}

// Mock data
const mockMeetings: Meeting[] = [
    {
        id: "meet-1",
        title: "Initial Party Meeting",
        date: "2024-01-20",
        duration: "45 min",
        participants: ["Ahmed Al-Badawi", "Expert", "Legal Rep"],
        status: "TRANSCRIBED",
        hasRecording: true,
    },
    {
        id: "meet-2",
        title: "Document Review Session",
        date: "2024-01-25",
        duration: "30 min",
        participants: ["Gulf Construction Rep", "Expert"],
        status: "REVIEWED",
        hasRecording: true,
    },
    {
        id: "meet-3",
        title: "Follow-up Questions",
        date: "2024-02-01",
        duration: "20 min",
        participants: ["Ahmed Al-Badawi", "Expert"],
        status: "PENDING",
        hasRecording: false,
    },
];

const mockTranscript: TranscriptLine[] = [
    { id: "1", speaker: "Expert", speakerMasked: "[EXPERT]", text: "Good morning. Thank you for coming today. Can you please state your full name for the record?", timestamp: "00:00:12" },
    { id: "2", speaker: "Ahmed Al-Badawi", speakerMasked: "[PLAINTIFF]", text: "My name is Ahmed Salem Al-Badawi.", timestamp: "00:00:18" },
    { id: "3", speaker: "Expert", speakerMasked: "[EXPERT]", text: "And you were employed by Gulf Construction LLC, correct?", timestamp: "00:00:25" },
    { id: "4", speaker: "Ahmed Al-Badawi", speakerMasked: "[PLAINTIFF]", text: "Yes, I worked there for almost 6 years as a project manager.", timestamp: "00:00:32" },
    { id: "5", speaker: "Expert", speakerMasked: "[EXPERT]", text: "Can you describe the circumstances of your termination?", timestamp: "00:00:45" },
    { id: "6", speaker: "Ahmed Al-Badawi", speakerMasked: "[PLAINTIFF]", text: "I was called into HR on January 15th and told my position was being eliminated due to restructuring.", timestamp: "00:00:58" },
    { id: "7", speaker: "Expert", speakerMasked: "[EXPERT]", text: "Were you given any advance notice?", timestamp: "00:01:15" },
    { id: "8", speaker: "Ahmed Al-Badawi", speakerMasked: "[PLAINTIFF]", text: "No, it was immediate. They asked me to leave the same day.", timestamp: "00:01:22" },
];

function getStatusColor(status: Meeting["status"]) {
    switch (status) {
        case "TRANSCRIBED":
            return "bg-zinc-700 text-white";
        case "REVIEWED":
            return "bg-zinc-900 text-white";
        case "PENDING":
            return "bg-zinc-100 text-zinc-600";
    }
}

export default function MeetingsPage({ params }: { params: { id: string } }) {
    const [selectedMeeting, setSelectedMeeting] = useState<string | null>("meet-1");
    const [showMasked, setShowMasked] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const currentMeeting = mockMeetings.find(m => m.id === selectedMeeting);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/cases/${params.id}`} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2 inline-block">
                        ← Back to Case
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Meeting Intelligence</h1>
                    <p className="text-zinc-500 mt-1">Case 1409/2024 - Records & Transcripts</p>
                </div>
                <Button
                    onClick={() => setIsRecording(!isRecording)}
                    variant={isRecording ? "destructive" : "default"}
                >
                    {isRecording ? (
                        <>
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                            Stop Recording
                        </>
                    ) : (
                        <>
                            <Icons.add className="mr-2 size-4" />
                            New Recording
                        </>
                    )}
                </Button>
            </div>

            {/* Recording Banner - Monochrome */}
            {isRecording && (
                <div className="p-4 rounded-2xl bg-zinc-900 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            <div>
                                <p className="font-medium">Recording in progress...</p>
                                <p className="text-sm text-zinc-400">00:03:45 elapsed</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors">Pause</button>
                            <button className="px-3 py-1.5 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors" onClick={() => setIsRecording(false)}>
                                Stop & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Meeting List */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Meetings ({mockMeetings.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {mockMeetings.map((meeting) => (
                                <div
                                    key={meeting.id}
                                    onClick={() => setSelectedMeeting(meeting.id)}
                                    className={`p-3 rounded-xl cursor-pointer transition-all ${selectedMeeting === meeting.id
                                        ? "bg-zinc-100 border-2 border-zinc-900"
                                        : "bg-zinc-50 hover:bg-zinc-100 border-2 border-transparent"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-medium text-sm text-zinc-900">{meeting.title}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(meeting.status)}`}>
                                            {meeting.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                        <span>{meeting.date}</span>
                                        <span>•</span>
                                        <span>{meeting.duration}</span>
                                        {meeting.hasRecording && (
                                            <>
                                                <span>•</span>
                                                <Icons.fileText className="size-3" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="bg-white border border-zinc-100 rounded-3xl p-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Total Meetings</span>
                            <span className="font-medium text-zinc-900">{mockMeetings.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Transcribed</span>
                            <span className="font-medium text-zinc-900">{mockMeetings.filter(m => m.status !== "PENDING").length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Total Duration</span>
                            <span className="font-medium text-zinc-900">1h 35min</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Transcript Viewer */}
                <div className="lg:col-span-2">
                    {currentMeeting ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{currentMeeting.title}</CardTitle>
                                        <CardDescription>
                                            {currentMeeting.date} • {currentMeeting.duration} •
                                            {currentMeeting.participants.join(", ")}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Privacy Toggle */}
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                            <span className="text-xs text-muted-foreground">Privacy:</span>
                                            <Button
                                                variant={showMasked ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={() => setShowMasked(true)}
                                            >
                                                Masked
                                            </Button>
                                            <Button
                                                variant={!showMasked ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={() => setShowMasked(false)}
                                            >
                                                Original
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Audio Player */}
                                {currentMeeting.hasRecording && (
                                    <div className="mb-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                        <div className="flex items-center gap-4">
                                            <button className="rounded-full size-10 bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                                                <Icons.arrowRight className="size-4" />
                                            </button>
                                            <div className="flex-1">
                                                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                                                    <div className="h-full w-1/3 bg-zinc-900 rounded-full" />
                                                </div>
                                                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                                                    <span>00:15:23</span>
                                                    <span>45:00</span>
                                                </div>
                                            </div>
                                            <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                                                <Icons.settings className="size-4 text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Transcript */}
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {mockTranscript.map((line) => (
                                        <div key={line.id} className="flex gap-3">
                                            <span className="text-xs text-zinc-400 w-16 shrink-0 pt-1">
                                                {line.timestamp}
                                            </span>
                                            <div>
                                                <p className={`text-xs font-medium mb-1 ${line.speaker === "Expert" ? "text-zinc-900" : "text-zinc-500"
                                                    }`}>
                                                    {showMasked ? line.speakerMasked : line.speaker}
                                                </p>
                                                <p className="text-sm text-zinc-700">{line.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t mt-4">
                                    <Button variant="outline" size="sm">
                                        <Icons.fileText className="mr-2 size-4" />
                                        Export Transcript
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Icons.copy className="mr-2 size-4" />
                                        Generate Protocol
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center">
                            <Icons.messages className="size-12 mx-auto text-zinc-300 mb-4" />
                            <p className="text-zinc-500">Select a meeting to view transcript</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
