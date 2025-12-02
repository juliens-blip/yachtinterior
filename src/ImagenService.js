/**
 * IMAGEN 3 SERVICE - Génération d'images avec Google AI Studio
 *
 * Documentation officielle:
 * https://ai.google.dev/gemini-api/docs/imagen
 * https://developers.googleblog.com/en/imagen-3-arrives-in-the-gemini-api/
 *
 * ⚠️ Note: Imagen 3 est disponible pour les utilisateurs payants en premier
 */

import { GoogleGenAI } from "@google/genai";

// Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Initialiser le client Google GenAI
 */
function initializeGenAI() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  }

  return new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });
}

/**
 * Générer une image avec Imagen 3 (Text-to-Image)
 *
 * @param {string} prompt - Description de l'image à générer
 * @param {Object} options - Options de génération
 * @returns {Promise<string>} - URL de l'image générée (base64)
 */
export async function generateImageFromText(prompt, options = {}) {
  try {
    const genAI = initializeGenAI();

    // Appeler Imagen 3
    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002"
    });

    const result = await model.generateContent({
      prompt: prompt,
      numberOfImages: options.numberOfImages || 1,
      aspectRatio: options.aspectRatio || "16:9",
      // Autres options Imagen 3
      negativePrompt: options.negativePrompt || "",
      guidanceScale: options.guidanceScale || 7.5
    });

    // Extraire l'image générée
    const response = await result.response;
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data; // Retourne base64
        }
      }
    }

    throw new Error("No image generated in response");

  } catch (error) {
    console.error("❌ Imagen 3 Error:", error);

    // Gérer les erreurs spécifiques
    if (error.message.includes("403") || error.message.includes("permission")) {
      throw new Error("Imagen 3 access denied. Make sure you have a paid API key.");
    }

    if (error.message.includes("model not found")) {
      throw new Error("Imagen 3 model not available. Check model name or API access.");
    }

    throw error;
  }
}

/**
 * Éditer une image avec Imagen 3 (Image-to-Image)
 *
 * @param {string} prompt - Description des modifications
 * @param {string} imageBase64 - Image source en base64
 * @param {Object} options - Options d'édition
 * @returns {Promise<string>} - URL de l'image modifiée (base64)
 */
export async function editImage(prompt, imageBase64, options = {}) {
  try {
    const genAI = initializeGenAI();

    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002"
    });

    const result = await model.generateContent({
      prompt: prompt,
      image: {
        inlineData: {
          data: imageBase64,
          mimeType: options.mimeType || "image/jpeg"
        }
      },
      numberOfImages: 1,
      aspectRatio: options.aspectRatio || "16:9",
      // Contrôle la préservation de la structure (0 = tout changer, 1 = tout garder)
      editMode: "INPAINTING", // ou "OUTPAINTING", "PRODUCT"
      maskMode: options.maskMode || "BACKGROUND", // Zone à modifier
      guidanceScale: options.guidanceScale || 7.5
    });

    const response = await result.response;
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No edited image in response");

  } catch (error) {
    console.error("❌ Imagen 3 Edit Error:", error);
    throw error;
  }
}

/**
 * FONCTION PRINCIPALE - Redesigner un intérieur de yacht
 *
 * @param {string} imageBase64 - Image originale du yacht
 * @param {string} structureDescription - Description de la structure (de Gemini)
 * @param {string} styleName - Nom du style (ex: "Futuristic Minimalist")
 * @param {string} stylePrompt - Description du style
 * @returns {Promise<Object>} - Résultat avec image et metadata
 */
export async function redesignYachtInterior(
  imageBase64,
  structureDescription,
  styleName,
  stylePrompt
) {
  try {
    console.log(`🎨 Generating ${styleName} with Imagen 3...`);

    // Construire le prompt optimisé pour Imagen 3
    const fullPrompt = `
Professional yacht interior design render.

STRUCTURAL CONSTRAINTS TO PRESERVE:
${structureDescription}

TARGET STYLE: ${styleName}
${stylePrompt}

REQUIREMENTS:
- Maintain exact camera angle and perspective
- Keep all window positions, shapes, and sizes identical
- Preserve room dimensions and architectural structure
- Keep ceiling height and structural beams
- ONLY modify: furniture, materials, colors, lighting, decorative elements
- Style: ${styleName.toLowerCase()} aesthetic
- Quality: Photorealistic, 8K interior design visualization
- The result must look like the SAME yacht cabin, professionally redecorated

Negative prompt: distorted geometry, changed windows, different room shape, unrealistic proportions
    `.trim();

    // Générer avec Imagen 3 (mode édition)
    const generatedImageBase64 = await editImage(fullPrompt, imageBase64, {
      guidanceScale: 8.5, // Plus élevé = suit mieux le prompt
      aspectRatio: "16:9"
    });

    return {
      success: true,
      imageBase64: generatedImageBase64,
      imageUrl: `data:image/jpeg;base64,${generatedImageBase64}`,
      style: styleName,
      prompt: fullPrompt,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Failed to generate ${styleName}:`, error);

    return {
      success: false,
      error: error.message,
      style: styleName,
      fallbackToOriginal: true
    };
  }
}

/**
 * TEST FUNCTION - Vérifier si Imagen 3 est accessible
 */
export async function testImagen3Access() {
  try {
    console.log("🧪 Testing Imagen 3 access...");

    const testPrompt = "A simple red cube on a white background, photorealistic, 3D render";
    const testImage = await generateImageFromText(testPrompt);

    console.log("✅ Imagen 3 is ACCESSIBLE with your API key!");
    return {
      accessible: true,
      imageBase64: testImage
    };

  } catch (error) {
    console.error("❌ Imagen 3 is NOT accessible:", error.message);

    return {
      accessible: false,
      error: error.message,
      suggestion: error.message.includes("403")
        ? "Upgrade to a paid API key to access Imagen 3"
        : "Check model availability or API configuration"
    };
  }
}
