import { DocumentQA } from "@/components/document-qa";

export default function DocumentsPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">AI Document Assistant</h1>
                <p className="text-gray-400 mt-2 text-lg">Upload PDF or Text files and chat with them instantly using RAG.</p>
            </div>

            <DocumentQA />
        </div>
    );
}
