import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const analyzeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/gemini")>();
  return {
    ...actual,
    analyzeImageWithGemini: analyzeMock,
  };
});

import { GeminiAnalysisError } from "@/lib/gemini";
import { MAX_IMAGE_BYTES } from "@/lib/limits";

import { POST } from "./route";

const analysis = {
  summary: "A blue square used as a test fixture.",
  answer: null,
  detectedDetails: [
    {
      label: "Blue field",
      description: "The frame is filled with a uniform blue color.",
      confidence: "high" as const,
    },
  ],
  uncertainty: [],
  safetyNotes: [],
};

async function validImage() {
  const buffer = await sharp({
    create: {
      width: 16,
      height: 16,
      channels: 3,
      background: "#315cfa",
    },
  })
    .png()
    .toBuffer();

  return new File([buffer], "fixture.png", { type: "image/png" });
}

function requestWith(formData: FormData, headers?: HeadersInit) {
  return new Request("http://localhost/api/analyze-image", {
    method: "POST",
    body: formData,
    headers,
  });
}

describe("POST /api/analyze-image", () => {
  beforeEach(() => {
    analyzeMock.mockReset();
    analyzeMock.mockResolvedValue(analysis);
  });

  it("returns a structured analysis with a request ID", async () => {
    const formData = new FormData();
    formData.set("image", await validImage());
    formData.set("question", "What color dominates?");

    const response = await POST(requestWith(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toMatchObject(analysis);
    expect(body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(analyzeMock).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "image/jpeg" }),
      "What color dominates?",
    );
  });

  it("accepts an omitted optional question", async () => {
    const formData = new FormData();
    formData.set("image", await validImage());

    const response = await POST(requestWith(formData));

    expect(response.status).toBe(200);
    expect(analyzeMock).toHaveBeenCalledWith(expect.any(Object), null);
  });

  it("rejects missing images and excessive questions", async () => {
    const missingResponse = await POST(requestWith(new FormData()));
    expect(missingResponse.status).toBe(400);
    await expect(missingResponse.json()).resolves.toMatchObject({
      error: { code: "INVALID_IMAGE", retryable: false },
    });

    const longQuestion = new FormData();
    longQuestion.set("image", await validImage());
    longQuestion.set("question", "a".repeat(501));

    const longResponse = await POST(requestWith(longQuestion));
    expect(longResponse.status).toBe(400);
    await expect(longResponse.json()).resolves.toMatchObject({
      error: { code: "QUESTION_TOO_LONG", retryable: false },
    });
  });

  it("rejects oversized request bodies before parsing", async () => {
    const response = await POST(
      requestWith(new FormData(), {
        "content-length": String(MAX_IMAGE_BYTES + 600_000),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "IMAGE_TOO_LARGE" },
    });
  });

  it("returns stable timeout and quota errors", async () => {
    const timeoutForm = new FormData();
    timeoutForm.set("image", await validImage());
    analyzeMock.mockRejectedValueOnce(
      new GeminiAnalysisError(
        "PROVIDER_TIMEOUT",
        "The analysis took too long.",
        true,
      ),
    );

    const timeoutResponse = await POST(requestWith(timeoutForm));
    expect(timeoutResponse.status).toBe(504);
    await expect(timeoutResponse.json()).resolves.toMatchObject({
      error: { code: "PROVIDER_TIMEOUT", retryable: true },
    });

    const quotaForm = new FormData();
    quotaForm.set("image", await validImage());
    analyzeMock.mockRejectedValueOnce(
      new GeminiAnalysisError(
        "PROVIDER_QUOTA_EXCEEDED",
        "The demo limit was reached.",
        true,
      ),
    );

    const quotaResponse = await POST(requestWith(quotaForm));
    expect(quotaResponse.status).toBe(429);
    await expect(quotaResponse.json()).resolves.toMatchObject({
      error: { code: "PROVIDER_QUOTA_EXCEEDED", retryable: true },
    });
  });
});
