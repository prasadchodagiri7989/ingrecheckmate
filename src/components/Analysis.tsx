
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, AlertTriangle } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/components/ui/use-toast";

interface AnalysisProps {
  imageData: string;
  onRetake: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

interface IngredientAnalysis {
  ingredient: string;
  harmScale: number;
  diseases: string[];
}

const Analysis = ({
  imageData,
  onRetake,
  isAnalyzing,
  setIsAnalyzing,
}: AnalysisProps) => {
  const [analysis, setAnalysis] = useState<IngredientAnalysis[]>([]);
  const { toast } = useToast();

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI("YOUR_API_KEY"); // Replace with your API key
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      // Convert base64 to binary
      const imageBase64 = imageData.split(",")[1];
      const imageBinary = atob(imageBase64);
      const bytes = new Uint8Array(imageBinary.length);
      for (let i = 0; i < imageBinary.length; i++) {
        bytes[i] = imageBinary.charCodeAt(i);
      }

      // Analyze with Gemini
      const result = await model.generateContent([
        "Analyze this food packaging image and list all ingredients. For each ingredient, provide a harm scale from 1-10 (10 being most harmful) and potential diseases associated with excessive consumption.",
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse the response and update state
      // This is a simplified example - you'd need to properly parse the Gemini response
      const mockAnalysis: IngredientAnalysis[] = [
        {
          ingredient: "Sample Ingredient",
          harmScale: 5,
          diseases: ["Sample Disease 1", "Sample Disease 2"],
        },
      ];

      setAnalysis(mockAnalysis);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeImage();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <img
          src={imageData}
          alt="Captured food package"
          className="w-full rounded-lg"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetake}
          className="absolute top-2 right-2"
        >
          <Camera className="w-4 h-4 mr-2" />
          Retake
        </Button>
      </div>

      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-500">Analyzing ingredients...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analysis.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{item.ingredient}</h3>
                <div
                  className={`px-2 py-1 rounded text-sm ${
                    item.harmScale > 7
                      ? "bg-red-100 text-red-800"
                      : item.harmScale > 4
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  Harm Scale: {item.harmScale}/10
                </div>
              </div>
              
              {item.diseases.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Potential Health Concerns:
                  </div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {item.diseases.map((disease, idx) => (
                      <li key={idx}>{disease}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analysis;
