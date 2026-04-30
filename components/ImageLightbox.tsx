import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reset state when index changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        prev();
      } else if (e.key === 'ArrowRight') {
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const next = () => {
    setCurrentIndex((i) => (i + 1) % images.length);
  };

  const prev = () => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  };

  const downloadImage = () => {
    const imageUrl = `/api/hipages/image?url=${encodeURIComponent(images[currentIndex])}`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `hipages-attachment-${currentIndex + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentImageUrl = `/api/hipages/image?url=${encodeURIComponent(images[currentIndex])}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white text-sm font-medium">
          <span className="text-lg font-bold">{currentIndex + 1}</span>
          <span className="mx-2 opacity-50">/</span>
          <span className="opacity-75">{images.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {images.length > 1 && (
            <button
              onClick={downloadImage}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Download image"
            >
              <Download size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close (ESC)"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {isLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="text-center text-white/70">
            <p className="text-lg mb-2">Failed to load image</p>
            <p className="text-sm">The image may be unavailable or expired</p>
          </div>
        ) : (
          <img
            src={currentImageUrl}
            alt={`Attachment ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && !imageError && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110"
              title="Previous image (←)"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>

            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110"
              title="Next image (→)"
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </div>

      {/* Footer - Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center gap-2 overflow-x-auto">
            {images.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
              >
                <img
                  src={`/api/hipages/image?url=${encodeURIComponent(imageUrl)}`}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Hints */}
      <div className="absolute bottom-4 right-4 text-white/40 text-xs hidden md:block">
        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> to close
      </div>
    </div>
  );
};
