# CLAUDE.md - YachtGenius Project Documentation

## 🎯 VUE D'ENSEMBLE

**YachtGenius** est une application web innovante qui permet de redesigner des intérieurs de yachts en utilisant l'IA générative. L'application utilise le modèle **Gemini 2.5 Flash** (surnommé "Nano Banana") de Google pour analyser une photo d'intérieur de yacht et générer 5 styles différents tout en préservant la structure architecturale.

### Objectif Principal
Transformer des photos d'intérieurs de yachts en 5 variations stylistiques différentes (Futuristic Minimalist, Art Deco Luxury, Biophilic Zen, Mediterranean Riviera, Cyberpunk Industrial) tout en conservant:
- La géométrie exacte de la pièce
- L'angle de la caméra
- La position et forme des fenêtres
- Les éléments structurels fixes

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technologique

#### Frontend
- **React 19.2.0** - Library UI moderne
- **Vite 7.2.4** - Build tool ultra-rapide
- **CSS3** - Styling avec effets glass morphism et holographiques

#### Backend / AI
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) - Modèle d'IA générative de Google
- **@google/generative-ai** (v0.24.1) - SDK JavaScript pour Gemini

#### Migration en cours
- **Actuellement**: Vite + React
- **Cible**: Next.js 14 avec App Router
- **Raison**: Meilleure gestion des API routes, SSR, et optimisations d'images

### Structure du Projet Actuelle

```
yacht-interior/
├── src/                          # Source code Vite (LEGACY)
│   ├── App.jsx                   # Composant principal React
│   ├── App.css                   # Styles principaux
│   ├── main.jsx                  # Point d'entrée React
│   └── index.css                 # Styles globaux
│
├── claude/.claude/               # Configuration Claude Code
│   ├── agents/
│   │   ├── explore-code.md       # Agent d'exploration de codebase
│   │   ├── mcp-creator.md        # Agent de création de serveurs MCP
│   │   ├── mcp-doctor.md         # Agent de diagnostic MCP
│   │   ├── frontend-developer.md # Agent développement frontend
│   │   ├── prompt-engineer.md    # Agent prompt engineering
│   │   └── test-code.md          # Agent testing
│   │
│   ├── commands/
│   │   ├── mcp.md                # Commande création MCP
│   │   ├── mcp-check.md          # Commande diagnostic MCP
│   │   ├── mcp-fix.md            # Commande réparation MCP
│   │   ├── image.md              # Commande traitement images
│   │   └── debug.md              # Commande debugging
│   │
│   └── settings.local.json       # Configuration locale
│
├── public/                       # Assets statiques
├── dist/                         # Build de production
├── node_modules/                 # Dépendances npm
│
├── package.json                  # Configuration npm
├── vite.config.js                # Configuration Vite
├── eslint.config.js              # Configuration ESLint
├── .gitignore                    # Fichiers ignorés par git
├── .env                          # Variables d'environnement (NON committé)
├── .env.example                  # Template variables d'env
│
└── CLAUDE.md                     # 📄 CE FICHIER - Documentation complète

```

### Structure Next.js 14 Cible (À implémenter)

