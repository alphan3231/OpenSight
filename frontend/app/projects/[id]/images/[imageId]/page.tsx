"use client";

import { useState, use, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon, QuestionMarkCircleIcon, ArrowPathIcon, ArrowDownTrayIcon, ViewColumnsIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/solid";
import { API_URL } from "@/lib/utils";

const AnnotationStage = dynamic(
    () => import("@/components/Canvas/AnnotationStage"),
    { ssr: false }
);

import ShortcutsModal from "@/components/Modals/ShortcutsModal";

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
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [showGrid, setShowGrid] = useState(false);

    // Zoom state lifted to page for UI controls (simplification, though really stage handles it. 
    // Ideally stage should expose zoom handler, but for now we'll pass a trigger or just let stage handle wheel and we drive stage via ref.
    // Actually, passing scale prop to stage and letting page control it is better, but refactor is heavy.
    // Let's implement Zoom handlers here and pass them or just pass a "zoomAction" prop?
    // Better: Lift scale state to Page.
    const [scale, setScale] = useState(1);

    const [projectImages, setProjectImages] = useState<Image[]>([]);
    const [projectClasses, setProjectClasses] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);

    // Load Project & Image Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get Project Images for Navigation
                const res = await fetch(`${API_URL}/projects/${id}`);
                if (res.ok) {
                    const project = await res.json();
                    setProjectImages(project.images);
                    const img = project.images.find((i: any) => i.id === imageId);
                    if (img) {
                        setImagePath(`${API_URL}/static/${id}/images/${img.file_path}`);
                    }
                }

                // Get Existing Annotations
                const annRes = await fetch(`${API_URL}/projects/${id}/images/${imageId}/annotations`);
                if (annRes.ok) {
                    const anns = await annRes.json();
                    setAnnotations(anns);
                }

                // Get Classes
                const classRes = await fetch(`${API_URL}/projects/${id}/classes`);
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
                await fetch(`${API_URL}/projects/${id}/images/${imageId}/annotations`, {
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

    // Save Classes
    const saveClasses = async (newClasses: string[]) => {
        try {
            await fetch(`${API_URL}/projects/${id}/classes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classes: newClasses }),
            });
            setProjectClasses(newClasses);
        } catch (e) {
            console.error("Failed to save classes", e);
        }
    };

    // Auto Detect Logic (YOLO)
    const handleAutoDetect = async () => {
        setDetecting(true);
        try {
            const res = await fetch(`${API_URL}/projects/${id}/images/${imageId}/predict`, {
                method: "POST"
            });
            if (res.ok) {
                const newAnns = await res.json();
                setAnnotations(prev => [...prev, ...newAnns]);
            }
        } catch (e) {
            console.error("Auto detect failed", e);
        } finally {
            setDetecting(false);
        }
    };


    // Export Logic
    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(annotations, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `annotations_${imageId}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
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
            if (e.key === "?") setShowShortcuts(prev => !prev);
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
                    <button onClick={() => setScale(s => s * 1.1)} className="p-1 text-gray-400 hover:text-white" title="Zoom In">
                        <MagnifyingGlassPlusIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setScale(s => s / 1.1)} className="p-1 text-gray-400 hover:text-white" title="Zoom Out">
                        <MagnifyingGlassMinusIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-700 mx-2"></div>
                    <button onClick={() => setTool("select")} className={`px-3 py-1 text-xs rounded ${tool === "select" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Select (V)</button>
                    <button onClick={() => setTool("pan")} className={`px-3 py-1 text-xs rounded ${tool === "pan" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Pan (H)</button>
                    <button onClick={() => setTool("rect")} className={`px-3 py-1 text-xs rounded ${tool === "rect" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>Rectangle (R)</button>
                    <div className="w-px h-4 bg-gray-700 mx-2"></div>
                    <button onClick={() => setRotation(r => r - 90)} className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white" title="Rotate Left">
                        <ArrowPathIcon className="w-4 h-4 -scale-x-100" />
                    </button>
                    <button onClick={() => setRotation(r => r + 90)} className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white" title="Rotate Right">
                        <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-700 mx-2"></div>
                    <button
                        onClick={() => setShowGrid(prev => !prev)}
                        className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${showGrid ? "bg-blue-900/50 text-blue-300" : "text-gray-400 hover:text-white"}`}
                        title="Toggle Grid"
                    >
                        <ViewColumnsIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-700 mx-2"></div>
                    <button
                        onClick={handleAutoDetect}
                        disabled={detecting}
                        className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${detecting ? "bg-purple-900/50 text-purple-300" : "bg-purple-600 text-white hover:bg-purple-500"}`}
                    >
                        <SparklesIcon className="w-3 h-3" />
                        {detecting ? "Detecting..." : "Auto Detect"}
                    </button>
                    <div className="w-px h-4 bg-gray-700 mx-2"></div>
                    <button
                        onClick={handleExport}
                        className="px-3 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:text-white flex items-center gap-2"
                        title="Export JSON"
                    >
                        <ArrowDownTrayIcon className="w-3 h-3" />
                        Export
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-gray-800 rounded p-1 ml-4">
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Shortcuts (?)"
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                    </button>
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
                            rotation={rotation}
                            scale={scale}
                            onScaleChange={setScale}
                            brightness={brightness}
                            contrast={contrast}
                            showGrid={showGrid}
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
                            <div className="space-y-4">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-2">Image Adjustments</div>
                                <div>
                                    <label className="text-xs text-gray-400 flex justify-between">
                                        Brightness <span>{brightness.toFixed(1)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="-1"
                                        max="1"
                                        step="0.1"
                                        value={brightness}
                                        onChange={(e) => setBrightness(parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 flex justify-between">
                                        Contrast <span>{contrast}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        step="5"
                                        value={contrast}
                                        onChange={(e) => setContrast(parseInt(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <button
                                    onClick={() => { setBrightness(0); setContrast(0); setRotation(0); }}
                                    className="text-xs text-blue-400 hover:text-blue-300 w-full text-center mt-2"
                                >
                                    Reset Adjustments
                                </button>
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
            <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </main>
    );
}
