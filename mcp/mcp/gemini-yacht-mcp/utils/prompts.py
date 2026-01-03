"""
Prompt templates for Gemini API interactions.

Contains all prompts used for yacht interior analysis and generation.
"""

from models.schemas import YachtStyle

# Analysis prompt for structural understanding
ANALYSIS_PROMPT = """You are an expert yacht interior architect and designer. Analyze this yacht interior image in extreme detail.

Provide a comprehensive analysis covering:

1. **Architectural Structure**:
   - Room dimensions and spatial proportions
   - Wall angles, curves, and geometric features
   - Ceiling height and design
   - Floor layout and materials
   - Built-in furniture and fixtures
   - Structural constraints (windows, doors, load-bearing elements)

2. **Key Features**:
   - Notable architectural elements
   - Existing furniture and their positions
   - Decorative elements
   - Functional zones (sleeping, working, storage, etc.)

3. **Geometry & Layout**:
   - Spatial flow and circulation
   - Symmetry or asymmetry
   - Perspective and viewpoint
   - Depth and layering of spaces

4. **Lighting Analysis**:
   - Natural light sources (windows, skylights)
   - Artificial lighting fixtures and types
   - Light quality and distribution
   - Shadows and ambient lighting

Return your analysis in a structured format with clear sections. Be precise and technical - this will be used to guide image generation while preserving architectural integrity."""


# Style-specific generation prompts
STYLE_GENERATION_PROMPTS = {
    YachtStyle.FUTURISTIC: """Transform this yacht interior into a FUTURISTIC design while preserving its exact architectural structure.

**CRITICAL CONSTRAINTS**:
- Maintain ALL architectural elements: {structure_description}
- Preserve room dimensions, wall angles, ceiling height, and floor layout
- Keep window/door positions and sizes identical
- Respect all structural constraints

**FUTURISTIC STYLE GUIDELINES**:
- **Materials**: Glossy white surfaces, brushed metal (chrome, titanium), transparent acrylic, carbon fiber accents
- **Furniture**: Sleek, minimalist forms with LED integration, floating furniture, modular pieces
- **Lighting**: Integrated LED strips (blue/white tones), backlit panels, fiber optic ceiling stars, smart ambient lighting
- **Colors**: White, silver, electric blue, black accents, neon highlights
- **Technology**: Touch panels, holographic displays, hidden compartments with motorized reveals
- **Textures**: High-gloss, reflective surfaces, smooth geometric patterns
- **Details**: Clean lines, aerodynamic curves, tech-integrated surfaces

Create a photorealistic rendering that feels like a luxury spaceship interior.""",

    YachtStyle.ARTDECO: """Transform this yacht interior into an ART DECO design while preserving its exact architectural structure.

**CRITICAL CONSTRAINTS**:
- Maintain ALL architectural elements: {structure_description}
- Preserve room dimensions, wall angles, ceiling height, and floor layout
- Keep window/door positions and sizes identical
- Respect all structural constraints

**ART DECO STYLE GUIDELINES**:
- **Materials**: Exotic woods (ebony, zebrawood), polished marble, brass, lacquer, mirrored surfaces
- **Furniture**: Geometric shapes, curved corners, luxurious upholstery in velvet/leather, stepped forms
- **Patterns**: Chevrons, zigzags, sunburst motifs, geometric repeating patterns, Egyptian-inspired details
- **Colors**: Rich jewel tones (emerald, sapphire, ruby), gold/brass accents, black, cream, burgundy
- **Lighting**: Geometric chandeliers, wall sconces with frosted glass, layered illumination
- **Textures**: Glossy lacquer, polished metal, plush fabrics, inlaid wood patterns
- **Details**: Chrome fixtures, symmetrical compositions, bold geometric moldings, stylized floral motifs

Create a photorealistic rendering evoking 1920s-1930s luxury ocean liner elegance.""",

    YachtStyle.BIOPHILIC: """Transform this yacht interior into a BIOPHILIC design while preserving its exact architectural structure.

**CRITICAL CONSTRAINTS**:
- Maintain ALL architectural elements: {structure_description}
- Preserve room dimensions, wall angles, ceiling height, and floor layout
- Keep window/door positions and sizes identical
- Respect all structural constraints

**BIOPHILIC STYLE GUIDELINES**:
- **Natural Elements**: Living plant walls, potted trees, moss installations, water features (small fountains/aquariums)
- **Materials**: Natural wood (teak, oak, bamboo), stone (granite, slate), cork, linen, cotton, rattan
- **Furniture**: Organic shapes, woven textures, live-edge wood tables, natural fiber upholstery
- **Colors**: Earth tones (forest green, terracotta, sand, sky blue), warm neutrals, natural wood colors
- **Lighting**: Maximize natural light, warm LED mimicking sunlight, pendant lights with natural materials
- **Textures**: Raw wood grain, woven fabrics, natural stone, living plants, water surfaces
- **Details**: Curved organic forms, nature-inspired patterns, maximum greenery integration, indoor-outdoor flow

Create a photorealistic rendering that brings the calming power of nature indoors.""",

    YachtStyle.MEDITERRANEAN: """Transform this yacht interior into a MEDITERRANEAN design while preserving its exact architectural structure.

**CRITICAL CONSTRAINTS**:
- Maintain ALL architectural elements: {structure_description}
- Preserve room dimensions, wall angles, ceiling height, and floor layout
- Keep window/door positions and sizes identical
- Respect all structural constraints

**MEDITERRANEAN STYLE GUIDELINES**:
- **Materials**: Terracotta tiles, natural stone, whitewashed wood, wrought iron, ceramic
- **Furniture**: Rustic wooden pieces, wicker/rattan, cushioned seating with striped fabrics, distressed finishes
- **Colors**: White/cream walls, azure blue accents, terracotta, sunny yellow, olive green, warm beige
- **Patterns**: Mediterranean tiles (zellige, azulejos), nautical stripes, floral motifs
- **Lighting**: Wrought iron fixtures, lantern-style lights, rope-wrapped pendants, warm ambient glow
- **Textures**: Rough-hewn wood, textured plaster walls, woven fabrics, smooth ceramics
- **Details**: Arched elements if possible, blue-and-white pottery, maritime decorations (rope, anchors), flowing curtains

Create a photorealistic rendering evoking the relaxed elegance of Greek islands and Italian coastal villas.""",

    YachtStyle.CYBERPUNK: """Transform this yacht interior into a CYBERPUNK design while preserving its exact architectural structure.

**CRITICAL CONSTRAINTS**:
- Maintain ALL architectural elements: {structure_description}
- Preserve room dimensions, wall angles, ceiling height, and floor layout
- Keep window/door positions and sizes identical
- Respect all structural constraints

**CYBERPUNK STYLE GUIDELINES**:
- **Materials**: Black metal grids, exposed cables/pipes, neon-lit acrylic, industrial plastics, carbon fiber
- **Furniture**: Modular tech stations, gaming chairs, industrial stools, multi-monitor setups, futons with tech fabric
- **Lighting**: Neon tubes (pink, cyan, purple), LED strips along edges, dramatic contrast lighting, holographic projections
- **Colors**: Dark base (black, dark grey), neon accents (hot pink, cyan, electric purple, acid green)
- **Technology**: Multiple screens, exposed circuitry aesthetic, cables as design elements, RGB lighting everywhere
- **Textures**: Matte black metal, reflective wet-look surfaces, grid patterns, glowing panels
- **Details**: Japanese kanji/text overlays, tech clutter, neon signs, steam/fog effects, dystopian luxury

Create a photorealistic rendering merging high-tech with gritty urban aesthetics, like a luxury yacht in Blade Runner.""",
}


