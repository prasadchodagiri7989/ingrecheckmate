
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const parseGeminiResponse = (text: string): IngredientAnalysis[] => {
    try {
      // Split the response by new lines to separate ingredients
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const ingredients: IngredientAnalysis[] = [];
      
      let currentIngredient: Partial<IngredientAnalysis> = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          // New ingredient found
          if (currentIngredient.ingredient) {
            ingredients.push(currentIngredient as IngredientAnalysis);
            currentIngredient = {};
          }
          currentIngredient.ingredient = line.split(':')[0].trim();
        } else if (line.toLowerCase().includes('harm scale')) {
          // Extract harm scale (assuming format like "Harm Scale: 7/10")
          const scale = line.match(/\d+/);
          if (scale) {
            currentIngredient.harmScale = parseInt(scale[0]);
          }
        } else if (line.toLowerCase().includes('disease') || line.toLowerCase().includes('health')) {
          // Extract diseases
          const diseases = line.split(':')[1]?.split(',').map(d => d.trim()) || [];
          currentIngredient.diseases = diseases.filter(d => d !== '');
        }
      }
      
      // Add the last ingredient if exists
      if (currentIngredient.ingredient) {
        ingredients.push(currentIngredient as IngredientAnalysis);
      }

      return ingredients;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return [];
    }
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageData }
      });

      if (error) throw error;

      console.log('Gemini Response:', data.text);

      // Parse the response and update state
      const parsedAnalysis = parseGeminiResponse(data.text);
      
      if (parsedAnalysis.length === 0) {
        throw new Error("Could not parse ingredients from the image");
      }

      setAnalysis(parsedAnalysis);
      toast({
        title: "Analysis Complete",
        description: `Found ${parsedAnalysis.length} ingredients in the image`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
      setAnalysis([]);
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
