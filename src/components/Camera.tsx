
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, RotateCcw } from "lucide-react";

interface CameraProps {
  onCapture: (imageData: string) => void;
}

const Camera = ({ onCapture }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg");
      onCapture(imageData);
      stopCamera();
    }
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full aspect-[4/3] bg-black ${
          isCameraActive ? "opacity-100" : "opacity-0"
        }`}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {!isCameraActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Button
            onClick={toggleCamera}
            className="flex items-center space-x-2"
            size="lg"
          >
            <CameraIcon className="w-5 h-5" />
            <span>Start Camera</span>
          </Button>
        </div>
      )}

      {isCameraActive && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={switchCamera}
            className="rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            onClick={captureImage}
            size="lg"
            className="rounded-full px-8"
          >
            Capture
          </Button>
        </div>
      )}
    </div>
  );
};

export default Camera;
