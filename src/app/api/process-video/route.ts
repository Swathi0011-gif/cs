import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import ytdl from "@distube/ytdl-core";
import OpenAI from "openai";
import fs from "fs-extra";
import path from "path";
import os from "os";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; // Extend Vercel timeout to 60s (if plan allows)

function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

export async function POST(req: NextRequest) {
    let tempFilePath = "";
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        // 1. Check Duration
        const info = await ytdl.getBasicInfo(url);
        const durationSeconds = parseInt(info.videoDetails.lengthSeconds);
        if (durationSeconds > 15 * 60) {
            return NextResponse.json({ error: "Video too long. Please use video under 15 minutes." }, { status: 400 });
        }

        let transcript = "";
        let method = "transcript";

        // 2. Attempt Transcript Fetch
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
            transcript = transcriptItems.map(item => item.text).join(" ");
        } catch (e) {
            console.log("Transcript fetch failed, using Whisper fallback...");
            method = "whisper";
        }

        // 3. Whisper Fallback if Transcript is missing
        if (!transcript || transcript.length < 50) {
            method = "whisper";
            const tempDir = os.tmpdir();
            tempFilePath = path.join(tempDir, `${videoId}.mp3`);

            // Stream audio to temp file
            await new Promise((resolve, reject) => {
                const stream = ytdl(url, { filter: "audioonly", quality: "lowestaudio" })
                    .pipe(fs.createWriteStream(tempFilePath));
                stream.on("finish", () => resolve(true));
                stream.on("error", reject);
            });

            // Transcribe with Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
            });
            transcript = transcription.text;
        }

        if (!transcript) {
            return NextResponse.json({ error: "Failed to obtain transcript/audio text." }, { status: 500 });
        }

        // 4. Generate Structured Notes with GPT
        const prompt = `
            You are an expert academic tutor. Analyze the following transcript from a YouTube video and generate highly structured study notes.
            
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
            method,
            content: resultText,
            videoId,
            title: info.videoDetails.title
        });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({
            error: error.message || "An unexpected error occurred during processing."
        }, { status: 500 });
    } finally {
        // Cleanup temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { await fs.unlink(tempFilePath); } catch (e) { console.error("Unlink error:", e); }
        }
    }
}
