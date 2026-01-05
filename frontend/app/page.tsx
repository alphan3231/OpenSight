"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

import { API_URL } from "@/lib/utils";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects/`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    try {
      const res = await fetch(`${API_URL}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
      });
      if (res.ok) {
        setNewProjectName("");
        setNewProjectDesc("");
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              OpenSight
            </h1>
            <p className="text-gray-400 mt-2">Computer Vision Dataset Manager</p>
          </div>
          <form onSubmit={createProject} className="flex gap-2">
            <input
              type="text"
              placeholder="New Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Create
            </button>
          </form>
        </header>

        {loading ? (
          <div className="text-center text-gray-500">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="group block"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-900/50 transition-all duration-300">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                    {project.description || "No description"}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
