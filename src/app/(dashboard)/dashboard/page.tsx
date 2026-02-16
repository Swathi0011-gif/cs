import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogOut, User, Shield, Activity, Users, Sparkles, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Navbar */}
            <nav className="flex items-center justify-between mb-12">
                <h1 className="text-2xl font-bold tracking-tighter">PREMIUM<span className="text-indigo-500">DASH</span></h1>
                <div className="flex items-center gap-6">
                    {session.user.role === "admin" && (
                        <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                    )}
                    <form action={async () => {
                        "use server";
                        await signOut();
                    }}>
                        <button className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </form>
                </div>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="col-span-1 p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{session.user.name}</h2>
                            <p className="text-slate-400 text-sm">{session.user.email}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-slate-800">
                            <span className="text-slate-400 text-sm">Role</span>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                                {session.user.role}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-slate-800">
                            <span className="text-slate-400 text-sm">Status</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                                Approved
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Column */}
                <div className="col-span-1 md:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
                            <Activity className="w-8 h-8 text-cyan-400 mb-4" />
                            <h3 className="text-slate-400 text-sm font-medium mb-1">System Status</h3>
                            <p className="text-3xl font-bold tracking-tight">Optimal</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
                            <Users className="w-8 h-8 text-indigo-400 mb-4" />
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Users</h3>
                            <p className="text-3xl font-bold tracking-tight">Active</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:flex flex-col gap-8">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 backdrop-blur-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                AI Study Tool
                            </h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Transform any YouTube video into clear summary and structured study notes instantly.
                            </p>
                            <Link href="/youtube-ai" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-slate-200 transition-colors">
                                Open Tool <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 to-slate-900/40 border border-purple-500/20 backdrop-blur-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" />
                                AI Document Assistant
                            </h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Upload PDFs or Text files and ask complex questions. Our AI will analyze the content and give you precise answers.
                            </p>
                            <Link href="/dashboard/documents" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-slate-200 transition-colors">
                                Open Tool <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
                            <h3 className="text-xl font-bold mb-4">Your Workspace</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Manage your projects and monitor real-time data in a secure, high-performance environment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
