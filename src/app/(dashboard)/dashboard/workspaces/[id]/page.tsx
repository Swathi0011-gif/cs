
"use client";

import { useState, useRef, useEffect } from "react";
import { uploadDocument, getWorkspaceDocuments, queryWorkspace } from "@/lib/rag-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Send, Loader2, Bot, User, Paperclip } from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Types for messages and documents
type Message = {
    role: "user" | "assistant";
    content: string;
    sources?: string[];
};

type Doc = {
    id: string;
    name: string;
    createdAt: Date;
};

export default function WorkspaceDetailPage() {
    const params = useParams();
    const workspaceId = params.id as string;

    // State
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial data load
    useEffect(() => {
        loadDocuments();
    }, [workspaceId]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isThinking]);

    const loadDocuments = async () => {
        const docs = await getWorkspaceDocuments(workspaceId);
        setDocuments(docs);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        const files = Array.from(e.target.files);

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("workspaceId", workspaceId);

            await uploadDocument(formData);
        }

        await loadDocuments();
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsThinking(true);

        const result = await queryWorkspace(workspaceId, userMsg);

        setIsThinking(false);
        if (result.error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Error: " + result.error }]);
        } else {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: result.answer || "No answer generated.",
                sources: result.sources
            }]);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
            {/* Sidebar - Documents */}
            <div className="col-span-3 bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col h-full backdrop-blur-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Documents</h2>
                    <p className="text-xs text-gray-400">Files in this workspace</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                    {documents.map((doc) => (
                        <div key={doc.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors group">
                            <div className="p-2 rounded bg-blue-500/20 text-blue-400">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm text-gray-200 truncate">{doc.name}</p>
                                <p className="text-[10px] text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}

                    {documents.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No documents yet</p>
                        </div>
                    )}
                </div>

                <div>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        accept=".pdf,.txt"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Files"}
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="col-span-9 bg-white/5 rounded-2xl border border-white/10 flex flex-col h-full backdrop-blur-sm overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-400" />
                        Workspace Assistant
                    </h2>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {messages.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">How can I help you?</h3>
                                <p className="text-gray-400">Ask questions about your uploaded documents.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex gap-4",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    msg.role === "user" ? "bg-blue-600" : "bg-purple-600"
                                )}>
                                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                                </div>

                                <div className={cn(
                                    "rounded-2xl p-4 max-w-[80%]",
                                    msg.role === "user" ? "bg-blue-600/20 text-blue-50" : "bg-white/10 text-gray-100"
                                )}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-xs font-semibold text-gray-400 mb-2">Sources:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map((source, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                                        {source}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="rounded-2xl p-4 bg-white/10 text-gray-100 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    <span className="text-sm text-gray-400">Analyzing documents...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="max-w-4xl mx-auto relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Ask a question about your documents..."
                            className="pr-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 py-6 text-base rounded-xl focus-visible:ring-purple-500/50"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isThinking}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-center text-[10px] text-gray-600 mt-2">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
