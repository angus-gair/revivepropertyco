
import React, { useState } from 'react';
import { Camera, Video, Trash2, CloudUpload } from 'lucide-react';

interface MediaUploadProps {
  onUploadComplete: (files: File[]) => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      onUploadComplete([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUploadComplete(newFiles);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-[11px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-4">
        <Camera size={18} /> Asset Documentation
      </h3>
      
      <div 
        className={`relative border-2 border-dashed p-12 text-center transition-all cursor-pointer rounded-none ${
          isHovered ? 'border-[#36453B] bg-[#36453B]/5' : 'border-slate-200 bg-[#F8F7F4]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsHovered(false);
          if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...newFiles]);
            onUploadComplete([...files, ...newFiles]);
          }
        }}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white border border-slate-100 flex items-center justify-center shadow-lg mb-6 text-[#121212]">
            <CloudUpload size={32} strokeWidth={1} />
          </div>
          <p className="text-[#121212] text-xs font-black uppercase tracking-[0.2em]">Transmit Assets</p>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Provide site imagery for technical preparation</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {files.map((file, i) => (
            <div key={i} className="bg-white border border-slate-200 p-4 flex items-center gap-5 shadow-sm rounded-none">
              <div className="p-2 bg-[#F8F7F4] text-[#36453B]">
                {file.type.startsWith('image') ? <Camera size={16} /> : <Video size={16} />}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[10px] font-black text-[#121212] uppercase tracking-tighter truncate">{file.name}</p>
                <p className="text-[9px] text-slate-400 font-bold">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button 
                onClick={() => removeFile(i)}
                className="p-2 text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaUpload;
