"use client";

import { useState } from "react";
import { signUp } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function SignUpPage() {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData(e.currentTarget);
        const result = await signUp(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(result.success || "Account created!");
            setTimeout(() => router.push("/login"), 3000);
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            {/* Left Side: Dynamic Accent */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-black to-slate-900">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100"></div>
                <div className="relative z-10 flex flex-col justify-center px-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl font-bold tracking-tighter leading-none"
                    >
                        Elevate your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            experience.
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-6 text-xl text-slate-400 max-w-md"
                    >
                        Join a community built on security, speed, and premium design.
                    </motion.p>
                </div>

                {/* Abstract Shapes */}
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="mt-2 text-slate-400">Enter your details to get started.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Full Name"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Password"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm"
                            >
                                {success}
                            </motion.div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <span className="relative z-10">Sign up</span>
                                    <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
