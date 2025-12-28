"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Image {
    id: string;
    filename: string;
    file_path: string;
    file_size: number;
}

interface Project {
    id: string;
    name: string;
    description: string;
    images: Image[];
}

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchProject = async () => {
        try {
            const res = await fetch(`http://localhost:8000/projects/${id}`);
            if (!res.ok) throw new Error("Project not found");
            const data = await res.json();
            setProject(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", e.target.files[0]);

        try {
            const res = await fetch(`http://localhost:8000/projects/${id}/images`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                fetchProject();
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="text-white p-8">Loading project...</div>;
    if (!project) return <div className="text-white p-8">Project not found</div>;

    return (
        <main className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold">{project.name}</h1>
                            <p className="text-gray-400 mt-1">{project.description}</p>
                        </div>
                        <div>
                            <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium transition-colors inline-flex items-center gap-2">
                                <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {project.images?.map((img) => (
                        <div
                            key={img.id}
                            className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative group"
                        >
                            {/* Note: We need a way to serve images. For now, assuming direct serve will need setup.
                  Using a placeholder or assumed invalid URL for now until we serve static files. 
                  Actually, we need to serve the 'data' folder via FastAPI or Next.js.
                  Let's assume backend serves them at /static/ or similar, or just show placeholder. */}
                            <Link href={`/projects/${id}/images/${img.id}`} className="block w-full h-full relative">
                                <img
                                    src={`http://localhost:8000/static/${id}/images/${img.file_path}`}
                                    alt={img.filename}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-xs truncate w-full text-white">{img.filename}</span>
                                </div>
                            </Link>
                        </div>
                    ))}
                    {project.images?.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl">
                            No images yet. Upload one to get started.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
