import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/crop-image';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/axios';
import { Upload, X, Loader2 } from 'lucide-react';

const Slider = ({ value, min, max, step, onValueChange, className }: any) => (
  <input
    type="range"
    value={value[0]}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onValueChange([parseFloat(e.target.value)])}
    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
  />
);

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, setUser } = useAuthStore();

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsDialogOpen(true);
      // Reset input value to allow re-selecting same file
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImage) return;

      const formData = new FormData();
      formData.append('file', croppedImage, 'avatar.jpg');

      const res: any = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (user) {
        const avatarUrl = res.url;
        setUser({ ...user, avatar: avatarUrl });
      }
      
      setIsDialogOpen(false);
      setImageSrc(null);
    } catch (error) {
      console.error('Failed to upload avatar', error);
    } finally {
      setLoading(false);
    }
  };

  const onSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <button
          onClick={onSelectFile}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white cursor-pointer"
        >
          <Upload className="w-6 h-6" />
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b flex justify-between items-center">
               <h3 className="font-semibold text-lg">调整头像</h3>
               <button onClick={() => setIsDialogOpen(false)}><X className="w-5 h-5" /></button>
             </div>
             
             <div className="relative h-64 w-full bg-black">
               <Cropper
                 image={imageSrc || ''}
                 crop={crop}
                 zoom={zoom}
                 aspect={1}
                 onCropChange={setCrop}
                 onCropComplete={onCropComplete}
                 onZoomChange={setZoom}
               />
             </div>
             
             <div className="p-4 space-y-4">
               <div className="flex items-center gap-4">
                 <span className="text-sm font-medium w-12">缩放</span>
                 <Slider
                   value={[zoom]}
                   min={1}
                   max={3}
                   step={0.1}
                   onValueChange={(val: number[]) => setZoom(val[0])}
                 />
               </div>
               <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                 <Button onClick={handleSave} disabled={loading}>
                   {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                   保存
                 </Button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
