import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/app/lib/supabase-server';
import { hasActiveSubscription } from '@/app/lib/subscription';

const styles = [
  {
    name: "Contemporain Minimaliste",
    prompt: "pure white surfaces, clean straight lines, minimalist Scandinavian design, light grey accents, hidden LED lighting, seamless built-in storage, matte finishes, monochromatic palette, geometric simplicity, negative space, handleless cabinets, floating furniture, ultra-modern yacht interior"
  },
  {
    name: "Méditerranéen Chic",
    prompt: "coastal blue and white palette, natural teak wood decking, nautical rope details, linen upholstery, woven rattan textures, brass maritime hardware, open airy atmosphere, French Riviera elegance, natural light, whitewashed wood, navy blue accents, terracotta pottery, Mediterranean yacht charter luxury"
  },
  {
    name: "Sportif & Automotive",
    prompt: "racing cockpit inspired, carbon fiber surfaces, red leather racing seats, automotive stitching, alcantara headliner, aluminum honeycomb panels, Formula 1 aesthetics, performance yacht design, matte black accents, racing harness details, sports car interior luxury, technical precision, Ferrari yacht collaboration style"
  },
  {
    name: "Luxe Classique Art Déco",
    prompt: "1920s Art Deco opulence, black marble veining, geometric gold inlays, champagne velvet upholstery, sunburst mirror motifs, Egyptian revival accents, Gatsby era luxury, glossy lacquered surfaces, crystal chandeliers, chevron patterns, mother-of-pearl details, Great Gatsby yacht party aesthetic, vintage luxury liner elegance"
  },
  {
    name: "Zen & Resort Spa",
    prompt: "Japanese zen minimalism, natural bamboo screens, river stone flooring, water feature integration, Asian resort spa luxury, warm wood tones, paper lantern lighting, organic cotton linens, meditation space tranquility, natural texture emphasis, sand and stone palette, Balinese resort yacht design, biophilic wellness sanctuary"
  }
];

