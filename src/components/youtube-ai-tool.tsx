"use client";

import { useState } from "react";
import { Youtube, Search, ArrowRight, Loader2, Sparkles, BookOpen, FileText, Share2, Copy, CheckCircle2, History, Clock, FilePlus, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProcessResult {
    success: boolean;
    content: string;
    title: string;
    videoId: string;
}

export default function YoutubeAITool() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch("/api/process-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process video");
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const reset = () => {
        setResult(null);
        setUrl("");
        setError(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Input Section */}
            {!result && (
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
                        <form onSubmit={handleProcess} className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Paste YouTube Video URL..."
                                        className="w-full pl-14 pr-6 py-5 bg-black/40 border border-slate-800 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !url}
                                    className="w-full md:w-auto px-10 py-5 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-3 shadow-xl shadow-white/5"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            Generate AI Notes
                                            <Sparkles className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                            {isLoading && (
                                <p className="text-center text-indigo-400 text-sm font-medium animate-pulse">
                                    AI is analyzing your video and generating high-quality study notes...
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {error}
                </div>
            )}

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Header Info */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-12 rounded-xl bg-black/40 flex items-center justify-center border border-slate-800 overflow-hidden">
                                    <img src={`https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-60" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-200 line-clamp-1">{result.title}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Automated Analysis Completed</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 md:flex-none px-6 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"
                                >
                                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    {isCopied ? "Copied" : "Copy Notes"}
                                </button>
                                <button
                                    onClick={reset}
                                    className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 border border-slate-700"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 backdrop-blur-xl relative overflow-hidden">
                            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-lg relative z-10">
                                {result.content}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!result && !isLoading && !error && (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-1000">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full"></div>
                        <div className="relative w-24 h-24 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <Sparkles className="w-12 h-12 text-indigo-500/30" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-200 tracking-tight">AI Note Generator</h2>
                        <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed">
                            Zero manual steps. Paste a link and wait for your structured study kit.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
