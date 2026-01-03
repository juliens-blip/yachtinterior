# Usage Guide - Gemini Yacht MCP in Claude Code

Step-by-step guide for using the Gemini Yacht MCP server in Claude Code.

## Table of Contents

- [Getting Started](#getting-started)
- [Using the Tools](#using-the-tools)
- [Workflow Patterns](#workflow-patterns)
- [Tips & Best Practices](#tips--best-practices)
- [Common Use Cases](#common-use-cases)

---

## Getting Started

### Verify Installation

Before using the MCP server, verify it's properly configured:

```
/mcp list
```

**Expected output:**
```
Available MCP servers:
- gemini-yacht
  Tools: analyze_structure, generate_style, generate_all, list_styles
```

If not listed, see [INSTALL.md](INSTALL.md) for setup instructions.

---

## Using the Tools

### Tool 1: list_styles

**Purpose:** Browse available yacht design styles

**Usage in Claude Code:**

```
What yacht design styles are available?
```

**What Claude does:**
1. Recognizes the request
2. Calls `list_styles` tool
3. Returns formatted list of 5 styles

**Example Response:**

```
Here are the 5 available yacht interior design styles:

1. **Futuristic** - Sleek, high-tech design inspired by sci-fi
   - Glossy white and metallic surfaces
   - Integrated LED lighting systems
   - Minimalist geometric furniture
   - Smart technology integration

2. **Art Deco** - 1920s glamour with geometric patterns
   - Exotic woods and polished marble
   - Rich jewel tones with gold accents
   - Luxurious velvet upholstery
   - Symmetrical compositions

[...continues for all 5 styles]
```

---

### Tool 2: analyze_structure

**Purpose:** Analyze yacht interior architecture

**Usage in Claude Code:**

**Option A: With image attachment**
```
Analyze the structure of this yacht interior.
[Attach image via Claude Code interface]
```

**Option B: With base64 image**
```
Analyze this yacht interior:
data:image/jpeg;base64,/9j/4AAQSkZJRg...
```

**What Claude does:**
1. Receives image (converts to base64 if needed)
2. Calls `analyze_structure(image=base64_data)`
3. Receives detailed analysis
4. Formats response for you

**Example Response:**

```
I've analyzed the yacht interior. Here's what I found:

**Overall Description:**
Contemporary luxury yacht master suite featuring curved wall design
following hull contours. Space measures approximately 15x12 feet with
dramatic 12-foot ceiling height...

**Key Architectural Features:**
- Curved panoramic windows spanning entire starboard wall (180° view)
- Raised king-size bed platform (8 inches high) with hydraulic storage
- 12-foot vaulted ceiling with curved transitions
- Built-in wardrobes (8 feet tall) with push-to-open mechanisms
- Teak herringbone flooring with non-slip coating

**Geometry & Layout:**
Asymmetrical layout adapting to hull curvature. The room narrows
toward the bow creating a tapered effect. Ceiling follows hull arc,
rising from 10 feet forward to 12 feet at center...

**Lighting Analysis:**
Primary natural light from expansive starboard windows providing
strong daylight. Artificial lighting includes recessed LED strips
in ceiling coves (3000K, dimmable), under-bed accent lighting...
```

**Advanced Usage with Options:**

```
Analyze this yacht interior with high detail level, focusing on
materials and color palette.
```

Claude will call:
```python
analyze_structure(
    image=base64_data,
    options={
        "detail_level": "high",
        "focus_areas": "materials, color palette"
    }
)
```

---

### Tool 3: generate_style

**Purpose:** Transform yacht interior to specific style

**Usage in Claude Code:**

**Step 1: Analyze first (recommended)**
```
Analyze this yacht interior [attach image]
```

**Step 2: Generate style**
```
Transform it to Futuristic style while preserving the structure
you just analyzed.
```

**What Claude does:**
1. Uses previous analysis as `structure_description`
2. Calls `generate_style(image, structure_description, "futuristic")`
3. Receives transformation description
4. Presents result to you

**Example Response:**

```
Here's your yacht interior transformed to Futuristic style:

**Transformation Applied:**
The master suite has been reimagined as a sleek, high-tech sanctuary.
The curved walls are now finished in glossy white composite panels
with seamless joints, creating a monolithic appearance.

**Key Changes:**

1. **Walls & Ceiling:**
   - Glossy white composite panels
   - Integrated LED strips (cool white, 5000K) along all edges
   - Creates floating ceiling effect

2. **Bed Platform:**
   - Low-profile design (4 inches high) in brushed titanium
   - Levitation-style LED underlighting (electric blue)
   - Mattress appears to float on light cushion

3. **Windows:**
   - Smart glass with variable tinting
   - Touch panel controls
   - Chrome geometric grid mullions

4. **Flooring:**
   - Large-format porcelain tiles (3x3 feet, glossy white)
   - Embedded fiber optic points creating starfield effect

5. **Technology Integration:**
   - Holographic projection area in ceiling
   - Invisible recessed speakers
   - Motion-activated wardrobe panels glowing blue

**Color Palette:**
- 80% white
- 15% metallic silver/chrome
- 5% electric blue accent lighting

The overall effect is minimalist, tech-forward, reminiscent of a
luxury spacecraft interior.
```

**Shortcut (without prior analysis):**

```
Transform this yacht interior to Cyberpunk style.
[Attach image]
```

Claude may ask for analysis first, or proceed with a generic structure description.

---

### Tool 4: generate_all

**Purpose:** Generate all 5 style variations at once

**Usage in Claude Code:**

```
Show me this yacht interior in all available design styles.
[Attach image]
```

**What Claude does:**
1. Calls `generate_all(image=base64_data)`
2. Server performs:
   - Step 1: Analyze structure
   - Step 2: Generate all 5 styles in parallel
3. Returns complete results
4. Claude formats as comparison

**Example Response:**

```
I've generated all 5 style variations for your yacht interior.
Here's the comparison:

**Original Structure Analysis:**
Contemporary luxury yacht master suite with curved walls...

---

**1. Futuristic Style**

Sleek high-tech sanctuary with glossy white composite panels and
integrated LED edge lighting. Features low-profile titanium bed
platform with blue LED underlighting, smart glass windows with
touch controls, and holographic ceiling projection area.

Color palette: White (80%), chrome/silver (15%), electric blue (5%)

---

**2. Art Deco Style**

Glamorous 1920s elegance with exotic ebony wood paneling featuring
brass chevron inlays. Curved Art Deco headboard in zebrawood with
emerald velvet upholstery. Polished brass window frames with
geometric muntins, black marble flooring with gold veining.

Color palette: Black, gold, emerald green, cream, burgundy

---

**3. Biophilic Style**

Nature-immersed sanctuary with living plant wall (ferns, pothos,
moss) on curved walls. Live-edge oak bed platform with organic
curves, natural linen bedding in sage and cream. Frameless windows
maximize nature views, wide-plank oak flooring, water feature in
corner.

Color palette: Forest green, terracotta, sand, sky blue, natural wood

---

**4. Mediterranean Style**

Relaxed coastal elegance with textured white Venetian stucco walls
and soft blue ceiling with white beams. Distressed pine bed with
blue-white striped linens, sheer white curtains on azure-framed
windows. Hand-glazed terracotta tile flooring, whitewashed wardrobes
with wrought iron hardware.

Color palette: White (50%), azure blue (20%), terracotta (15%)

---

**5. Cyberpunk Style**

Dystopian luxury with matte black metal panel walls featuring
visible rivets and hot pink/cyan neon tubes. Industrial steel bed
frame with wire mesh and RGB LED underlighting. Dark tinted windows
with neon pink trim, multiple screens displaying code/art, exposed
ducts with fog effects.

Color palette: Black (60%), neon pink (15%), cyan (15%), purple (5%)

---

Which style would you like to explore further?
```

---

## Workflow Patterns

### Pattern 1: Single Style Redesign

**Best for:** Quick transformation to specific style

```
1. [Attach yacht interior image]

2. "Analyze this yacht interior"
   → Claude calls analyze_structure

3. "Transform it to Art Deco style"
   → Claude calls generate_style(style="artdeco")

4. Review result
```

---

### Pattern 2: Comprehensive Redesign

**Best for:** Exploring all options before deciding

```
1. [Attach yacht interior image]

2. "Show me this in all available styles"
   → Claude calls generate_all

3. "I like the Biophilic style. Can you provide more detail
    on the materials and costs?"
   → Claude provides expanded details from description

4. Decision made!
```

---

### Pattern 3: Iterative Refinement

**Best for:** Custom requirements with multiple constraints

```
1. [Attach image]

2. "Analyze this yacht interior, focusing on storage solutions
    and lighting"
   → Claude calls analyze_structure with options

3. "Transform to Mediterranean style, but keep the modern
    lighting fixtures"
   → Claude calls generate_style with custom structure description

4. "Can you add more nautical elements?"
   → Claude generates new description building on previous

5. Refinement continues...
```

---

### Pattern 4: Batch Processing

**Best for:** Multiple rooms or multiple yachts

```
1. [Attach Room 1 image]
   "Analyze as Room 1"

2. [Attach Room 2 image]
   "Analyze as Room 2"

3. "Generate Futuristic style for both rooms"
   → Claude calls generate_style twice

4. Compare consistency across rooms
```

---

## Tips & Best Practices

### Image Quality

**Do:**
- Use high-resolution images (1024x1024 or higher)
- Ensure good lighting in photos
- Capture wide angle to show full room
- Include architectural details

**Don't:**
- Use blurry or dark images
- Crop too tightly (lose context)
- Use images with heavy filters applied

### Prompt Writing

**Effective prompts:**
```
✓ "Analyze this yacht master suite with focus on geometry and lighting"
✓ "Transform to Futuristic style, preserving the curved windows"
✓ "Show all styles but prioritize eco-friendly options"
```

**Less effective prompts:**
```
✗ "Make it better"
✗ "Change the style"
✗ "What can you do?"
```

### Error Handling

If you encounter errors:

1. **"Image too large"**
   → Resize image before uploading (max 2048x2048 recommended)

2. **"Timeout error"**
   → Retry with smaller image or ask Claude to increase timeout

3. **"Invalid style"**
   → Use `list_styles` to see available options

4. **"API key error"**
   → Contact administrator to verify MCP server configuration

---

## Common Use Cases

### Use Case 1: Client Presentation

**Scenario:** Interior designer showing multiple options to client

**Workflow:**
```
1. "Show this yacht interior in all 5 styles" [attach photo]
   → Get comprehensive comparison

2. "The client prefers Biophilic. Can you emphasize the
    sustainability aspects?"
   → Get detailed eco-friendly analysis

3. "Generate a description suitable for a client presentation"
   → Claude reformats in professional language
```

---

### Use Case 2: Design Inspiration

**Scenario:** Designer exploring new ideas

**Workflow:**
```
1. "What styles combine natural materials with modern tech?"
   → Claude suggests Biophilic + Futuristic elements

2. "Analyze this interior" [attach]
   → Get structural analysis

3. "Transform to Biophilic but add smart lighting like
    Futuristic style"
   → Get hybrid style description
```

---

### Use Case 3: Renovation Planning

**Scenario:** Planning yacht interior renovation

**Workflow:**
```
1. "Analyze this yacht interior, focusing on structural
    constraints and existing features to preserve"
   → Get detailed analysis

2. "Transform to Mediterranean style while keeping the
    existing built-in wardrobes and bed platform"
   → Get constrained transformation

3. "What would be the estimated difficulty of this
    transformation?"
   → Claude analyzes based on structural changes needed
```

---

### Use Case 4: Style Mixing

**Scenario:** Creating unique hybrid style

**Workflow:**
```
1. "Generate Cyberpunk and Art Deco styles for this interior"
   → Get both descriptions

2. "Can you create a hybrid that combines the geometric
    patterns of Art Deco with the neon lighting of Cyberpunk?"
   → Claude synthesizes new description

3. "Emphasize luxury materials from Art Deco but keep the
    edgy aesthetic from Cyberpunk"
   → Further refinement
```

---

## Keyboard Shortcuts in Claude Code

- **Attach Image:** Drag and drop or click attachment icon
- **Previous Prompt:** Up arrow
- **Multi-line Input:** Shift+Enter
- **Send Message:** Enter

---

## Advanced Features

### Context Preservation

Claude Code maintains context, so you can reference previous analyses:

```
User: Analyze this yacht interior [image]
Claude: [analysis result]

User: Now transform it to Futuristic
Claude: [uses previous analysis automatically]

User: Actually, make that Mediterranean instead
Claude: [uses same base analysis, different style]
```

### Batch Commands

Process multiple requests:

```
Please do the following:
1. Analyze the attached yacht interior
2. Generate all 5 styles
3. Compare Futuristic vs. Cyberpunk
4. Recommend which is better for a tech entrepreneur client
```

Claude will execute sequentially and provide comprehensive response.

---

## Troubleshooting in Claude Code

### Issue: Tool not available

**Check:**
```
/mcp list
```

**If missing:**
- Restart Claude Code
- Verify .mcp.json configuration
- See [DEPLOYMENT.md](DEPLOYMENT.md)

### Issue: Slow response

**Causes:**
- Large image (resize to 1024x1024)
- Network latency
- Gemini API rate limiting

**Solution:**
- Use smaller images
- Try again in a few minutes
- Check server logs

### Issue: Unexpected results

**Check:**
- Image quality (clear, well-lit)
- Prompt specificity (be explicit)
- Style name spelling (use list_styles)

---

## Next Steps

- **Learn More:** Read [EXAMPLES.md](EXAMPLES.md) for detailed scenarios
- **Technical Details:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Configuration:** Check [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Happy Designing! 🚢**

Built with FastMCP for YachtGenius.
