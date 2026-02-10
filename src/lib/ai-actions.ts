"use server";

// This file previously contained scraping logic which has been removed.
// All YouTube processing is now handled via the /api/process-video route
// to ensure compliance with official API usage and manual fallback policies.

export interface AIResponse {
    summary: string;
    studyNotes: string;
    isFallback?: boolean;
    error?: string;
}

export async function processYouTubeVideo(url: string): Promise<AIResponse> {
    return {
        summary: "",
        studyNotes: "",
        error: "This action is deprecated. Please use the /api/process-video endpoint."
    };
}
