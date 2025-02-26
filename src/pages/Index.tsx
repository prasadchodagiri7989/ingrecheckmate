
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Camera from "@/components/Camera";
import Analysis from "@/components/Analysis";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen bg-[#E8F5E9]/20">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Ingredient Analysis
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Analyze Food Ingredients
          </h1>
          <p className="text-gray-500">
            Capture a photo of food packaging to analyze ingredients
          </p>
        </div>

        <Card className="overflow-hidden">
          {!capturedImage ? (
            <Camera onCapture={handleImageCapture} />
          ) : (
            <Analysis
              imageData={capturedImage}
              onRetake={handleRetake}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
