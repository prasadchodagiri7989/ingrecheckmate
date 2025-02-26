
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the new recommended model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get base64 data from the image string
    const imageBase64 = imageData.split(",")[1];

    const result = await model.generateContent([
      {
        text: "Analyze this food packaging image and list all ingredients. For each ingredient provide:\n1. Ingredient name followed by colon\n2. Harm Scale (1-10, 10 being most harmful)\n3. Potential diseases or health concerns associated with excessive consumption\n\nFormat each ingredient as:\nIngredient Name:\nHarm Scale: X/10\nPotential Health Concerns: disease1, disease2, etc."
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