function createOptimizedPrompt(styleName: string, styleKeywords: string, structDesc: string): string {
  return `
═══════════════════════════════════════════════════════════════
⚠️ CRITICAL INSTRUCTION: STRUCTURE PRESERVATION MODE ACTIVATED ⚠️
═══════════════════════════════════════════════════════════════

YOU ARE PERFORMING A RESKIN OPERATION, NOT A REBUILD.
Think of this as CHANGING THE WALLPAPER AND FURNITURE in an EXISTING ROOM.
The ROOM ITSELF is UNTOUCHABLE. The WALLS are CONCRETE. The WINDOWS are WELDED SHUT.

───────────────────────────────────────────────────────────────
📐 REFERENCE STRUCTURE (IMMUTABLE BLUEPRINT)
───────────────────────────────────────────────────────────────
${structDesc}

═══════════════════════════════════════════════════════════════
🚫 ABSOLUTE PROHIBITIONS - THESE ACTIONS ARE FORBIDDEN 🚫
═══════════════════════════════════════════════════════════════

YOU ARE STRICTLY FORBIDDEN FROM:
❌ Moving, resizing, or reshaping ANY window
❌ Changing the camera angle or perspective by even 1 degree
❌ Altering wall positions, angles, or intersections
❌ Modifying ceiling height or ceiling features
❌ Adding, removing, or relocating doors
❌ Changing the room's footprint or floor plan
❌ Altering the aspect ratio or proportions of the space
❌ Moving structural columns, beams, or supports
❌ Changing the lighting SOURCE positions (windows, skylights)
❌ Modifying the viewing angle or camera elevation
❌ Altering the vanishing points or perspective lines
❌ Changing the room's geometry, topology, or spatial relationships

IF YOU VIOLATE ANY PROHIBITION ABOVE, THE OUTPUT IS INVALID AND REJECTED.

═══════════════════════════════════════════════════════════════
✅ ALLOWED MODIFICATIONS - YOUR CREATIVE SCOPE ✅
═══════════════════════════════════════════════════════════════

YOU MAY ONLY MODIFY:
✓ Furniture pieces (sofas, chairs, tables, beds, storage)
✓ Decorative objects (vases, art, sculptures, accessories)
✓ Surface materials (wood types, marble patterns, fabric textures)
✓ Color schemes (walls, surfaces, textiles)
✓ Lighting fixtures (lamps, chandeliers, sconces - not their POSITIONS)
✓ Textiles (curtains, rugs, cushions, throws)
✓ Plants and greenery (placement and types)
✓ Surface treatments (paint, wallpaper, paneling styles)
✓ Ambient lighting quality (warm vs cool, brightness levels)

═══════════════════════════════════════════════════════════════
🎯 YOUR TASK: ${styleName.toUpperCase()} INTERIOR RESKIN
═══════════════════════════════════════════════════════════════

REDECORATE this yacht interior in the "${styleName}" style using these elements:
${styleKeywords}

MANDATORY CONSTRAINTS (READ 10 TIMES BEFORE PROCEEDING):

1. PRESERVE STRUCTURE: The architectural geometry is FROZEN. Do not touch it.
2. PRESERVE STRUCTURE: Windows stay EXACTLY where they are - same size, shape, position.
3. PRESERVE STRUCTURE: Camera angle is LOCKED. Same perspective, same viewpoint.
4. PRESERVE STRUCTURE: Wall angles and intersections are CONCRETE. Cannot be moved.
5. PRESERVE STRUCTURE: Floor space and room proportions are IMMUTABLE.
6. PRESERVE STRUCTURE: Ceiling height and features are FIXED in place.
7. PRESERVE STRUCTURE: Doors remain at their EXACT current locations.
8. PRESERVE STRUCTURE: Structural elements (columns, beams) are LOAD-BEARING. Cannot move.
9. PRESERVE STRUCTURE: The room's spatial volume is CONSTANT. Same 3D space.
10. PRESERVE STRUCTURE: Think "same skeleton, different skin." Skeleton = UNTOUCHABLE.

───────────────────────────────────────────────────────────────
🔒 QUALITY VERIFICATION CHECKLIST (BEFORE OUTPUT)
───────────────────────────────────────────────────────────────

Before generating the image, mentally verify:
□ Are windows in the EXACT same positions? (YES/NO) - Must be YES
□ Is the camera angle IDENTICAL? (YES/NO) - Must be YES
□ Are wall angles UNCHANGED? (YES/NO) - Must be YES
□ Is room size/proportion IDENTICAL? (YES/NO) - Must be YES
□ Did I only change FURNITURE and STYLE? (YES/NO) - Must be YES

If ANY answer is NO, you have FAILED the task. Start over.

───────────────────────────────────────────────────────────────
🎨 GENERATION PARAMETERS
───────────────────────────────────────────────────────────────

Style: ${styleName}
Quality: Photorealistic, 8K resolution, professional interior design render
Lighting: Match the natural light direction from existing windows (DO NOT move light sources)
Perspective: IDENTICAL to reference image (use same vanishing points)
Framing: IDENTICAL to reference image (same crop, same angle)

OUTPUT REQUIREMENTS:
- Photorealistic yacht interior image
- ${styleName} aesthetic applied to furniture, decor, materials, colors
- ZERO structural changes (verifiable by overlaying with original)
- Professional interior design quality
- Natural, yacht-appropriate lighting

───────────────────────────────────────────────────────────────
⚡ MENTAL MODEL: THE RESKIN METAPHOR
───────────────────────────────────────────────────────────────

Imagine you are a video game developer applying a new "texture pack" to an existing 3D model.
- The 3D MODEL (walls, windows, structure) = LOCKED, READ-ONLY
- The TEXTURES (materials, colors, objects) = EDITABLE

You CANNOT change the underlying geometry, only what's painted onto it.
You CANNOT move vertices, only change what color/material they are.
You CANNOT add/remove walls, only change what's ON the walls.

This is a REDECORATION project, not a RENOVATION project.
You are an INTERIOR DESIGNER, not an ARCHITECT.
You change AESTHETICS, not ARCHITECTURE.

═══════════════════════════════════════════════════════════════
⚠️ FINAL FAIL-SAFE: STRUCTURE PRESERVATION VERIFICATION ⚠️
═══════════════════════════════════════════════════════════════

After generation, if an independent observer overlaid your output with the reference image:
- Window outlines should ALIGN PERFECTLY (tolerance: 0%)
- Wall edges should ALIGN PERFECTLY (tolerance: 0%)
- Perspective lines should ALIGN PERFECTLY (tolerance: 0%)
- Room boundaries should ALIGN PERFECTLY (tolerance: 0%)

If alignment fails, your output is INVALID.

STRUCTURE PRESERVATION IS NOT OPTIONAL. IT IS THE PRIMARY OBJECTIVE.
Style application is SECONDARY to structure preservation.

When in doubt: PRESERVE STRUCTURE > Apply Style

NOW GENERATE THE IMAGE.
  `.trim();
}

