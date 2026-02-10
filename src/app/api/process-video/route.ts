import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { transcript, videoTitle } = await req.json();

        if (!transcript || transcript.trim().length < 50) {
            return NextResponse.json({ error: "Transcript is too short or missing." }, { status: 400 });
        }

        const prompt = `
            You are an expert academic tutor. Analyze the following transcript from a video ${videoTitle ? `titled "${videoTitle}"` : ""} and generate highly structured study notes.
            
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
        });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({
            error: error.message || "An unexpected error occurred during processing."
        }, { status: 500 });
    }
}
