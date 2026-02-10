"use client";

import { useState } from "react";
import { Youtube, Search, ArrowRight, Loader2, Sparkles, BookOpen, FileText, Share2, Copy, CheckCircle2 } from "lucide-react";
import { processYouTubeVideo, type AIResponse } from "@/lib/ai-actions";
import { motion, AnimatePresence } from "framer-motion";

export default function YoutubeAITool() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AIResponse | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        setResult(null);

        const response = await processYouTubeVideo(url);
        setResult(response);
        setIsLoading(false);
    };

    const copyToClipboard = () => {
        if (!result) return;
        const text = `Summary:\n${result.summary}\n\nStudy Notes:\n${result.studyNotes}`;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Input Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
                    <form onSubmit={handleProcess} className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Paste YouTube video link here..."
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
                                        Generate Notes
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Error Message */}
            {result?.error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {result.error}
                </div>
            )}

            {/* Results Section */}
            <AnimatePresence>
                {result && !result.error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                    >
                        {/* Summary Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800 flex flex-col h-full bg-gradient-to-b from-slate-900/40 to-black/20">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                            <FileText className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <h3 className="font-bold text-xl">Executive Summary</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${result.isFallback ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                        {result.isFallback ? 'Metadata Based' : 'Full Transcript'}
                                    </span>
                                </div>
                                <div className="flex-1 text-slate-400 leading-relaxed text-lg">
                                    {result.isFallback && (
                                        <div className="mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-500 text-xs italic">
                                            Transcript is disabled for this video. Summary generated from title and author metadata.
                                        </div>
                                    )}
                                    {result.summary}
                                </div>
                            </div>
                        </div>

                        {/* Study Notes Column */}
                        <div className="lg:col-span-3 space-y-8">
                            <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800 relative group">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                            <BookOpen className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h3 className="font-bold text-xl">Study Notes</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
                                        >
                                            {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {isCopied ? "Copied" : "Copy"}
                                        </button>
                                        <button className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-black/30 p-6 rounded-2xl border border-slate-800/50">
                                    {result.studyNotes}
                                </div>

                                <div className="mt-8 flex items-center gap-2 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs text-slate-500 font-medium">Study notes generated with Gemini AI Engine</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!result && !isLoading && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                        <Sparkles className="w-10 h-10 text-indigo-500/20" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-300">Bring your learning to life</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Paste a link to any educational video on YouTube and we'll transform it into high-quality study notes and a concise summary.
                    </p>
                </div>
            )}
        </div>
    );
}
