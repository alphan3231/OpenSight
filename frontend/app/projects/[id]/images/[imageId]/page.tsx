"use client";

import { useState, use, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

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

interface Image {
    id: string;
    file_path: string;
    filename: string;
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function AnnotationPage({ params }: { params: Promise<{ id: string, imageId: string }> }) {
    const { id, imageId } = use(params);
    const router = useRouter();

    const [tool, setTool] = useState<"select" | "rect" | "pan">("rect");
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [imagePath, setImagePath] = useState<string>("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [projectImages, setProjectImages] = useState<Image[]>([]);
    const [projectClasses, setProjectClasses] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load Project & Image Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get Project Images for Navigation
                const res = await fetch(`http://localhost:8000/projects/${id}`);
                const project = await res.json();
                setProjectImages(project.images);

                const img = project.images.find((i: any) => i.id === imageId);
                if (img) {
                    setImagePath(`http://localhost:8000/static/${id}/images/${img.file_path}`);
                }

                // Get Existing Annotations
                const annRes = await fetch(`http://localhost:8000/projects/${id}/images/${imageId}/annotations`);
                if (annRes.ok) {
                    const anns = await annRes.json();
                    setAnnotations(anns);
                }

                // Get Classes
                const classRes = await fetch(`http://localhost:8000/projects/${id}/classes`);
                if (classRes.ok) {
                    const data = await classRes.json();
                    setProjectClasses(data.classes || []);
                }

                setIsLoaded(true);

            } catch (e) {
                console.error("Failed to load data", e);
            }
        }
        fetchData();
    }, [id, imageId]);

    // Auto-Save Logic
    // We debounce the annotations change
    const debouncedAnnotations = useDebounce(annotations, 1000);

    useEffect(() => {
        if (!isLoaded) return; // Don't save on initial load

        const save = async () => {
            setSaving(true);
            try {
                await fetch(`http://localhost:8000/projects/${id}/images/${imageId}/annotations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(debouncedAnnotations),
                });
            } catch (e) {
                console.error("Save failed", e);
            } finally {
                setSaving(false);
            }
        };

        save();
    }, [debouncedAnnotations, id, imageId, isLoaded]);

    const saveClasses = async (newClasses: string[]) => {
        try {
            await fetch(`http://localhost:8000/projects/${id}/classes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classes: newClasses }),
            });
            setProjectClasses(newClasses);
        } catch (e) {
            console.error("Failed to save classes", e);
        }
    };

    // Navigation Logic
    const currentIndex = projectImages.findIndex(img => img.id === imageId);
    const prevImageId = currentIndex > 0 ? projectImages[currentIndex - 1].id : null;
    const nextImageId = currentIndex < projectImages.length - 1 ? projectImages[currentIndex + 1].id : null;

    const goToImage = (newId: string) => {
        router.push(`/projects/${id}/images/${newId}`);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return; // Ignore if typing

            if (e.key === "ArrowRight" && nextImageId) goToImage(nextImageId);
            if (e.key === "ArrowLeft" && prevImageId) goToImage(prevImageId);
            if (e.key.toLowerCase() === "v") setTool("select");
            if (e.key.toLowerCase() === "r") setTool("rect");
            if (e.key.toLowerCase() === "h") setTool("pan");
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nextImageId, prevImageId]);


    // Handlers (Edit/Delete) - Same as before
    const handleLabelChange = (newLabel: string) => {
        if (!selectedId) return;
        setAnnotations(annotations.map(ann =>
            ann.id === selectedId ? { ...ann, label: newLabel } : ann
        ));
    };

    const handleLabelBlur = (label: string) => {
        if (label && !projectClasses.includes(label)) {
            const newClasses = [...projectClasses, label];
            saveClasses(newClasses);
        }
    };

    const handleDelete = () => {
        if (!selectedId) return;
        setAnnotations(annotations.filter(ann => ann.id !== selectedId));
        setSelectedId(null);
    };

    const selectedAnnotation = annotations.find(a => a.id === selectedId);

    return (
        <main className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-900 z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${id}`} className="text-gray-400 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={!prevImageId}
                            onClick={() => prevImageId && goToImage(prevImageId)}
                            className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500">
                            {currentIndex + 1} / {projectImages.length}
                        </span>
                        <button
                            disabled={!nextImageId}
                            onClick={() => nextImageId && goToImage(nextImageId)}
                            className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-800 rounded p-1">
                    <button onClick={() => setTool("select")} className={`px-3 py-1 text-xs rounded ${tool === "select" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Select (V)</button>
                    <button onClick={() => setTool("pan")} className={`px-3 py-1 text-xs rounded ${tool === "pan" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Pan (H)</button>
                    <button onClick={() => setTool("rect")} className={`px-3 py-1 text-xs rounded ${tool === "rect" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Rectangle (R)</button>
                </div>

                <div>
                    <span className={`text-xs px-2 py-1 rounded transition-colors ${saving ? "text-yellow-400" : "text-green-500"}`}>
                        {saving ? "Saving..." : "Saved"}
                    </span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Helper Sidebar */}
                <div className="w-16 border-r border-gray-800 bg-gray-900 flex flex-col items-center py-4 gap-4">
                    {/* Could add tool icons here */}
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
                                        list="classes"
                                        type="text"
                                        value={selectedAnnotation.label}
                                        onChange={(e) => handleLabelChange(e.target.value)}
                                        onBlur={(e) => handleLabelBlur(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                                    />
                                    <datalist id="classes">
                                        {projectClasses.map(cls => (
                                            <option key={cls} value={cls} />
                                        ))}
                                    </datalist>
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
                                        setTool("select");
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
