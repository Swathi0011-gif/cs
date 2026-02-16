import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { YoutubeTranscript } from "youtube-transcript-plus";
import ytdl from "@distube/ytdl-core";
import fs from "fs-extra";
import path from "path";
import os from "os";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY || "");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export const maxDuration = 60;

function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

async function getVideoMetadata(videoId: string) {
    if (!YOUTUBE_API_KEY) return null;
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet`;
        const res = await fetch(url);
        const data = await res.json();
        return data.items?.[0]?.snippet ? {
            title: data.items[0].snippet.title,
            channelTitle: data.items[0].snippet.channelTitle,
        } : null;
    } catch (e) {
        console.error("Metadata fetch error:", e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    let tempFilePath = "";
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });

        const videoId = extractVideoId(url);
        if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL." }, { status: 400 });

        const metadata = await getVideoMetadata(videoId);
        const videoTitle = metadata?.title || "Unknown Video";

        // Try to fetch text transcript first (Faster/Cheaper)
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
            const transcript = transcriptItems.map(item => item.text).join(" ");

            if (transcript && transcript.length > 100) {
                console.log("Using text transcript path...");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `Analyze this transcript from "${videoTitle}" and generate structured study notes. 
                Include: Summary, Key Concepts, Definitions, Takeaways, and 5 Practice Questions with answers.
                Transcript: ${transcript.substring(0, 50000)}`;
                const result = await model.generateContent(prompt);
                return NextResponse.json({ success: true, content: result.response.text(), title: videoTitle, videoId });
            }
        } catch (e) {
            console.log("Text transcript failed, falling back to audio analysis...");
        }

        // Fallback: Audio Analysis via Gemini Multimodal
        tempFilePath = path.join(os.tmpdir(), `${videoId}.mp3`);

        await new Promise((resolve, reject) => {
            const stream = ytdl(url, { filter: "audioonly", quality: "lowestaudio" })
                .pipe(fs.createWriteStream(tempFilePath));
            stream.on("finish", () => resolve(true));
            stream.on("error", reject);
        });

        // Upload to Gemini
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "audio/mpeg",
            displayName: videoTitle,
        });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            },
            {
                text: `Analyze the audio of this video titled "${videoTitle}" and generate highly structured study notes.
            STRUCTURE:
            - Clean Title
            - Short Summary
            - Key Concepts
            - Important Definitions
            - Key Takeaways
            - 5 Practice Questions (with answers below)
            ` }
        ]);

        return NextResponse.json({
            success: true,
            content: result.response.text(),
            title: videoTitle,
            videoId
        });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({ error: error.message || "Automation failed. Please check the video URL." }, { status: 500 });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            await fs.remove(tempFilePath).catch(console.error);
        }
    }
}
