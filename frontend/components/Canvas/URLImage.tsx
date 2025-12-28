import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useEffect, useRef } from "react";

interface URLImageProps {
    src: string;
    x?: number;
    y?: number;
    onImageLoad?: (width: number, height: number) => void;
}

export default function URLImage({ src, x = 0, y = 0, onImageLoad }: URLImageProps) {
    const [image] = useImage(src);
    const imageRef = useRef<any>(null);

    useEffect(() => {
        if (image && onImageLoad) {
            onImageLoad(image.width, image.height);
        }
    }, [image, onImageLoad]);

    return <KonvaImage ref={imageRef} image={image} x={x} y={y} />;
}