```
yacht-interior/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Page d'accueil (landing)
│   ├── layout.tsx                # Layout principal
│   │
│   ├── upload/
│   │   └── page.tsx              # Page upload d'image
│   │
│   ├── gallery/
│   │   └── page.tsx              # Page résultats (galerie)
│   │
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # API génération styles
│   │   │
│   │   ├── analyze/
│   │   │   └── route.ts          # API analyse structure
│   │   │
│   │   └── gemini/
│   │       └── route.ts          # API wrapper Gemini
│
├── components/                   # Composants React réutilisables
│   ├── ImageUploader.tsx         # Composant upload
│   ├── StyleGallery.tsx          # Galerie de résultats
│   ├── ProcessingLoader.tsx      # Loader holographique
│   └── Navbar.tsx                # Navigation
│
├── lib/                          # Utilitaires et helpers
│   ├── gemini.ts                 # Client Gemini AI
│   ├── imageUtils.ts             # Traitement images (base64, resize)
│   ├── types.ts                  # Types TypeScript
│   ├── prompts.ts                # Prompt engineering
│   └── constants.ts              # Constantes (styles, config)
│
├── public/                       # Assets statiques
│   ├── images/                   # Images publiques
│   └── fonts/                    # Polices custom
│
├── styles/                       # Styles globaux
│   └── globals.css               # CSS global
│
├── mcp/                          # Serveurs MCP (Model Context Protocol)
│   └── gemini-mcp/               # MCP Gemini (À créer)
│       ├── main.py               # Serveur MCP principal
│       ├── handlers/             # Handlers tools/resources
│       ├── requirements.txt      # Dépendances Python
│       ├── .env.example          # Template env variables
│       └── README.md             # Documentation MCP
│
├── package.json
├── tsconfig.json                 # Configuration TypeScript
├── next.config.js                # Configuration Next.js
├── .env.local                    # Variables env Next.js
└── CLAUDE.md                     # Documentation
```

---

## 🔑 CONCEPTS CLÉS

### 1. Nano Banana (Gemini 2.5 Flash)

**Nano Banana** est le surnom donné au modèle **Gemini 2.5 Flash** dans ce projet.

