import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ASCIIText from './ASCIIText';
import './App.css';

function App() {
  const [step, setStep] = useState('landing'); // landing, upload, processing, results
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [analysisLog, setAnalysisLog] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Access the API key
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    if (!GEMINI_API_KEY) {
      console.error("Missing VITE_GEMINI_API_KEY in .env file");
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        // Extract base64 data (remove "data:image/jpeg;base64," prefix)
        const base64Data = e.target.result.split(',')[1];
        setImageBase64(base64Data);
        setStep('upload');
        setAnalysisLog([]); // Reset log
      };
      reader.readAsDataURL(file);
    }
  };

  const addToLog = (message) => {
    setAnalysisLog(prev => [...prev, message]);
  };

  const generateInteriors = async () => {
    setStep('processing');
    setIsAnalyzing(true);
    addToLog("Initializing Nano Banana Pro (Gemini 3 Pro Image)...");

    try {
      // 1. Initialize Google GenAI (nouveau SDK)
      const ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY
      });

      addToLog("Scanning image geometry with Gemini 2.5 Flash...");

      // 2. Analyze the image structure with Gemini 2.5 Flash (Phase 1)
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

      const structureResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: structurePrompt },
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          }
        ]
      });

      const structureDescription = structureResult.text || "Structure analysis completed";
      addToLog("Structure extracted: " + structureDescription.slice(0, 100) + "...");

      // 3. Generate Prompts for each style (Prompt Engineering Phase 2)
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

      addToLog("Constructing style-specific prompts...");

      const newImages = [];

      for (const style of styles) {
        addToLog(`Generating ${style.name} with Nano Banana Pro...`);

        // Créer le prompt ULTRA-STRICT avec 15 techniques de préservation
        const createOptimizedPrompt = (styleName, styleKeywords, structDesc) => {
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
        };

        const engineeredPrompt = createOptimizedPrompt(
          style.name,
          style.prompt,
          structureDescription
        );

        try {
          // Utiliser Nano Banana Pro (gemini-3-pro-image-preview) pour image-to-image
          const result = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview", // Nano Banana Pro
            contents: [
              { text: engineeredPrompt },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: "image/jpeg"
                }
              }
            ]
          });

          // Silent mode - no console logs during processing

          let generatedImageBase64 = null;

          // Chercher l'image dans la réponse
          if (result.candidates && result.candidates[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                generatedImageBase64 = part.inlineData.data;
                addToLog(`✅ ${style.name} generated successfully!`);
                break;
              }
            }
          }

          let imageUrl;
          let mimeType = "image/jpeg";

          if (generatedImageBase64) {
            // Détecter le type MIME
            if (result.candidates[0].content.parts[0].inlineData?.mimeType) {
              mimeType = result.candidates[0].content.parts[0].inlineData.mimeType;
            }
            imageUrl = `data:${mimeType};base64,${generatedImageBase64}`;
          } else {
            // Fallback to original image silently
            imageUrl = selectedImage;
          }

          newImages.push({
            style: style.name,
            prompt: engineeredPrompt,
            url: imageUrl,
            isFallback: !generatedImageBase64
          });

        } catch (e) {
          // Silent error handling - fallback to original image
          newImages.push({
            style: style.name,
            prompt: engineeredPrompt,
            url: selectedImage,
            isFallback: true
          });
        }
      }

      setGeneratedImages(newImages);
      setStep('results');
      setIsAnalyzing(false);

    } catch (error) {
      console.error("Error generating interiors:", error);
      addToLog("Error: " + error.message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <div className="logo">YachtGenius</div>
        <div className="powered-by">POWERED BY NANO BANANA</div>
      </nav>

      <main className="main-content">
        {step === 'landing' && (
          <div className="hero-section">
            <h1 className="hero-title">
              Redesign Your <br />
              <span className="highlight">Yacht Interior</span>
            </h1>
            <p className="hero-subtitle">
              Experience the future of marine design. Upload your interior and let our
              Nano Banana AI generate 5 distinct, proportion-perfect styles instantly.
            </p>

            <div className="upload-container">
              <label htmlFor="file-upload" className="btn-gold upload-btn">
                Initiate Sequence
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="preview-section">
            <div className="preview-inner">
              <h2>Confirm Input Data</h2>
              <div className="image-preview-wrapper">
                <div className="scanner-line"></div>
                <img src={selectedImage} alt="Original Interior" className="preview-image" style={{ width: '100%', display: 'block' }} />
              </div>
              <div className="actions">
                <button className="btn-primary" onClick={() => setStep('landing')}>Abort</button>
                <button className="btn-gold" onClick={generateInteriors}>Execute Redesign</button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="processing-section">
            <ASCIIText
              text="NANO BANANA"
              asciiFontSize={6}
              textFontSize={120}
              textColor="#D4AF37"
              planeBaseHeight={6}
              enableWaves={true}
            />
            <div className="processing-status">
              <p className="processing-text">Redesigning yacht interior...</p>
              <p className="processing-subtext">Generating {generatedImages.length + 1}/5 styles</p>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="results-section">
            <div className="results-header">
              <h2>Design Matrix Complete</h2>
              <button className="btn-primary" onClick={() => setStep('landing')}>New Sequence</button>
            </div>

            <div className="gallery-grid">
              {generatedImages.map((item, index) => (
                <div key={index} className="gallery-item">
                  <img src={item.url} alt={item.style} />
                  <div className="style-info">
                    <div className="style-label">{item.style}</div>
                    <div className="prompt-preview" title={item.prompt}>
                      PROMPT: {item.prompt.slice(0, 60)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
