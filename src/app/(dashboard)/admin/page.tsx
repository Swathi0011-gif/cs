import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Check, Trash2, Shield, User, Clock, ShieldAlert, UserCheck, Inbox } from "lucide-react";
import { approveUser, deleteUser, toggleRole } from "@/lib/actions";

export default async function AdminPage() {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const pendingUsers = allUsers.filter(u => !u.approved);
    const approvedUsers = allUsers.filter(u => u.approved);

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <nav className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                        <ShieldAlert className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter">Command<span className="text-indigo-500">Center</span></h1>
                        <p className="text-slate-500 text-sm">System Administration & Access Control</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium hover:bg-slate-800 transition-all text-slate-300">
                        Back to Dashboard
                    </a>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto space-y-12">

                {/* SECTION: PENDING REQUESTS */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-bold">Login Requests</h2>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                            {pendingUsers.length}
                        </span>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 text-slate-500">
                            <Inbox className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg">No pending requests found</p>
                            <p className="text-sm opacity-60">New signups will appear here for approval.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingUsers.map((user) => (
                                <div key={user.id} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm group hover:border-indigo-500/50 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                <User className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{user.name}</p>
                                                <p className="text-sm text-slate-500 truncate max-w-[150px]">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <form action={async () => { "use server"; await approveUser(user.id); }} className="flex-1">
                                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all active:scale-95">
                                                <Check className="w-4 h-4" /> Approve
                                            </button>
                                        </form>
                                        <form action={async () => { "use server"; await deleteUser(user.id); }}>
                                            <button className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <hr className="border-slate-800" />

                {/* SECTION: REGISTERED USERS */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <UserCheck className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-xl font-bold">Active Members</h2>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900/20 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-[0.15em]">
                                        <th className="px-8 py-5 font-bold">Identity</th>
                                        <th className="px-8 py-5 font-bold">Status & Role</th>
                                        <th className="px-8 py-5 font-bold text-right">Administrative Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {approvedUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{user.name}</p>
                                                        <p className="text-xs text-slate-500 italic">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                        Verified
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === 'admin'
                                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <form action={async () => { "use server"; await toggleRole(user.id, user.role as any); }}>
                                                        <button title="Change Role" className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                    <form action={async () => { "use server"; await deleteUser(user.id); }}>
                                                        <button title="Revoke Access" className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
