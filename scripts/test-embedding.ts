
import "dotenv/config";

async function generateEmbedding(text: string) {
    console.log("Generating embedding for:", text);
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
            }
        );

        if (!response.ok) {
            console.error("HF Inference API error:", await response.text());
            return null;
        }

        const result = await response.json();
        console.log("Result type:", typeof result);
        console.log("Result is array:", Array.isArray(result));
        if (Array.isArray(result) && result.length > 0) {
            const embedding = Array.isArray(result[0]) ? result[0] : result;
            console.log("Embedding length:", embedding.length);
            console.log("First 5 values:", embedding.slice(0, 5));
            return embedding;
        }
        return null;
    } catch (error) {
        console.error("Embedding generation error:", error);
        return null;
    }
}

generateEmbedding("Hello world");