// Force dynamic rendering - prevent static generation during build
export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type GeneratePayload = {
  imageBase64?: string;
  imageMimeType?: string;
};

const parseGeminiErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error?.message) {
        return String(parsed.error.message);
      }
    } catch {
      return error.message;
    }

    return error.message;
  }

  return 'Unknown error while generating images';
};

const isLeakedGeminiKeyError = (message: string): boolean =>
  /api key was reported as leaked/i.test(message);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined;

    // 1. Auth check
    const supabase = await createClient({ accessToken });
    const { data: { user }, error: authError } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // 2. Subscription check
    const hasSubscription = await hasActiveSubscription(accessToken);

    if (!hasSubscription) {
      return NextResponse.json(
        { error: 'Active subscription required', redirect: '/auth' },
        { status: 403 }
      );
    }

    // 3. Continue with image generation
    const { imageBase64, imageMimeType }: GeneratePayload = await request.json();

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const normalizedMimeType =
      typeof imageMimeType === 'string' ? imageMimeType.trim().toLowerCase() : 'image/jpeg';

    if (!ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
      return NextResponse.json(
        { error: `Unsupported image format: ${normalizedMimeType}. Use JPG, PNG, or WEBP.` },
        { status: 400 }
      );
    }

    const normalizedImageBase64 = imageBase64.replace(/\s/g, '');

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY environment variable' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });

    // Phase 1: Analyze structure
    const structurePrompt = `
      Analyze this yacht interior image.
      Describe ONLY the physical structure and geometry in extreme detail.
      Include:
      - Camera angle and perspective (e.g., wide angle, eye level).
      - Room shape and dimensions.
      - Window placement, shape, and size.
      - Ceiling height and features (beams, lighting).
      - Fixed structural elements (pillars, built-in stairs).
      DO NOT describe the furniture style, colors, or decor.
      Focus on the "shell" of the room.
    `;

    let structureDescription = 'Structure analysis unavailable; preserve geometry exactly.';
    try {
      const structureResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: structurePrompt },
          {
            inlineData: {
              data: normalizedImageBase64,
              mimeType: normalizedMimeType
            }
          }
        ]
      });

      structureDescription = structureResult.text || structureDescription;
    } catch (structureError) {
      console.error('[Generate] Structure analysis failed:', structureError);
    }

    // Phase 2: Generate styles
    const generatedImages = [];

    for (const style of styles) {
      const engineeredPrompt = createOptimizedPrompt(
        style.name,
        style.prompt,
        structureDescription
      );

      try {
        const result = await ai.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [
            { text: engineeredPrompt },
            {
              inlineData: {
                data: normalizedImageBase64,
                mimeType: normalizedMimeType
              }
            }
          ]
        });

        let generatedImageBase64 = null;

        if (result.candidates && result.candidates[0]?.content?.parts) {
          for (const part of result.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              generatedImageBase64 = part.inlineData.data;
              break;
            }
          }
        }

        let imageUrl;
        let mimeType = "image/jpeg";

        if (generatedImageBase64) {
          if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType) {
            mimeType = result.candidates[0].content.parts[0].inlineData.mimeType;
          }
          imageUrl = `data:${mimeType};base64,${generatedImageBase64}`;
        } else {
          // Fallback to original image
          imageUrl = `data:${normalizedMimeType};base64,${normalizedImageBase64}`;
        }

        generatedImages.push({
          style: style.name,
          prompt: engineeredPrompt,
          url: imageUrl,
          isFallback: !generatedImageBase64
        });

      } catch (e) {
        generatedImages.push({
          style: style.name,
          prompt: engineeredPrompt,
          url: `data:${normalizedMimeType};base64,${normalizedImageBase64}`,
          isFallback: true
        });
      }
    }

    return NextResponse.json({ images: generatedImages });

  } catch (error) {
    console.error('Error in /api/generate:', error);
    const detail = parseGeminiErrorMessage(error);
    const status = isLeakedGeminiKeyError(detail) ? 503 : 500;
    const errorMessage = isLeakedGeminiKeyError(detail)
      ? 'Gemini API key is disabled (reported leaked). Rotate GEMINI_API_KEY in Vercel.'
      : 'Image generation failed';

    return NextResponse.json(
      { error: errorMessage, detail },
      { status }
    );
  }
}
