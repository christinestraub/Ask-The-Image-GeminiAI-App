import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const detectedDetailSchema = z.object({
  label: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  confidence: confidenceSchema,
});

export const imageAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(1_200),
  answer: z.string().trim().min(1).max(1_200).nullable(),
  detectedDetails: z.array(detectedDetailSchema).min(1).max(12),
  uncertainty: z.array(z.string().trim().min(1).max(300)).max(6),
  safetyNotes: z.array(z.string().trim().min(1).max(300)).max(6),
});

export const analyzeImageResponseSchema = imageAnalysisSchema.extend({
  requestId: z.string().uuid(),
});

export const apiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "INVALID_IMAGE",
  "IMAGE_TOO_LARGE",
  "IMAGE_DIMENSIONS_EXCEEDED",
  "QUESTION_TOO_LONG",
  "RATE_LIMITED",
  "PROVIDER_AUTHENTICATION_FAILED",
  "PROVIDER_QUOTA_EXCEEDED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "INVALID_PROVIDER_RESPONSE",
  "INTERNAL_ERROR",
]);

export const apiErrorResponseSchema = z.object({
  requestId: z.string().uuid(),
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;
export type AnalyzeImageResponse = z.infer<typeof analyzeImageResponseSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
