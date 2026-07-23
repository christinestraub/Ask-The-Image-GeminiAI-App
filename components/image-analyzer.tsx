"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  analyzeImageResponseSchema,
  apiErrorResponseSchema,
  type AnalyzeImageResponse,
} from "@/lib/contracts";
import { MAX_IMAGE_BYTES } from "@/lib/limits";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Status = "idle" | "analyzing" | "success" | "error";

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12m-5-5 5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10.5 3.5 3.5L16 5.5" />
    </svg>
  );
}

export function ImageAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeImageResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function chooseFile(nextFile: File | null) {
    if (!nextFile) {
      return;
    }

    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      setStatus("error");
      setErrorMessage("Choose a JPEG, PNG, or WebP image.");
      setRequestId(null);
      return;
    }

    if (nextFile.size > MAX_IMAGE_BYTES) {
      setStatus("error");
      setErrorMessage("Choose an image smaller than 4 MB.");
      setRequestId(null);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
    setRequestId(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function analyze() {
    if (!file) {
      setStatus("error");
      setErrorMessage("Choose an image before starting the analysis.");
      return;
    }

    setStatus("analyzing");
    setErrorMessage(null);
    setRequestId(null);

    const formData = new FormData();
    formData.set("image", file);
    if (question.trim()) {
      formData.set("question", question.trim());
    }

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const parsedError = apiErrorResponseSchema.safeParse(payload);
        if (parsedError.success) {
          setRequestId(parsedError.data.requestId);
          throw new Error(parsedError.data.error.message);
        }
        throw new Error("The image could not be analyzed. Try again.");
      }

      const parsedResult = analyzeImageResponseSchema.safeParse(payload);
      if (!parsedResult.success) {
        throw new Error("The analysis response was incomplete. Try again.");
      }

      setResult(parsedResult.data);
      setRequestId(parsedResult.data.requestId);
      setStatus("success");
    } catch (error) {
      setResult(null);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The image could not be analyzed. Try again.",
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze();
  }

  const hasResult = status === "success" && result;

  return (
    <section
      className="analyzer-shell"
      aria-label="Image analysis workspace"
      aria-busy={status === "analyzing"}
    >
      <form className="input-panel" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <div>
            <p className="panel-index">Input / 01</p>
            <h2>Choose your frame</h2>
          </div>
          {file && (
            <button
              className="text-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace image
            </button>
          )}
        </div>

        <div
          className={`drop-zone ${dragActive ? "is-dragging" : ""} ${
            previewUrl ? "has-preview" : ""
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDragActive(false);
            }
          }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="preview-stage">
              <Image
                src={previewUrl}
                alt={`Preview of ${file?.name ?? "selected image"}`}
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
                unoptimized
              />
              <span className="registration top-left" aria-hidden="true" />
              <span className="registration top-right" aria-hidden="true" />
              <span className="registration bottom-left" aria-hidden="true" />
              <span className="registration bottom-right" aria-hidden="true" />
              {status === "analyzing" && (
                <div className="scan-state" role="status">
                  <span className="scan-line" aria-hidden="true" />
                  <span>Reading visual evidence…</span>
                </div>
              )}
            </div>
          ) : (
            <label className="upload-invitation" htmlFor="image-upload">
              <span className="upload-icon">
                <UploadIcon />
              </span>
              <strong>Drop an image into the field</strong>
              <span>or choose one from your device</span>
              <small>JPEG, PNG, or WebP · 4 MB maximum</small>
            </label>
          )}
        </div>

        {file && (
          <div className="file-readout" aria-label="Selected image details">
            <span>{file.name}</span>
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}

        <div className="question-field">
          <div className="field-label">
            <label htmlFor="question">Ask something specific</label>
            <span>Optional</span>
          </div>
          <textarea
            id="question"
            value={question}
            maxLength={500}
            rows={3}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: What makes this workspace feel calm?"
          />
          <span className="character-count">{question.length} / 500</span>
        </div>

        <button
          className="analyze-button"
          type="submit"
          disabled={!file || status === "analyzing"}
        >
          <span>
            {status === "analyzing" ? "Analyzing image" : "Analyze image"}
          </span>
          <ArrowIcon />
        </button>
      </form>

      <div className="results-panel" aria-live="polite">
        <div className="panel-heading">
          <div>
            <p className="panel-index">Output / 02</p>
            <h2>What the image says</h2>
          </div>
          {hasResult && (
            <span className="complete-badge">
              <CheckIcon />
              Complete
            </span>
          )}
        </div>

        {status === "error" && (
          <div className="error-state" role="alert">
            <span className="error-mark" aria-hidden="true">
              !
            </span>
            <div>
              <h3>Analysis stopped</h3>
              <p>{errorMessage}</p>
              {requestId && <small>Request {requestId}</small>}
              {file && (
                <button type="button" onClick={() => void analyze()}>
                  Try analysis again
                </button>
              )}
            </div>
          </div>
        )}

        {(status === "idle" || status === "analyzing") && (
          <div className="empty-results">
            <div className="aperture" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h3>
              {status === "analyzing"
                ? "Looking closely"
                : "Your analysis will appear here"}
            </h3>
            <p>
              {status === "analyzing"
                ? "Separating visible evidence from interpretation and uncertainty."
                : "Choose a clear image, add a question if you have one, then begin the analysis."}
            </p>
            <ul className="output-preview" aria-label="Analysis sections">
              <li>Summary</li>
              <li>Detected details</li>
              <li>Uncertainty</li>
              <li>Safety notes</li>
            </ul>
          </div>
        )}

        {hasResult && (
          <div className="analysis-results">
            <article className="summary-card">
              <p className="result-label">Summary</p>
              <p>{result.summary}</p>
            </article>

            {result.answer && (
              <article className="answer-card">
                <p className="result-label">Answer to your question</p>
                <p>{result.answer}</p>
              </article>
            )}

            <div className="details-section">
              <div className="result-heading">
                <p className="result-label">Detected details</p>
                <span>{result.detectedDetails.length} observations</span>
              </div>
              <div className="detail-list">
                {result.detectedDetails.map((detail, index) => (
                  <article
                    className="detail-item"
                    key={`${detail.label}-${index}`}
                  >
                    <div>
                      <span className="detail-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{detail.label}</h3>
                    </div>
                    <p>{detail.description}</p>
                    <span
                      className={`confidence confidence-${detail.confidence}`}
                    >
                      {detail.confidence} confidence
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <div className="notes-grid">
              <article>
                <p className="result-label">Uncertainty</p>
                {result.uncertainty.length ? (
                  <ul>
                    {result.uncertainty.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No material uncertainties were identified.</p>
                )}
              </article>
              <article>
                <p className="result-label">Safety notes</p>
                {result.safetyNotes.length ? (
                  <ul>
                    {result.safetyNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional safety notes for this analysis.</p>
                )}
              </article>
            </div>

            <p className="request-readout">Request {result.requestId}</p>
          </div>
        )}
      </div>
    </section>
  );
}
