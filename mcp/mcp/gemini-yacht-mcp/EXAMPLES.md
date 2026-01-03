# Usage Examples - Gemini Yacht MCP Server

Complete examples demonstrating all tools with realistic scenarios.

## Table of Contents

- [Basic Workflow](#basic-workflow)
- [Tool Examples](#tool-examples)
  - [analyze_structure](#1-analyze_structure)
  - [generate_style](#2-generate_style)
  - [generate_all](#3-generate_all)
  - [list_styles](#4-list_styles)
- [Advanced Usage](#advanced-usage)
- [Integration Examples](#integration-examples)

---

## Basic Workflow

### Complete Redesign Process

```
User: I have a yacht interior photo. Please analyze it and show me
      how it would look in a Futuristic style.

Claude: I'll help you redesign this yacht interior. Let me start by
        analyzing the structure, then generate the futuristic version.

[Claude calls: analyze_structure(image=base64_data)]
[Claude calls: generate_style(image=base64_data, structure="...", style="futuristic")]

Claude: Here's your yacht interior transformation:

**Original Structure Analysis:**
- Modern luxury master suite with curved panoramic windows
- 12-foot ceiling with recessed lighting
- King-size bed platform with under-storage
- Neutral color palette (beige, cream, light wood)

**Futuristic Transformation:**
Your yacht interior has been reimagined with sleek, high-tech aesthetics...
[Full description of transformation]
```

---

## Tool Examples

### 1. analyze_structure

Detailed architectural analysis of yacht interiors.

#### Example 1: Basic Analysis

**Input:**
```python
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

**Claude Code Usage:**
```
Analyze the structure of this yacht interior image [attach image]
```

**Output:**
```json
{
  "description": "Contemporary luxury yacht master suite featuring a curved wall design that follows the vessel's hull contours. The space measures approximately 15x12 feet with a dramatic 12-foot ceiling height. A king-size bed is positioned centrally on a raised platform with integrated under-bed storage. The starboard wall features floor-to-ceiling panoramic windows offering 180-degree ocean views. Built-in wardrobes with glossy white lacquer finish line the port wall. Flooring consists of engineered teak planks in a herringbone pattern.",

  "key_features": [
    "Curved panoramic windows spanning entire starboard wall (180° view)",
    "Raised king-size bed platform (8 inches high) with hydraulic storage",
    "12-foot vaulted ceiling with curved transitions",
    "Built-in wardrobes (8 feet tall) with push-to-open mechanisms",
    "Recessed LED ceiling strips following ceiling curves",
    "Teak herringbone flooring with non-slip coating",
    "Integrated bedside tables with wireless charging pads"
  ],

  "geometry_notes": "Asymmetrical layout adapting to hull curvature. The room narrows toward the bow (forward section) creating a tapered effect. Ceiling follows the hull's arc, rising from 10 feet at the forward bulkhead to 12 feet at center. No 90-degree corners - all wall intersections are curved (minimum 6-inch radius). Bed platform aligned perpendicular to centerline, maximizing window exposure. Traffic flow designed around bed with 3-foot clearance on sides.",

  "lighting_analysis": "Primary natural light source: expansive starboard windows providing strong daylight from sunrise to mid-afternoon. Artificial lighting consists of: (1) Recessed LED strips in ceiling coves (3000K, dimmable), (2) Under-bed accent lighting (RGB, color-changeable), (3) Wardrobe interior LED strips (4000K, motion-activated), (4) Reading lights integrated into headboard (adjustable warm-cool). Overall ambient lighting quality: warm and intimate with excellent dimming control. No visible harsh shadows; lighting design emphasizes soft, diffused illumination."
}
```

#### Example 2: Analysis with Options

**Input:**
```python
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "options": {
    "focus_areas": "materials, color palette, storage solutions",
    "detail_level": "high"
  }
}
```

**Output includes enhanced detail in requested areas:**
```json
{
  "description": "...with particular attention to material selection...",
  "key_features": [
    "Glossy white lacquer wardrobes (high-gloss polyurethane finish, 95% reflectivity)",
    "Teak engineered flooring (Burmese teak veneer, 4mm thickness, UV-cured finish)",
    "Cream leather headboard (full-grain Italian leather, aniline-dyed)",
    ...
  ],
  ...
}
```

---

### 2. generate_style

Transform yacht interior to specific design style.

#### Example 1: Futuristic Style

**Input:**
```python
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "structure_description": "Contemporary luxury yacht master suite featuring curved walls...",
  "style": "futuristic"
}
```

**Claude Code Usage:**
```
Transform this yacht interior to Futuristic style, preserving the
curved walls and window layout from the analysis above.
```

**Output:**
```json
{
  "generated_image": "[DESCRIPTION]\n\nThe transformed futuristic yacht interior features...",

  "style": "futuristic",

  "description": "The master suite has been transformed into a sleek, high-tech sanctuary. The curved walls are now finished in glossy white composite panels with seamless joints, giving a monolithic appearance. Integrated LED strips (cool white, 5000K) run along every edge where wall meets ceiling, creating a floating effect. \n\nThe bed platform is now a low-profile design (4 inches high) in brushed titanium with built-in levitation-style LED underlighting in electric blue. The mattress appears to float on a cushion of light. Bedding is pure white with subtle geometric quilting patterns.\n\nThe panoramic windows retain their size but now feature smart glass with variable tinting controlled via touch panels. Thin chrome mullions divide the glass into a geometric grid pattern.\n\nFlooring has been replaced with large-format porcelain tiles (3x3 feet) in glossy white with mirror-like finish. Embedded fiber optic points create a starfield effect.\n\nWardrobes are now flush with walls, invisible when closed, with touch-sensitive panels that glow blue when approached. Interior lighting is motion-activated cool white LEDs.\n\nCeiling features a central holographic projection area capable of displaying star maps or abstract patterns. Recessed speakers provide invisible surround sound.\n\nColor palette: 80% white, 15% metallic silver/chrome, 5% electric blue accent lighting. The overall effect is minimalist, tech-forward, and reminiscent of a luxury spacecraft."
}
```

#### Example 2: Mediterranean Style

**Input:**
```python
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "structure_description": "Contemporary luxury yacht master suite...",
  "style": "mediterranean"
}
```

**Output:**
```json
{
  "generated_image": "[DESCRIPTION]\n\nThe Mediterranean-transformed interior radiates coastal warmth...",

  "style": "mediterranean",

  "description": "The master suite now embodies the relaxed elegance of a Greek island villa. Curved walls are finished in textured white plaster (Venetian stucco technique) with subtle imperfections that catch light beautifully. The ceiling is painted in soft sky blue with white-painted wooden beams (faux beams maintaining ceiling height).\n\nThe bed platform is rebuilt in distressed pine wood with a weathered gray-white finish. Bedding features blue-and-white striped linens with decorative pillows in azure, terracotta, and cream. A woven jute rug (8x10 feet) anchors the bed area.\n\nPanoramic windows retain their structure but are framed with flowing white linen curtains (sheer) that billow gently. Window frames are painted in soft azure blue.\n\nFlooring is now terracotta tile (12x12 inches, hand-glazed) in warm orange-red tones with natural variation. Tiles have a matte finish with slight texture.\n\nWardrobes are refaced with whitewashed wood panels and wrought iron hardware (black iron handles and hinges with decorative scrollwork). Open shelving displays blue-and-white ceramic pottery.\n\nLighting includes wrought iron wall sconces with frosted glass shades, a woven rope pendant light over the bed area, and table lamps with ceramic bases in traditional Greek patterns.\n\nDecorative elements: potted olive tree in corner, rope-wrapped nautical accents, seashells in glass vessels, embroidered throw pillows.\n\nColor palette: White (50%), azure blue (20%), terracotta (15%), warm wood tones (10%), accent colors (5%). The space feels airy, inviting, and connected to the sea."
}
```

#### Example 3: Cyberpunk Style

**Input:**
```python
{
  "style": "cyberpunk"
}
```

**Output:**
```json
{
  "description": "The master suite has been transformed into a high-tech dystopian luxury space. Curved walls are now matte black metal panels with visible rivets and panel joints, creating an industrial aesthetic. Neon tubes (hot pink and cyan) run along wall edges and ceiling intersections, casting dramatic colored light.\n\nThe bed platform is industrial-style black steel framework with exposed bolt construction. The mattress sits on a wire mesh base with under-bed LED strips (RGB, cycling through pink-cyan-purple). Bedding is black with geometric neon patterns.\n\nPanoramic windows are tinted dark gray, almost black, with thin neon pink trim along frames. Holographic advertisements or cityscapes can be projected onto the glass.\n\nFlooring is black rubber with raised grid pattern for grip. Fiber optic cables run along floor edges as design elements (glowing cyan).\n\nWardrobes are industrial metal lockers (gunmetal gray) with digital keypad locks that glow purple. Exposed conduit and cable runs decorate the walls as intentional design elements.\n\nMultiple screens (various sizes) are mounted on walls displaying: digital art, code streams, security feeds, or environmental data. All screens have CRT-style scan lines for retro-future aesthetic.\n\nCeiling has exposed ventilation ducts (black metal) with steam/fog effect generators creating atmospheric haze. LED strips behind ducts create backlit effects in pink and cyan.\n\nColor palette: Black base (60%), neon pink (15%), cyan blue (15%), purple accents (5%), gunmetal gray (5%). The space feels edgy, tech-saturated, and dystopian-luxe—like a penthouse in Blade Runner's Los Angeles."
}
```

---

### 3. generate_all

Complete workflow: analyze + generate all 5 styles.

#### Example: Full Redesign Suite

**Input:**
```python
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Claude Code Usage:**
```
Show me this yacht interior in all available design styles.
```

**Output:**
```json
{
  "structure_analysis": "Contemporary luxury yacht master suite featuring curved wall design following hull contours. Space measures approximately 15x12 feet with 12-foot ceiling height...",

  "styles": {
    "futuristic": {
      "generated_image": "[DESCRIPTION]\nSleek high-tech sanctuary with glossy white walls...",
      "style": "futuristic",
      "description": "Monolithic white surfaces with LED edge lighting..."
    },

    "artdeco": {
      "generated_image": "[DESCRIPTION]\nGlamorous 1920s elegance with geometric patterns...",
      "style": "artdeco",
      "description": "Rich ebony wood paneling with brass inlays creating chevron patterns. Ceiling features sunburst motif in gold leaf. Bed platform in exotic zebrawood with curved Art Deco headboard upholstered in emerald velvet. Windows framed in polished brass with geometric muntins. Flooring is black marble with gold veining. Mirrored wardrobe doors with frosted glass panels etched with geometric designs. Lighting from geometric chandeliers and wall sconces with frosted glass shades. Color palette: black, gold, emerald green, cream, burgundy accents."
    },

    "biophilic": {
      "generated_image": "[DESCRIPTION]\nNature-immersed sanctuary with living plant wall...",
      "style": "biophilic",
      "description": "Curved walls feature vertical living plant wall (ferns, pothos, moss) maintained by integrated irrigation. Ceiling in natural teak with exposed wood grain. Bed platform is live-edge oak slab with organic curves, bedding in natural linen and cotton (sage green, cream). Windows frameless to maximize nature views. Flooring is wide-plank oak with matte finish. Wardrobes in natural walnut with woven rattan door panels. Potted plants throughout: small trees, hanging plants, succulents. Water feature (small fountain) in corner. Lighting maximizes natural light; artificial lights are warm LED in wood fixtures. Color palette: forest green, terracotta, sand, sky blue, natural wood tones."
    },

    "mediterranean": {
      "generated_image": "[DESCRIPTION]\nCoastal elegance with white plaster and azure accents...",
      "style": "mediterranean",
      "description": "Textured white plaster walls with hand-applied Venetian stucco. Soft blue ceiling with white beams. Distressed pine bed in weathered gray-white, blue-white striped linens. Windows with sheer white curtains, azure blue frames. Terracotta tile flooring (12x12, hand-glazed). Whitewashed wood wardrobes with wrought iron hardware. Rope-wrapped pendant lights, ceramic lamps with Greek patterns. Decorative elements: potted olive tree, nautical rope, blue-white pottery. Color palette: white, azure blue, terracotta, warm wood, natural accents."
    },

    "cyberpunk": {
      "generated_image": "[DESCRIPTION]\nDystopian luxury with neon and industrial elements...",
      "style": "cyberpunk",
      "description": "Matte black metal walls with visible rivets and neon tubes (pink/cyan). Industrial steel bed frame with wire mesh, RGB LED under-lighting. Dark tinted windows with neon pink trim. Black rubber grid flooring with glowing fiber optic edges. Metal locker wardrobes with digital locks. Multiple screens displaying code/art. Exposed ducts with fog effects. LED backlighting in pink/cyan. Color palette: black base, neon pink, cyan, purple accents, gunmetal gray."
    }
  }
}
```

**Token-efficient summary:**
All 5 style transformations complete with detailed descriptions preserving the original architectural structure while applying distinct aesthetic treatments.

---

### 4. list_styles

Catalog of available design styles.

#### Example: Browse Styles

**Input:** (none)

**Claude Code Usage:**
```
What design styles are available for yacht interiors?
```

**Output:**
```json
[
  {
    "name": "futuristic",
    "display_name": "Futuristic",
    "description": "Sleek, high-tech design inspired by sci-fi and space exploration. Features minimalist forms, integrated technology, and a sophisticated color palette.",
    "characteristics": [
      "Glossy white and metallic surfaces",
      "Integrated LED lighting systems",
      "Minimalist geometric furniture",
      "Smart technology integration",
      "Clean lines and aerodynamic curves",
      "Transparent acrylic and glass elements"
    ]
  },
  {
    "name": "artdeco",
    "display_name": "Art Deco",
    "description": "Glamorous 1920s-1930s elegance with bold geometric patterns, luxurious materials, and rich colors. Evokes the golden age of ocean liner travel.",
    "characteristics": [
      "Exotic woods and polished marble",
      "Geometric patterns (chevrons, sunbursts)",
      "Rich jewel tones with gold/brass accents",
      "Luxurious velvet and leather upholstery",
      "Symmetrical compositions",
      "Mirrored and lacquered surfaces"
    ]
  },
  {
    "name": "biophilic",
    "display_name": "Biophilic",
    "description": "Nature-inspired design that brings the outdoors inside. Emphasizes natural materials, living plants, and organic forms for wellness and tranquility.",
    "characteristics": [
      "Living plant walls and greenery",
      "Natural wood and stone materials",
      "Earth tone color palette",
      "Organic curved shapes",
      "Maximized natural light",
      "Water features and natural textures"
    ]
  },
  {
    "name": "mediterranean",
    "display_name": "Mediterranean",
    "description": "Relaxed coastal elegance inspired by Greek islands and Italian riviera. Features whitewashed surfaces, azure blues, and nautical touches.",
    "characteristics": [
      "White/cream with azure blue accents",
      "Terracotta tiles and natural stone",
      "Rustic wooden furniture",
      "Nautical and maritime decorations",
      "Wrought iron fixtures",
      "Mediterranean tile patterns"
    ]
  },
  {
    "name": "cyberpunk",
    "display_name": "Cyberpunk",
    "description": "High-tech meets dystopian luxury. Dark industrial aesthetics with vibrant neon accents, exposed technology, and urban edge.",
    "characteristics": [
      "Dark base with neon pink/cyan accents",
      "Exposed cables and industrial elements",
      "Multiple screens and tech integration",
      "Neon tube lighting",
      "Grid patterns and metallic surfaces",
      "Dystopian luxury aesthetic"
    ]
  }
]
```

---

## Advanced Usage

### Chaining Tools in Conversation

```
User: I want to see my yacht interior in different styles, but I'm
      particularly interested in eco-friendly options.

Claude: I'll analyze your yacht and focus on nature-inspired styles.

[Calls: analyze_structure(image)]
[Calls: list_styles()]
[Identifies "biophilic" as eco-friendly option]
[Calls: generate_style(style="biophilic")]

Claude: Based on your interest in eco-friendly design, I recommend
        the Biophilic style, which emphasizes:
        - Living plants and natural materials
        - Sustainable wood and stone
        - Non-toxic finishes

        Here's how your yacht would look: [description]

        Would you also like to see the Mediterranean style, which
        also uses natural materials?
```

### Batch Processing Multiple Images

```python
# Python script for batch processing
import asyncio
from handlers.tools import generate_all_styles

async def batch_process(images):
    tasks = [generate_all_styles(img) for img in images]
    results = await asyncio.gather(*tasks)
    return results

# Process 5 yacht interiors
results = asyncio.run(batch_process([img1, img2, img3, img4, img5]))
```

---

## Integration Examples

### Integration with YachtGenius Next.js App

```typescript
// app/api/yacht-redesign/route.ts
export async function POST(request: Request) {
  const { image } = await request.json();

  // Call MCP server via Claude Code API
  const response = await fetch('claude-mcp://gemini-yacht/generate_all', {
    method: 'POST',
    body: JSON.stringify({ image }),
  });

  const results = await response.json();

  return Response.json(results);
}
```

### Custom Workflow with Error Handling

```python
async def safe_redesign(image: str, preferred_style: str):
    """Safe redesign workflow with fallbacks."""
    try:
        # Try preferred style
        result = await generate_yacht_style(
            image=image,
            structure_description="",  # Auto-analyze if empty
            style=preferred_style
        )
        return result

    except GeminiClientError as e:
        # Fallback to simpler analysis
        logger.warning(f"Generation failed: {e}. Falling back to analysis.")
        return await analyze_yacht_structure(image)

    except Exception as e:
        # Ultimate fallback
        logger.error(f"All operations failed: {e}")
        return {"error": str(e), "fallback": "list_styles"}
```

---

## Performance Tips

1. **Image Size**: Resize images to max 2048px before sending to reduce processing time
2. **Batch Generation**: Use `generate_all` instead of 5 separate `generate_style` calls
3. **Timeout Configuration**: Increase `GEMINI_TIMEOUT` for high-resolution images
4. **Caching**: Store structure analysis to reuse for multiple style generations

---

Built with FastMCP for YachtGenius.
