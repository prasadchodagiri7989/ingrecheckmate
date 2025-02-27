
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parseGeminiResponse = (text: string): IngredientAnalysis[] => {
    try {
      console.log("Parsing response:", text);
      // Split the response by new lines to separate ingredients
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const ingredients: IngredientAnalysis[] = [];
      
      let currentIngredient: Partial<IngredientAnalysis> = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const parts = line.split(':');
          const label = parts[0].trim().toLowerCase();
          
          // If we find an ingredient, start a new entry
          if (!label.includes('harm') && !label.includes('disease') && !label.includes('health')) {
            if (currentIngredient.ingredient) {
              // Make sure we have all required fields before adding
              if (!currentIngredient.harmScale) currentIngredient.harmScale = 5;
              if (!currentIngredient.diseases) currentIngredient.diseases = [];
              
              ingredients.push(currentIngredient as IngredientAnalysis);
              currentIngredient = {};
            }
            currentIngredient.ingredient = parts[0].trim();
          } else if (label.includes('harm scale')) {
            // Extract harm scale (assuming format like "Harm Scale: 7/10")
            const scale = line.match(/\d+/);
            if (scale) {
              currentIngredient.harmScale = parseInt(scale[0]);
            } else {
              currentIngredient.harmScale = 5; // Default value
            }
          } else if (label.includes('disease') || label.includes('health') || label.includes('concern')) {
            // Extract diseases
            const diseaseText = parts.slice(1).join(':');
            const diseases = diseaseText.split(',').map(d => d.trim()).filter(d => d !== '');
            currentIngredient.diseases = diseases;
          }
        }
      }
      
      // Add the last ingredient if exists
      if (currentIngredient.ingredient) {
        if (!currentIngredient.harmScale) currentIngredient.harmScale = 5;
        if (!currentIngredient.diseases) currentIngredient.diseases = [];
        
        ingredients.push(currentIngredient as IngredientAnalysis);
      }

      console.log("Parsed ingredients:", ingredients);
      return ingredients;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      setError('Failed to parse AI response. Please try again.');
      return [];
    }
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageData }
      });

      if (error) throw error;

      console.log('Gemini Response:', data.text);

      // Parse the response and update state
      const parsedAnalysis = parseGeminiResponse(data.text);
      
      if (parsedAnalysis.length === 0) {
        // Instead of throwing an error, just show a message
        toast({
          title: "Analysis Complete",
          description: "No ingredients were detected. Try with another image.",
          variant: "destructive",
        });
      } else {
        setAnalysis(parsedAnalysis);
        toast({
          title: "Analysis Complete",
          description: `Found ${parsedAnalysis.length} ingredients in the image`,
        });
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setError('Analysis failed. Please try again.');
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

  // Simple fallback ingredients for testing
  const fallbackAnalysis = (): IngredientAnalysis[] => {
    return [
      {
        ingredient: "Sugar",
        harmScale: 8,
        diseases: ["Diabetes", "Obesity", "Heart disease"]
      },
      {
        ingredient: "Salt (Sodium Chloride)",
        harmScale: 6,
        diseases: ["Hypertension", "Cardiovascular issues"]
      }
    ];
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative w-full max-w-2xl mx-auto mb-6">
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
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => analyzeImage()}
          >
            Try Again
          </Button>
        </div>
      ) : analysis.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="w-24 text-center">Harm Scale</TableHead>
                <TableHead>Health Concerns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.ingredient}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-1 rounded text-sm ${
                        item.harmScale > 7
                          ? "bg-red-100 text-red-800"
                          : item.harmScale > 4
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.harmScale}/10
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.diseases && item.diseases.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {item.diseases.map((disease, idx) => (
                          <li key={idx}>{disease}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-400">No known concerns</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        // Fallback when no analysis is available but not in error state
        <div className="p-6 border rounded-md bg-gray-50 text-center">
          <p className="text-gray-500">No ingredients analyzed yet. Please try again.</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => analyzeImage()}
          >
            Retry Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default Analysis;
