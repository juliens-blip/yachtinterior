# YachtGenius - AI-Powered Yacht Interior Design

This is a premium web application designed to redesign yacht interiors using cutting-edge AI technology.

## Features

- **Premium UI**: Elegant dark mode with gold accents, suitable for luxury clientele.
- **Image Upload**: Simple and intuitive upload interface.
- **AI Generation**: (Mocked) Generates 5 different interior styles while maintaining boat proportions.
- **Responsive Design**: Works on all devices.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Locally**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## AI Integration

The application uses Google's Gemini AI models for image generation:

1.  Set up your API key in `.env.local`: `GEMINI_API_KEY=your_key_here`
2.  The API route at `app/api/generate/route.ts` handles secure server-side processing
3.  Images are analyzed and redesigned in 5 different luxury styles while preserving structural proportions

## Technologies

-   **Next.js 15**: React framework with App Router
-   **React 19**: UI library
-   **TypeScript**: Type-safe development
-   **Three.js**: 3D graphics for ASCII animations
-   **Google Gemini AI**: Image generation and analysis
-   **CSS**: Custom premium styling with glass morphism effects
