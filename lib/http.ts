import type {
  ApiErrorCode,
  ApiErrorResponse,
} from "@/lib/contracts";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json",
};

export function errorResponse(
  requestId: string,
  status: number,
  code: ApiErrorCode,
  message: string,
  retryable = false,
): Response {
  const body: ApiErrorResponse = {
    requestId,
    error: {
      code,
      message,
      retryable,
    },
  };

  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}
