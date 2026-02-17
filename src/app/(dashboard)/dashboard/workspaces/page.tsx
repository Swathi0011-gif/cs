
import { auth } from "@/lib/auth";
import { getWorkspaces, createWorkspace } from "@/lib/rag-actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function WorkspacesPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth");

    const workspaces = await getWorkspaces();

    async function handleCreate(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        if (name) {
            await createWorkspace(name);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Back Navigation */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            Your Workspaces
                        </h1>
                        <p className="text-slate-400 mt-2">Create workspaces and upload multiple documents to ask questions across your entire collection</p>
                    </div>

                    <form action={handleCreate} className="flex gap-2">
                        <Input
                            name="name"
                            placeholder="New Workspace Name..."
                            className="w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            required
                        />
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create
                        </Button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((ws) => (
                        <Link
                            key={ws.id}
                            href={`/dashboard/workspaces/${ws.id}`}
                            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-sm"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <Folder className="w-6 h-6" />
                                </div>
                                <span className="text-xs text-slate-500">{new Date(ws.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">{ws.name}</h3>
                            <p className="text-slate-400 text-sm">Click to view documents and chat</p>
                        </Link>
                    ))}

                    {workspaces.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                            <Folder className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No workspaces yet</p>
                            <p className="text-sm text-slate-600">Create your first workspace to get started with multi-document AI chat</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
