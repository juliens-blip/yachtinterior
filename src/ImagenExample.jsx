/**
 * IMAGEN 3 EXAMPLE - Génération d'images avec Google AI Studio
 *
 * Ce fichier montre comment utiliser Imagen 3 avec votre clé API existante.
 * Imagen 3 est maintenant disponible via Google AI Studio !
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Votre clé API (la même que pour Gemini)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Fonction pour générer des images avec Imagen 3
 *
 * @param {string} prompt - Description de l'image à générer
 * @param {string} imageBase64 - Image de référence (optionnel pour image-to-image)
 * @returns {Promise<string>} - URL de l'image générée en base64
 */
export async function generateWithImagen3(prompt, imageBase64 = null) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // ⚠️ Note: Imagen 3 a un nom de modèle différent
    // Essayons d'abord avec le modèle image-generation
    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-001"
      // Ou peut-être: "imagegeneration@006"
    });

    // Construction de la requête
    const request = imageBase64
      ? {
          // Image-to-image (édition)
          prompt: prompt,
          image: {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          },
          // Paramètres Imagen
          aspectRatio: "16:9",
          numberOfImages: 1,
          mode: "edit" // Mode édition pour préserver la structure
        }
      : {
          // Text-to-image (génération pure)
          prompt: prompt,
          aspectRatio: "16:9",
          numberOfImages: 1
        };

    const result = await model.generateContent(request);
    const response = await result.response;

    // Extraire l'image générée
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data; // Retourne base64
        }
      }
    }

    throw new Error("Aucune image générée dans la réponse");

  } catch (error) {
    console.error("Erreur Imagen 3:", error);
    throw error;
  }
}

/**
 * Fonction pour YachtGenius - Redesigner un intérieur
 */
export async function redesignYachtInterior(
  imageBase64,
  structureDescription,
  stylePrompt
) {
  const fullPrompt = `
    Photorealistic yacht interior redesign.

    STRUCTURAL CONSTRAINTS (DO NOT CHANGE):
    ${structureDescription}

    REDESIGN STYLE:
    ${stylePrompt}

    REQUIREMENTS:
    - Maintain exact camera angle and perspective
    - Keep window positions, shapes, and sizes identical
    - Preserve room dimensions and ceiling height
    - Keep all fixed structural elements
    - ONLY change: furniture, materials, lighting, colors, decor
    - Output: 8K quality, photorealistic interior design render
    - The result MUST look like the SAME boat cabin, just redecorated
  `;

  return await generateWithImagen3(fullPrompt, imageBase64);
}

/**
 * EXEMPLE D'UTILISATION
 */
export async function exampleUsage() {
  // 1. Charger une image
  const imageBase64 = "..."; // Votre image en base64

  // 2. Analyser la structure avec Gemini
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const structurePrompt = `
    Analyze this yacht interior image.
    Describe ONLY the physical structure in extreme detail:
    camera angle, room shape, window positions, ceiling height, structural elements.
  `;

  const structureResult = await geminiModel.generateContent([
    structurePrompt,
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" }}
  ]);

  const structureDescription = structureResult.response.text();

  // 3. Générer avec Imagen 3
  const stylePrompt = "Futuristic minimalist with sleek white curves and neon accents";

  const generatedImageBase64 = await redesignYachtInterior(
    imageBase64,
    structureDescription,
    stylePrompt
  );

  // 4. Utiliser l'image
  const imageUrl = `data:image/jpeg;base64,${generatedImageBase64}`;
  return imageUrl;
}
