# 👁️ OpenSight

OpenSight is an open-source, web-based image annotation tool designed for computer vision capability. It provides a seamless interface for managing datasets, labeling images with bounding boxes, and leveraging AI models for auto-detection.

![OpenSight Dashboard](https://via.placeholder.com/800x400?text=OpenSight+Dashboard+Preview)

## 🚀 Features

-   **📂 Project Management**: Create and manage multiple labeling projects.
-   **🖼️ Image Gallery**: Grid view for easy navigation of large datasets.
-   **✏️ Advanced Canvas**:
    -   Draw Bounding Boxes.
    -   Zoom & Pan support.
    -   Dynamic Label Scaling (Readability at any zoom level).
-   **🏷️ Class Management**:
    -   Define custom object classes.
    -   Smart Autocomplete for quick labeling.
-   **🧠 AI Assistant (Auto-Label)**:
    -   Integrated **YOLOv8** model.
    -   One-click "Magic Wand" to automatically detect and label objects in images.
-   **💾 Auto-Save**: Never lose your work; annotations are saved automatically.
-   **🐳 Dockerized**: Fully containerized for easy deployment.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14, React, Konva (Canvas), Tailwind CSS.
-   **Backend**: FastAPI (Python), SQLAlchemy, Pydantic, Ultralytics (YOLO).
-   **Database**: PostgreSQL.
-   **Storage**: MinIO (S3-compatible) or Local File System.
-   **Infrastructure**: Docker & Docker Compose.

## 📦 Installation & Setup

### Prerequisites

-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

### Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/OpenSight.git
    cd OpenSight
    ```

2.  **Start the services**
    ```bash
    docker-compose up --build
    ```
    *Note: The first run might take a few minutes to build images and download the YOLO model.*

3.  **Access the Application**
    -   **Frontend (UI)**: [http://localhost:3000](http://localhost:3000)
    -   **Backend (API Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)
    -   **MinIO (Storage)**: [http://localhost:9001](http://localhost:9001)

## 📖 Usage Guide

1.  **Create a Project**: Go to the dashboard and create a new project (e.g., "Car Detection").
2.  **Upload Images**: Open the project and upload images via the "Upload Image" button.
3.  **Annotate**: Click on an image to enter the Annotation Studio.
    -   Press `R` for Rectangle tool.
    -   Press `V` for Select/Edit tool.
    -   Press `H` or Space for Pan tool.
4.  **Auto-Detect**: Click the **✨ Auto Detect** button in the toolbar to let AI start the work for you.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any features or bug fixes.

## 📄 License

This project is licensed under the MIT License.
