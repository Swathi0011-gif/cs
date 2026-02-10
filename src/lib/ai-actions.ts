"use server";

import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export interface AIResponse {
    summary: string;
    studyNotes: string;
    isFallback?: boolean;
    error?: string;
}

function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

async function getVideoMetadata(url: string) {
    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

export async function processYouTubeVideo(url: string): Promise<AIResponse> {
    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            return { summary: "", studyNotes: "", error: "Google AI API Key is missing." };
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return { summary: "", studyNotes: "", error: "Invalid YouTube URL." };
        }

        let contentToProcess = "";
        let isFallback = false;

        // 1. Attempt to Fetch Transcript
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
            contentToProcess = transcriptItems.map(item => item.text).join(" ");
        } catch (e) {
            console.warn("Transcript failed, falling back to metadata:", e);
            isFallback = true;
        }

        // 2. Fallback to Metadata if transcript is missing or too short
        if (contentToProcess.length < 100) {
            isFallback = true;
            const metadata = await getVideoMetadata(url);
            if (metadata) {
                contentToProcess = `Title: ${metadata.title}\nAuthor: ${metadata.author_name}\n(Transcript disabled for this video)`;
            } else {
                return { summary: "", studyNotes: "", error: "Transcript is disabled and metadata could not be retrieved." };
            }
        }

        // 3. Initialize Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = isFallback
            ? `I have a YouTube video where transcripts are disabled. Here is the metadata:
               ${contentToProcess}
               Based on the title and author, provide a high-level educational context and 3-5 key study topics the user should research related to this video. Mark this clearly as a high-level summary.`
            : `You are an expert tutor. Based on this video transcript, generate:
               1. A concise summary (150 words).
               2. Structured study notes in markdown.
               
               Transcript: ${contentToProcess.substring(0, 30000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. Parse Response
        const sections = text.split(/2\.|Structured study notes/i);
        const summary = isFallback ? text : sections[0].replace(/1\.|Summary/i, "").trim();
        const studyNotes = isFallback ? "Notes are based on video metadata (Title/Topic) as full transcript was unavailable." : (sections[1] ? sections[1].trim() : text);

        return { summary, studyNotes, isFallback };

    } catch (error: any) {
        console.error("AI Processing Error:", error);
        return {
            summary: "",
            studyNotes: "",
            error: "An unexpected error occurred. This often happens if the video is age-restricted or private."
        };
    }
}