**Caractéristiques:**
- Modèle multimodal (texte + images)
- Ultra-rapide (d'où "Flash")
- Capable d'analyse d'images et génération de contenu
- API accessible via `@google/generative-ai`

**Utilisation actuelle:**
```javascript
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent([
  prompt,
  {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg"
    }
  }
]);
```

### 2. Processus de Génération en 2 Phases

#### Phase 1: Analyse de la Structure
```
Objectif: Extraire la "coquille" architecturale de la pièce
Input: Image originale
Output: Description textuelle détaillée de:
  - Angle de caméra
  - Forme et dimensions de la pièce
  - Position/taille des fenêtres
  - Hauteur de plafond
  - Éléments structurels fixes
```

#### Phase 2: Génération des Styles
```
Objectif: Redécorer la pièce dans 5 styles différents
Input: Image originale + Description structure + Prompt de style
Output: 5 images générées (une par style)
Contrainte: PRÉSERVER la géométrie analysée en Phase 1
```

### 3. Prompt Engineering

**Structure des prompts optimisés:**

```typescript
// Phase 1 - Structure Analysis
const structurePrompt = `
  Analyze this yacht interior image.
  Describe ONLY the physical structure and geometry in extreme detail.
  Include:
  - Camera angle and perspective
  - Room shape and dimensions
  - Window placement, shape, and size
  - Ceiling height and features
  - Fixed structural elements
  DO NOT describe furniture style, colors, or decor.
`;

// Phase 2 - Style Generation
const stylePrompt = `
  STRICT INSTRUCTION: INTERIOR REFIT ONLY.
  DO NOT CHANGE THE ROOM GEOMETRY.

  Input Image Structure: ${structureDescription}

  Task: Redecorate this EXACT room in the style of: ${styleDefinition}

  Rules:
  1. Keep exact camera angle
  2. Keep exact window shapes/positions
  3. Keep exact structural elements
  4. ONLY change furniture, materials, lighting, colors
  5. Output MUST look like the SAME BOAT, just renovated

  Quality: Photorealistic, 8k, Interior Design Render
`;
```

### 4. Les 5 Styles d'Intérieurs

| Style | Description | Mots-clés |
|-------|-------------|-----------|
| **Futuristic Minimalist** | Esthétique futuriste épurée | sleek white curves, neon accents, holographic displays, spaceship aesthetic |
| **Art Deco Luxury** | Luxe années 20 gatsby | black marble, gold geometric patterns, velvet textures, great gatsby vibe |
| **Biophilic Zen** | Nature et sérénité | living walls, natural oak wood, flowing water features, organic shapes |
| **Mediterranean Riviera** | Riviera méditerranéenne | white linen, terracotta tiles, olive wood, breezy open air, blue accents |
| **Cyberpunk Industrial** | Industriel cyberpunk sombre | exposed metal, dark moody lighting, neon purple/blue, high-tech surfaces |

---

## 🚀 WORKFLOW DE L'APPLICATION

### 1. Landing Page (step = 'landing')
```
User voit:
- Hero title: "Redesign Your Yacht Interior"
- Subtitle explicatif
- Bouton "Initiate Sequence"

Action:
- Click bouton → ouvre file picker
- Sélection image → setStep('upload')
```

### 2. Upload Preview (step = 'upload')
```
User voit:
- Preview de l'image uploadée
- Animation "scanner-line" (effet scan holographique)
- Boutons: "Abort" | "Execute Redesign"

Action:
- "Abort" → retour à landing
- "Execute Redesign" → lance generateInteriors()
```

### 3. Processing (step = 'processing')
```
User voit:
- Loader holographique (3 anneaux en rotation)
- Console log animée avec les étapes:
  > Initializing Nano Banana Core...
  > Scanning image geometry...
  > Structure extracted: ...
  > Generating Futuristic Minimalist...
  > ...

Action:
- En arrière-plan: appels API Gemini
- Mise à jour du log en temps réel
```

### 4. Results (step = 'results')
```
User voit:
- Titre "Design Matrix Complete"
- Galerie 5 images (grid responsive)
- Chaque image avec:
  * Nom du style
  * Preview du prompt utilisé

Action:
- Bouton "New Sequence" → retour à landing
```

---

## 📦 DÉPENDANCES

### Production
```json
{
  "@google/generative-ai": "^0.24.1",  // SDK Gemini
  "react": "^19.2.0",                  // UI library
  "react-dom": "^19.2.0"               // React DOM
}
```

### Development
```json
{
  "@eslint/js": "^9.39.1",
  "@types/react": "^19.2.5",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^5.1.1",
  "eslint": "^9.39.1",
  "eslint-plugin-react-hooks": "^7.0.1",
  "eslint-plugin-react-refresh": "^0.4.24",
  "globals": "^16.5.0",
  "vite": "^7.2.4"
}
```

### Next.js 14 (À installer pour migration)
```bash
npm install next@14 react@19 react-dom@19
npm install -D typescript @types/node @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
```

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### .env (Vite - Actuel)
```bash
# Gemini API Key
VITE_GEMINI_API_KEY=your_api_key_here
```

### .env.local (Next.js - Futur)
```bash
# Gemini API Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Application Configuration
NEXT_PUBLIC_APP_NAME=YachtGenius
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Image Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
NEXT_PUBLIC_ALLOWED_FORMATS=image/jpeg,image/png,image/webp

# Rate Limiting
GEMINI_RATE_LIMIT_PER_MINUTE=10
GEMINI_TIMEOUT_MS=30000
```

---

## 🎨 DESIGN SYSTEM

### Couleurs
```css
:root {
  /* Primaires */
  --gold: #D4AF37;           /* Or luxe */
  --navy: #0A1929;           /* Bleu nuit profond */
  --white: #FFFFFF;

  /* Accents */
  --cyan: #00E5FF;           /* Cyan néon */
  --purple: #B026FF;         /* Violet holographique */

  /* Backgrounds */
  --bg-dark: #0A0E27;        /* Fond sombre */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### Effets
```css
/* Glass Morphism */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Holographic Loader */
.hologram-ring {
  border: 2px solid;
  border-color: var(--cyan) transparent transparent transparent;
  animation: rotate 2s linear infinite;
}

/* Scanner Effect */
.scanner-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  animation: scan 2s ease-in-out infinite;
}
```

---

## 🧪 TESTING & DEBUGGING

### Tests Manuels Critiques

1. **Upload d'image**
   - Formats supportés: JPEG, PNG, WebP
   - Taille max: 10MB
   - Vérifier preview base64

2. **Génération de styles**
   - Vérifier les 5 styles sont générés
   - Timeout: 30s par style
   - Gérer les erreurs API Gemini

3. **Préservation de la structure**
   - Comparer image originale vs générées
   - Vérifier angles de caméra identiques
   - Vérifier fenêtres au même endroit

4. **Fallback en cas d'erreur**
   - Si Gemini ne retourne pas d'image: afficher l'originale
   - Logger l'erreur dans la console
   - Ne JAMAIS afficher d'images aléatoires

### Debugging Tips

```javascript
// Activer logs détaillés Gemini
console.log("Nano Banana Response:", response);

