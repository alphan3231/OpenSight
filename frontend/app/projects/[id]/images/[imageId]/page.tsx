"use client";

import { useState, use, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";

const AnnotationStage = dynamic(
    () => import("@/components/Canvas/AnnotationStage"),
    { ssr: false }
);

interface Annotation {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

export default function AnnotationPage({ params }: { params: Promise<{ id: string, imageId: string }> }) {
    const { id, imageId } = use(params);

    const [tool, setTool] = useState<"select" | "rect" | "pan">("rect");
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [imagePath, setImagePath] = useState<string>("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = await fetch(`http://localhost:8000/projects/${id}`);
                const project = await res.json();
                const img = project.images.find((i: any) => i.id === imageId);
                if (img) {
                    setImagePath(`http://localhost:8000/static/${id}/images/${img.file_path}`);
                }
            } catch (e) {
                console.error("Failed to load image", e);
            }
        }
        fetchImage();
    }, [id, imageId]);

    // Handle label change
    const handleLabelChange = (newLabel: string) => {
        if (!selectedId) return;
        setAnnotations(annotations.map(ann =>
            ann.id === selectedId ? { ...ann, label: newLabel } : ann
        ));
    };

    // Handle delete
    const handleDelete = () => {
        if (!selectedId) return;
        setAnnotations(annotations.filter(ann => ann.id !== selectedId));
        setSelectedId(null);
    };

    const selectedAnnotation = annotations.find(a => a.id === selectedId);

    return (
        <main className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
            {/* Header with Tools */}
            <header className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-900 z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${id}`} className="text-gray-400 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <h1 className="font-semibold text-sm">Annotation Studio</h1>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 rounded p-1">
                    <button onClick={() => setTool("select")} className={`px-3 py-1 text-xs rounded ${tool === "select" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Select (V)</button>
                    <button onClick={() => setTool("pan")} className={`px-3 py-1 text-xs rounded ${tool === "pan" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Pan (H)</button>
                    <button onClick={() => setTool("rect")} className={`px-3 py-1 text-xs rounded ${tool === "rect" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Rectangle (R)</button>
                </div>
                <div>
                    {/* Save placeholder */}
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs">Save</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Helper Sidebar */}
                <div className="w-16 border-r border-gray-800 bg-gray-900 flex flex-col items-center py-4 gap-4">
                    {/* Tool Icons could go here */}
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                    {imagePath && (
                        <AnnotationStage
                            imageSrc={imagePath}
                            annotations={annotations}
                            onAnnotationsChange={setAnnotations}
                            onSelectAnnotation={setSelectedId}
                            selectedId={selectedId}
                            tool={tool}
                        />
                    )}
                </div>

                {/* Properties Sidebar */}
                <div className="w-72 border-l border-gray-800 bg-gray-900 flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Properties</h3>
                        {selectedAnnotation ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Class Label</label>
                                    <input
                                        type="text"
                                        value={selectedAnnotation.label}
                                        onChange={(e) => handleLabelChange(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                    <div>X: {Math.round(selectedAnnotation.x)}</div>
                                    <div>Y: {Math.round(selectedAnnotation.y)}</div>
                                    <div>W: {Math.round(selectedAnnotation.width)}</div>
                                    <div>H: {Math.round(selectedAnnotation.height)}</div>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    className="w-full bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900 p-2 rounded text-xs transition-colors"
                                >
                                    Delete Object
                                </button>
                            </div>
                        ) : (
                            <div className="text-gray-600 text-sm text-center py-4">
                                Select an object to edit
                            </div>
                        )}
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Objects List ({annotations.length})</h3>
                        <div className="space-y-2">
                            {annotations.map((ann, idx) => (
                                <div
                                    key={ann.id}
                                    onClick={() => {
                                        setSelectedId(ann.id);
                                        setTool("select"); // Auto switch tool
                                    }}
                                    className={`p-2 rounded cursor-pointer text-xs flex justify-between items-center border ${ann.id === selectedId ? "bg-blue-900/30 border-blue-500" : "bg-gray-800 border-transparent hover:border-gray-600"
                                        }`}
                                >
                                    <span className="font-medium truncate">{ann.label}</span>
                                    <span className="text-gray-500">#{idx + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