# Style descriptions for the list_available_styles tool
STYLE_DESCRIPTIONS = {
    YachtStyle.FUTURISTIC: {
        "display_name": "Futuristic",
        "description": "Sleek, high-tech design inspired by sci-fi and space exploration. Features minimalist forms, integrated technology, and a sophisticated color palette.",
        "characteristics": [
            "Glossy white and metallic surfaces",
            "Integrated LED lighting systems",
            "Minimalist geometric furniture",
            "Smart technology integration",
            "Clean lines and aerodynamic curves",
            "Transparent acrylic and glass elements",
        ],
    },
    YachtStyle.ARTDECO: {
        "display_name": "Art Deco",
        "description": "Glamorous 1920s-1930s elegance with bold geometric patterns, luxurious materials, and rich colors. Evokes the golden age of ocean liner travel.",
        "characteristics": [
            "Exotic woods and polished marble",
            "Geometric patterns (chevrons, sunbursts)",
            "Rich jewel tones with gold/brass accents",
            "Luxurious velvet and leather upholstery",
            "Symmetrical compositions",
            "Mirrored and lacquered surfaces",
        ],
    },
    YachtStyle.BIOPHILIC: {
        "display_name": "Biophilic",
        "description": "Nature-inspired design that brings the outdoors inside. Emphasizes natural materials, living plants, and organic forms for wellness and tranquility.",
        "characteristics": [
            "Living plant walls and greenery",
            "Natural wood and stone materials",
            "Earth tone color palette",
            "Organic curved shapes",
            "Maximized natural light",
            "Water features and natural textures",
        ],
    },
    YachtStyle.MEDITERRANEAN: {
        "display_name": "Mediterranean",
        "description": "Relaxed coastal elegance inspired by Greek islands and Italian riviera. Features whitewashed surfaces, azure blues, and nautical touches.",
        "characteristics": [
            "White/cream with azure blue accents",
            "Terracotta tiles and natural stone",
            "Rustic wooden furniture",
            "Nautical and maritime decorations",
            "Wrought iron fixtures",
            "Mediterranean tile patterns",
        ],
    },
    YachtStyle.CYBERPUNK: {
        "display_name": "Cyberpunk",
        "description": "High-tech meets dystopian luxury. Dark industrial aesthetics with vibrant neon accents, exposed technology, and urban edge.",
        "characteristics": [
            "Dark base with neon pink/cyan accents",
            "Exposed cables and industrial elements",
            "Multiple screens and tech integration",
            "Neon tube lighting",
            "Grid patterns and metallic surfaces",
            "Dystopian luxury aesthetic",
        ],
    },
}


def get_style_prompt(style: YachtStyle, structure_description: str) -> str:
    """
    Get the generation prompt for a specific style.

    Args:
        style: The target yacht style
        structure_description: Structural analysis to preserve

    Returns:
        Formatted prompt string
    """
    template = STYLE_GENERATION_PROMPTS.get(style)
    if not template:
        raise ValueError(f"No prompt template found for style: {style}")

    return template.format(structure_description=structure_description)
