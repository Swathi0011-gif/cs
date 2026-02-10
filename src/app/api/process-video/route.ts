import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript-plus";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        if (data.items && data.items.length > 0) {
            return {
                title: data.items[0].snippet.title,
                channelTitle: data.items[0].snippet.channelTitle,
            };
        }
    } catch (e) {
        console.error("Metadata fetch error:", e);
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL." }, { status: 400 });
        }

        // 1. Fetch Metadata (Official API)
        const metadata = await getVideoMetadata(videoId);
        const videoTitle = metadata?.title || "Unknown Video";

        // 2. Fetch Transcript (Automated)
        let transcript = "";
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
            transcript = transcriptItems.map(item => item.text).join(" ");
        } catch (e: any) {
            console.error("Transcript fetch failed:", e);
            return NextResponse.json({
                error: "Could not fetch transcript for this video. Captions might be disabled or blocked."
            }, { status: 500 });
        }

        if (!transcript || transcript.length < 50) {
            return NextResponse.json({ error: "Transcript is too short or empty." }, { status: 400 });
        }

        // 3. Generate Structured Notes with GPT
        const prompt = `
            You are an expert academic tutor. Analyze the following transcript from a video titled "${videoTitle}" and generate highly structured study notes.
            
            STRUCTURE:
            - Clean Title (Catchy and relevant)
            - Short Summary (MAX 2 paragraphs)
            - Key Concepts (Bullet points with brief explanations)
            - Important Definitions (Bold terms and their meanings)
            - Key Takeaways (Numbered list of main conclusions)
            - 5 Practice Questions (with answers provided below each question)

            Transcript:
            ${transcript.substring(0, 50000)}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that generates high-quality study notes." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "text" }
        });

        const resultText = completion.choices[0].message.content;

        return NextResponse.json({
            success: true,
            content: resultText,
            title: videoTitle,
            videoId
        });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({
            error: error.message || "An unexpected error occurred during processing."
        }, { status: 500 });
    }
}
