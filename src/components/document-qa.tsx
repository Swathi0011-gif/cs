"use client";

import { useState, useRef, useEffect } from "react";
import { uploadDocument, getDocuments, deleteDocument, queryDocument } from "@/lib/rag-actions";
import { Loader2, Upload, MessageSquare, Trash2, FileText, Send, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DocumentQA() {
    const [docs, setDocs] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchDocs = async () => {
        setIsLoadingDocs(true);
        const fetchedDocs = await getDocuments();
        setDocs(fetchedDocs);
        setIsLoadingDocs(false);
        if (fetchedDocs.length > 0 && !selectedDoc) {
            setSelectedDoc(fetchedDocs[0]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadDocument(formData);
        if (result.success) {
            await fetchDocs();
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            alert(result.error);
        }
        setIsUploading(false);
    };

    const handleDelete = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this document?")) return;

        const result = await deleteDocument(docId);
        if (result.success) {
            await fetchDocs();
            if (selectedDoc?.id === docId) {
                setSelectedDoc(null);
                setMessages([]);
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedDoc || isSending) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsSending(true);

        const result = await queryDocument(selectedDoc.id, userMsg);
        if (result.answer) {
            setMessages(prev => [...prev, { role: "assistant", content: result.answer }]);
        } else {
            setMessages(prev => [...prev, { role: "assistant", content: "Error: " + (result.error || "Something went wrong") }]);
        }
        setIsSending(false);
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 p-4">
            {/* Sidebar: Documents */}
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Documents
                    </h2>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload PDF or Text
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.txt"
                        className="hidden"
                    />

                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoadingDocs ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                            </div>
                        ) : docs.length === 0 ? (
                            <p className="text-gray-400 text-center py-4 text-sm">No documents uploaded yet.</p>
                        ) : (
                            docs.map((doc) => (
                                <div
                                    key={doc.id}
                                    onClick={() => {
                                        setSelectedDoc(doc);
                                        setMessages([]);
                                    }}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedDoc?.id === doc.id
                                            ? "bg-purple-500/20 border-purple-500/50 text-white"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <FileText className={`w-4 h-4 ${selectedDoc?.id === doc.id ? "text-purple-400" : "text-gray-500"}`} />
                                        <span className="text-sm truncate font-medium">{doc.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(doc.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                {selectedDoc ? (
                    <>
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{selectedDoc.name}</h3>
                                    <p className="text-xs text-gray-400">Ask anything about this document</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-black/20">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-50">
                                    <div className="p-4 bg-white/5 rounded-full">
                                        <MessageSquare className="w-12 h-12 text-purple-400" />
                                    </div>
                                    <h2 className="text-xl font-medium text-white">Start a Conversation</h2>
                                    <p className="text-gray-400 max-w-xs">Ask questions about the document and I'll find the answers for you.</p>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${msg.role === "user"
                                            ? "bg-purple-600 text-white rounded-tr-none"
                                            : "bg-white/10 border border-white/10 text-gray-100 rounded-tl-none"
                                        }`}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {isSending && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></span>
                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your question..."
                                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none text-white p-4 pr-14 rounded-2xl transition-all placeholder:text-gray-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isSending}
                                    className="absolute right-2 p-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-all shadow-lg"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
                        <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center border border-purple-500/20">
                            <FileText className="w-10 h-10 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">No Document Selected</h2>
                            <p className="text-gray-400 max-w-sm">Select a document from the sidebar or upload a new one to start asking questions.</p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
