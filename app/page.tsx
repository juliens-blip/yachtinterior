'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabaseClient';
import ASCIIText from './components/ASCIIText';
import SplitText from './components/SplitText';

interface GeneratedImage {
  style: string;
  prompt: string;
  url: string;
  isFallback: boolean;
}

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState<'landing' | 'upload' | 'processing' | 'results'>('landing');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/auth');
        return;
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', data.session.user.id)
        .single();

      const hasActiveSubscription =
        subscription?.status === 'active' ||
        (subscription?.status === 'canceled' &&
          subscription?.current_period_end &&
          new Date(subscription.current_period_end) > new Date());

      if (!hasActiveSubscription) {
        router.replace('/auth');
        return;
      }

      if (mounted) setCheckingAuth(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth');
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((lightboxIndex - 1 + generatedImages.length) % generatedImages.length);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((lightboxIndex + 1) % generatedImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, generatedImages.length]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        // Extract base64 data (remove "data:image/jpeg;base64," prefix)
        const base64Data = result.split(',')[1];
        setImageBase64(base64Data);
        setStep('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateInteriors = async () => {
    setStep('processing');
    setIsAnalyzing(true);

    try {
      // Call API route instead of direct Gemini call
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error:', data.error);
        setStep('upload');
        setIsAnalyzing(false);
        return;
      }

      setGeneratedImages(data.images);
      setStep('results');
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error generating interiors:', error);
      setStep('upload');
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/portal', { method: 'POST' });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  if (checkingAuth) {
    return (
      <div className="app-container">
        <main className="main-content">
          <p>Checking session...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <div className="logo">YachtGenius</div>
        <div className="powered-by">POWERED BY AI</div>
        <div className="auth-actions">
          <button className="btn-primary" onClick={handleManageSubscription}>
            Manage subscription
          </button>
          <button className="btn-primary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {step === 'landing' && (
          <div className="hero-section">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="hero-video"
            >
              <source src="/yacht-background.mp4" type="video/mp4" />
            </video>
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <h1 className="hero-title">
                <div className="hero-title-line">
                  <SplitText text="Redesign Your" delay={0.2} />
                </div>
                <div className="hero-title-line highlight">
                  <SplitText text="Yacht Interior" delay={0.6} />
                </div>
              </h1>
              <p className="hero-subtitle">
                Experience the future of marine design. Upload your interior and let our
                YachtGenius AI generate 5 distinct, proportion-perfect styles instantly.
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
          </div>
        )}

        {step === 'upload' && (
          <div className="preview-section">
            <div className="preview-inner">
              <h2>Confirm Input Data</h2>
              <div className="image-preview-wrapper">
                <div className="scanner-line"></div>
                <img
                  src={selectedImage || ''}
                  alt="Original Interior"
                  className="preview-image"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
              <div className="actions">
                <button className="btn-primary" onClick={() => setStep('landing')}>
                  Abort
                </button>
                <button className="btn-gold" onClick={generateInteriors}>
                  Execute Redesign
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="processing-section">
            <ASCIIText
              text="YACHTGENIUS"
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
              <button className="btn-primary" onClick={() => setStep('landing')}>
                New Sequence
              </button>
            </div>

            <div className="gallery-grid">
              {generatedImages.map((item, index) => (
                <div
                  key={index}
                  className="gallery-item"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img src={item.url} alt={item.style} />
                  <div className="style-info">
                    <div className="style-label">{item.style}</div>
                    <div className="prompt-preview" title={item.prompt}>
                      PROMPT: {item.prompt.slice(0, 60)}...
                    </div>
                  </div>
                  <div className="gallery-item-overlay">
                    <span className="view-icon">⤢</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Lightbox Carousel */}
            {lightboxIndex !== null && (
              <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
                <button
                  className="lightbox-close"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                  aria-label="Close lightbox"
                >
                  ✕
                </button>

                <button
                  className="lightbox-nav lightbox-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex - 1 + generatedImages.length) % generatedImages.length);
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={generatedImages[lightboxIndex].url}
                    alt={generatedImages[lightboxIndex].style}
                    className="lightbox-image"
                  />
                  <div className="lightbox-info">
                    <div className="lightbox-style">{generatedImages[lightboxIndex].style}</div>
                    <div className="lightbox-prompt">{generatedImages[lightboxIndex].prompt}</div>
                    <div className="lightbox-counter">
                      {lightboxIndex + 1} / {generatedImages.length}
                    </div>
                  </div>
                </div>

                <button
                  className="lightbox-nav lightbox-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex + 1) % generatedImages.length);
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>

                <div className="lightbox-thumbnails">
                  {generatedImages.map((item, idx) => (
                    <div
                      key={idx}
                      className={`lightbox-thumbnail ${idx === lightboxIndex ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                    >
                      <img src={item.url} alt={item.style} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