// Vérifier structure de la réponse
if (response.candidates && response.candidates[0].content) {
  console.log("Parts:", response.candidates[0].content.parts);
}

// Vérifier présence d'image dans la réponse
const hasImage = response.candidates[0].content.parts.some(
  part => part.inlineData && part.inlineData.data
);
```

---

## 🚧 PROBLÈMES CONNUS & SOLUTIONS

### 1. Gemini retourne du texte au lieu d'images

**Problème:**
Gemini 2.5 Flash peut retourner une description textuelle au lieu d'une image générée.

**Solution actuelle:**
- Détecter si `inlineData.data` est présent
- Si absent: utiliser l'image originale comme fallback
- Logger un warning

**Solution future (MCP):**
- Créer un MCP avec retry logic
- Utiliser un modèle image-to-image dédié (ex: Imagen)
- Implémenter un cache de résultats

### 2. Préservation incohérente de la structure

**Problème:**
Malgré les prompts stricts, Gemini peut modifier la géométrie.

**Solution actuelle:**
- Phase 1 d'analyse très détaillée
- Répétition des contraintes dans le prompt de Phase 2

**Solution future:**
- Utiliser des masques/segmentation d'image
- Inpainting sur zones spécifiques uniquement
- ControlNet pour contraintes spatiales

### 3. Performance et coûts API

**Problème:**
5 appels API par image = coûts et latence élevés

**Solution future:**
- Rate limiting côté serveur
- Cache des résultats (Redis)
- Génération parallèle avec Promise.all()
- Mode "preview rapide" avec 1-2 styles seulement

---

## 🎯 ROADMAP

### Phase 1: Migration Next.js 14 ✅ (PRIORITÉ)
- [ ] Initialiser projet Next.js 14
- [ ] Migrer App.jsx vers app/page.tsx
- [ ] Créer API route `/api/generate`
- [ ] Migrer styles vers Tailwind CSS
- [ ] Setup TypeScript strict mode
- [ ] Migrer variables d'env vers .env.local

### Phase 2: Création MCP Gemini 🔧 (EN COURS)
- [ ] Utiliser agent mcp-creator pour générer le MCP
- [ ] Implémenter handlers tools (analyze, generate)
- [ ] Implémenter handlers resources (styles, history)
- [ ] Ajouter retry logic et error handling
- [ ] Tester avec mcp-doctor
- [ ] Intégrer dans Claude Desktop

### Phase 3: Améliorations Backend
- [ ] Créer lib/gemini.ts avec client configuré
- [ ] Implémenter cache Redis pour résultats
- [ ] Rate limiting par utilisateur
- [ ] Upload vers cloud storage (S3/Cloudinary)
- [ ] Historique de générations (DB)

### Phase 4: Améliorations Frontend
- [ ] Galerie avec zoom sur images
- [ ] Download des images générées
- [ ] Comparaison avant/après (slider)
- [ ] Personnalisation des styles
- [ ] Partage social (Open Graph)

### Phase 5: Features Avancées
- [ ] Authentification utilisateurs
- [ ] Dashboard avec historique
- [ ] Génération de variations d'un style
- [ ] Mode "inspiration" (suggestions de styles)
- [ ] Export PDF avec toutes les variantes

---

## 📚 RESSOURCES & RÉFÉRENCES

### Documentation Officielle
- [Gemini API Docs](https://ai.google.dev/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

### Prompt Engineering
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)
- [Google AI Prompting Guide](https://ai.google.dev/docs/prompting_intro)

### Design Inspiration
- [Awwwards - Yacht Design](https://www.awwwards.com/)
- [Dribbble - Luxury Interior](https://dribbble.com/tags/luxury-interior)

---

## 🤝 CONTRIBUTION & DEVELOPMENT

### Setup Local

```bash
# 1. Clone du repo
git clone <repo-url>
cd yacht-interior

