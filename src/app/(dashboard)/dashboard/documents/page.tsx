import { DocumentQA } from "@/components/document-qa";

export default function DocumentsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">AI Document Assistant</h1>
                    <p className="text-slate-400">Upload your PDFs and Text files to get instant AI-powered answers based on their content.</p>
                </header>

                <DocumentQA />
            </div>
        </div>
    );
}
