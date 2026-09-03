import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, PlasticCategory } from "../types";

const processFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: [
        PlasticCategory.LDPE,
        PlasticCategory.HDPE,
        PlasticCategory.PET,
        PlasticCategory.PP,
        PlasticCategory.PVC,
        PlasticCategory.MLP,
        PlasticCategory.OTHER
      ],
      description: "The type of plastic detected in the image."
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 100."
    },
    thicknessMicrons: {
      type: Type.NUMBER,
      description: "Estimated thickness of the plastic in microns based on visual cues."
    },
    brickType: {
      type: Type.STRING,
      description: "The most suitable type of construction brick/paver for this specific plastic type."
    },
    mixRatio: {
      type: Type.OBJECT,
      description: "The mixture ratio required to make 1 unit of brick using this plastic.",
      properties: {
        plasticKg: { type: Type.NUMBER, description: "Amount of shredded plastic in Kg (base unit, usually 1 or proportional)." },
        soilKg: { type: Type.NUMBER, description: "Amount of soil required in Kg." },
        sandKg: { type: Type.NUMBER, description: "Amount of river sand/M-sand required in Kg." },
        cementKg: { type: Type.NUMBER, description: "Amount of cement required in Kg." }
      },
      required: ["plasticKg", "soilKg", "sandKg", "cementKg"]
    },
    reasoning: {
      type: Type.STRING,
      description: "Brief scientific explanation for the classification and mix ratio choice."
    },
    productionNote: {
      type: Type.STRING,
      description: "Crucial manufacturing instructions, safety warnings, or processing tips specific to this plastic type (e.g., melting temperature limits, shredding requirements, ventilation needs)."
    }
  },
  required: ["category", "confidence", "thicknessMicrons", "brickType", "mixRatio", "reasoning", "productionNote"]
};

export const analyzePlasticImage = async (file: File): Promise<AnalysisResult> => {
  // NOTE: In VS Code/Vite, ensure 'process.env.API_KEY' is defined in your config or .env file.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env file or environment configuration.");
  }

  const base64Image = await processFile(file);
  const ai = new GoogleGenAI({ apiKey });

  // Using gemini-2.5-flash for speed and multimodal capabilities
  const model = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type || "image/jpeg", // Default to jpeg if type is missing
              data: base64Image
            }
          },
          {
            text: `Analyze this image of plastic waste. 
            1. Identify the plastic category (LDPE, HDPE, PET, PP, PVC, MLP). Look at texture, transparency, and form factor.
            2. Visually estimate the thickness in microns.
            3. Recommend a suitable construction brick type (e.g., Plastone, Paver Block, Eco-Brick).
            4. Provide a realistic mix ratio (Plastic, Soil, Sand, Cement) for manufacturing this brick.
            5. Provide a critical "Production Note" regarding safety (e.g. fumes) or processing (e.g. melting point) for this specific plastic.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Sanitize markdown code blocks if present (fixes common JSON parse errors)
    const cleanText = text.replace(/```json\n?|```/g, '').trim();

    const result = JSON.parse(cleanText) as AnalysisResult;
    return result;
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    if (error.message?.includes("403") || error.message?.includes("API_KEY")) {
        throw new Error("Invalid or missing API Key. Please check your settings.");
    }
    throw new Error("Failed to analyze image. Ensure the image is clear and try again.");
  }
};