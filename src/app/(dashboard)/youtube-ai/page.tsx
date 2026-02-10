"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import YoutubeAITool from "@/components/youtube-ai-tool";
import { Youtube, Sparkles, Layout, Shield } from "lucide-react";
import Link from "next/link";

export default async function YoutubeAIPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8 font-sans selection:bg-indigo-500/30">
            {/* Top Navigation */}
            <nav className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
                        <Layout className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                            STUDY<span className="text-indigo-400">AI</span>
                            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        </h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">YouTube Video Summarizer</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-6">
                    {session.user.role === "admin" && (
                        <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                    )}
                    <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Youtube className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">Toolbox</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto">
                <YoutubeAITool />
            </main>
        </div>
    );
}
