import { analyzeImageWithGemini, GeminiAnalysisError } from "@/lib/gemini";
import { errorResponse, NO_STORE_HEADERS } from "@/lib/http";
import { ImageValidationError, prepareImage } from "@/lib/image";
import { MAX_IMAGE_BYTES, MAX_QUESTION_LENGTH } from "@/lib/limits";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 512 * 1024;

function logEvent(
  event: "analysis_completed" | "analysis_rejected" | "analysis_failed",
  requestId: string,
  fields: Record<string, string | number> = {},
) {
  console.info(
    JSON.stringify({
      event,
      requestId,
      ...fields,
    }),
  );
}

function statusForProviderError(error: GeminiAnalysisError): number {
  switch (error.code) {
    case "PROVIDER_AUTHENTICATION_FAILED":
      return 503;
    case "PROVIDER_QUOTA_EXCEEDED":
      return 429;
    case "PROVIDER_TIMEOUT":
      return 504;
    case "INVALID_PROVIDER_RESPONSE":
      return 502;
    default:
      return 503;
  }
}

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > MAX_MULTIPART_BYTES) {
    logEvent("analysis_rejected", requestId, {
      code: "IMAGE_TOO_LARGE",
    });
    return errorResponse(
      requestId,
      413,
      "IMAGE_TOO_LARGE",
      "Choose an image smaller than 4 MB.",
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    logEvent("analysis_rejected", requestId, {
      code: "INVALID_REQUEST",
    });
    return errorResponse(
      requestId,
      400,
      "INVALID_REQUEST",
      "Send one image using multipart form data.",
    );
  }

  const image = formData.get("image");
  const questionValue = formData.get("question");

  if (!(image instanceof File)) {
    logEvent("analysis_rejected", requestId, {
      code: "INVALID_IMAGE",
    });
    return errorResponse(
      requestId,
      400,
      "INVALID_IMAGE",
      "Choose an image to analyze.",
    );
  }

  if (questionValue !== null && typeof questionValue !== "string") {
    return errorResponse(
      requestId,
      400,
      "INVALID_REQUEST",
      "The optional question must be text.",
    );
  }

  const question = questionValue?.trim() || null;
  if (question && question.length > MAX_QUESTION_LENGTH) {
    logEvent("analysis_rejected", requestId, {
      code: "QUESTION_TOO_LONG",
    });
    return errorResponse(
      requestId,
      400,
      "QUESTION_TOO_LONG",
      "Keep the optional question under 500 characters.",
    );
  }

  try {
    const preparedImage = await prepareImage(image);
    const analysis = await analyzeImageWithGemini(preparedImage, question);
    const durationMs = Math.round(performance.now() - startedAt);

    logEvent("analysis_completed", requestId, {
      durationMs,
      width: preparedImage.original.width,
      height: preparedImage.original.height,
    });

    return Response.json(
      {
        requestId,
        ...analysis,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    if (error instanceof ImageValidationError) {
      logEvent("analysis_rejected", requestId, {
        code: error.code,
      });
      const status = error.code === "IMAGE_TOO_LARGE" ? 413 : 400;
      return errorResponse(requestId, status, error.code, error.message);
    }

    if (error instanceof GeminiAnalysisError) {
      logEvent("analysis_failed", requestId, {
        code: error.code,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return errorResponse(
        requestId,
        statusForProviderError(error),
        error.code,
        error.message,
        error.retryable,
      );
    }

    logEvent("analysis_failed", requestId, {
      code: "INTERNAL_ERROR",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return errorResponse(
      requestId,
      500,
      "INTERNAL_ERROR",
      "The image could not be analyzed. Try again.",
      true,
    );
  }
}
