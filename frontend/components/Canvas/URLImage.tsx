import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useEffect, useRef } from "react";
import Konva from "konva";

interface URLImageProps {
    src: string;
    x?: number;
    y?: number;
    brightness?: number;
    contrast?: number;
    onImageLoad?: (width: number, height: number) => void;
}

export default function URLImage({ src, x = 0, y = 0, brightness = 0, contrast = 0, onImageLoad }: URLImageProps) {
    const [image] = useImage(src);
    const imageRef = useRef<any>(null);

    useEffect(() => {
        if (image && onImageLoad) {
            onImageLoad(image.width, image.height);
        }
    }, [image, onImageLoad]);

    useEffect(() => {
        if (image && imageRef.current) {
            imageRef.current.cache();
        }
    }, [image]);

    return (
        <KonvaImage
            ref={imageRef}
            image={image}
            x={x}
            y={y}
            filters={[Konva.Filters.Brighten, Konva.Filters.Contrast]}
            brightness={brightness}
            contrast={contrast}
        />
    );
}
