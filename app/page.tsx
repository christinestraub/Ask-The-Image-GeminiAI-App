import { ImageAnalyzer } from "@/components/image-analyzer";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Ask the Image home">
          <span className="wordmark-mark" aria-hidden="true">
            <span />
          </span>
          <span>Ask the Image</span>
        </Link>
        <div className="header-status">
          <span aria-hidden="true" />
          Gemini vision demo
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Visual intelligence, made inspectable</p>
        <h1 id="page-title">
          Bring an image.
          <br />
          Leave with <em>what matters.</em>
        </h1>
        <p className="hero-copy">
          Examine scenes, objects, and visual evidence with a structured
          analysis that names both its findings and its uncertainty.
        </p>
      </section>

      <ImageAnalyzer />

      <footer className="site-footer">
        <p>Images are processed in memory and are not stored.</p>
        <p>AI analysis can be inaccurate. Verify important details.</p>
      </footer>
    </main>
  );
}
