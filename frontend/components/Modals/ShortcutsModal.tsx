import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    if (!isOpen) return null;

    const shortcuts = [
        { key: "R", description: "Select Rectangle Tool" },
        { key: "V", description: "Select Edit/Move Tool" },
        { key: "H", description: "Select Pan Tool" },
        { key: "Space", description: "Hold to Pan" },
        { key: "← / →", description: "Previous / Next Image" },
        { key: "?", description: "Show this help menu" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Keyboard Shortcuts</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
                        {shortcuts.map((s) => (
                            <React.Fragment key={s.key}>
                                <div className="flex justify-end">
                                    <kbd className="bg-gray-800 border-b-2 border-gray-700 rounded px-2 py-0.5 text-xs font-mono text-gray-300 min-w-[2rem] text-center">
                                        {s.key}
                                    </kbd>
                                </div>
                                <div className="text-sm text-gray-400 flex items-center">
                                    {s.description}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-500">
                        Press <span className="text-gray-300">?</span> to toggle this menu anytime.
                    </p>
                </div>
            </div>
        </div>
    );
}
