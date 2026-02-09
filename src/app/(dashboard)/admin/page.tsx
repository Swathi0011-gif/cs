import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, not } from "drizzle-orm";
import { Check, Trash2, Shield, User, Clock } from "lucide-react";
import { approveUser, deleteUser } from "@/lib/actions";

export default async function AdminPage() {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    const allUsers = await db.select().from(users).orderBy(users.createdAt);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <nav className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-indigo-500" />
                    <h1 className="text-2xl font-bold tracking-tighter">ADMIN<span className="text-indigo-500">PANEL</span></h1>
                </div>
                <a href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                    Back to Dashboard
                </a>
            </nav>

            <div className="max-w-6xl mx-auto">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/20 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="px-8 py-6 font-semibold">User</th>
                                <th className="px-8 py-6 font-semibold">Joined</th>
                                <th className="px-8 py-6 font-semibold">Status</th>
                                <th className="px-8 py-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {allUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-900/40 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                                <User className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.name}</p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-slate-400 text-sm">
                                        {user.createdAt.toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        {user.approved ? (
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                Approved
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center gap-1 w-fit">
                                                <Clock className="w-3 h-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!user.approved && (
                                                <form action={async () => {
                                                    "use server";
                                                    await approveUser(user.id);
                                                }}>
                                                    <button className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all">
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                </form>
                                            )}
                                            <form action={async () => {
                                                "use server";
                                                await deleteUser(user.id);
                                            }}>
                                                <button className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {allUsers.length === 0 && (
                        <div className="p-20 text-center text-slate-500">
                            No users found in the system.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
