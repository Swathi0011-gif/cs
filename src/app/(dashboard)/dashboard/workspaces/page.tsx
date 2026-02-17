
import { auth } from "@/lib/auth";
import { getWorkspaces, createWorkspace } from "@/lib/rag-actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder } from "lucide-react";

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
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Your Workspaces
                    </h1>
                    <p className="text-gray-400 mt-2">Manage your document collections and chats</p>
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
                    <a
                        key={ws.id}
                        href={`/dashboard/workspaces/${ws.id}`}
                        className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Folder className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-gray-500">{new Date(ws.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{ws.name}</h3>
                        <p className="text-gray-400 text-sm">Click to view documents and chat</p>
                    </a>
                ))}

                {workspaces.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
                        <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No workspaces found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