# 2. Installation dépendances
npm install

# 3. Configuration env
cp .env.example .env
# Éditer .env et ajouter VITE_GEMINI_API_KEY

# 4. Lancer dev server
npm run dev

# 5. Build production
npm run build
npm run preview
```

### Commandes Claude Code

```bash
# Explorer une feature
/explore-code "gemini integration"

# Créer un nouveau MCP
/mcp gemini

# Diagnostiquer un MCP
/mcp-check gemini-mcp

# Réparer un MCP
/mcp-fix gemini-mcp
```

### Agents Disponibles

| Agent | Description | Usage |
|-------|-------------|-------|
| **explore-code** | Explore et analyse une feature | Avant d'implémenter ou déboguer |
| **mcp-creator** | Crée un serveur MCP complet | Créer intégration Gemini |
| **mcp-doctor** | Diagnostique et répare MCP | Quand MCP ne fonctionne pas |
| **frontend-developer** | Développement frontend | Créer/modifier composants React |
| **prompt-engineer** | Optimisation prompts AI | Améliorer qualité Gemini |
| **test-code** | Testing et validation | Écrire tests unitaires/E2E |

---

## 📝 NOTES IMPORTANTES

### Sécurité
- ⚠️ **JAMAIS** committer `.env` ou `.env.local`
- ⚠️ API keys doivent être en variables d'environnement
- ⚠️ Valider et sanitizer tous les uploads d'images
- ⚠️ Rate limiting OBLIGATOIRE en production

### Performance
- Compresser images avant upload (max 2MB recommandé)
- Utiliser WebP quand possible
- Lazy loading pour galerie de résultats
- Service worker pour cache offline

### Best Practices
- TypeScript strict mode pour éviter bugs
- ESLint + Prettier pour cohérence code
- Commits conventionnels (feat, fix, docs, etc.)
- Tests avant chaque PR

---

## 🆘 TROUBLESHOOTING

### Erreur: "Missing VITE_GEMINI_API_KEY"
```bash
# Solution
cp .env.example .env
# Éditer .env et ajouter votre clé API
```

### Gemini retourne erreur 429 (Rate Limit)
```javascript
// Solution: implémenter retry avec backoff
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.message.includes('429') && i < maxRetries - 1) {
        await sleep(2 ** i * 1000); // Exponential backoff
        continue;
      }
      throw e;
    }
  }
}
```

### Images générées ne préservent pas la structure
```javascript
// Solution: améliorer prompt de Phase 1
const betterStructurePrompt = `
  Act as a professional architectural surveyor.
  Provide a technical blueprint description of this room.
  Use precise measurements and architectural terminology.
  Focus on IMMUTABLE structural elements only.
`;
```

---

## 📊 MÉTRIQUES & KPIs

### Performance Cible
- ⏱️ Temps de génération total: < 60s (5 styles)
- 📈 Taux de succès génération: > 95%
- 🎯 Qualité préservation structure: > 90%
- 💰 Coût par génération: < $0.10

### Monitoring
```javascript
// À implémenter
const metrics = {
  totalGenerations: 0,
  successfulGenerations: 0,
  failedGenerations: 0,
  averageTime: 0,
  apiCosts: 0
};
```

---

**Version:** 1.0.0
**Dernière mise à jour:** 2025-11-28
**Auteur:** YachtGenius Team
**Maintenu par:** Claude Code avec Agents Spécialisés

---

*Ce fichier est vivant et doit être mis à jour à chaque modification majeure du projet.*
