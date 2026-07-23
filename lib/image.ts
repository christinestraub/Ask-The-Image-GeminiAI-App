import sharp from "sharp";

import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_EDGE,
  MAX_IMAGE_PIXELS,
  NORMALIZED_MAX_EDGE,
} from "@/lib/limits";

export { MAX_IMAGE_BYTES } from "@/lib/limits";

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const FORMAT_TO_MIME = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type ImageValidationCode =
  | "INVALID_IMAGE"
  | "IMAGE_TOO_LARGE"
  | "IMAGE_DIMENSIONS_EXCEEDED";

export class ImageValidationError extends Error {
  constructor(
    public readonly code: ImageValidationCode,
    message: string,
  ) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export type PreparedImage = {
  data: string;
  mimeType: "image/jpeg";
  original: {
    width: number;
    height: number;
    format: "jpeg" | "png" | "webp";
  };
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new ImageValidationError(
      "INVALID_IMAGE",
      "Choose a JPEG, PNG, or WebP image.",
    );
  }

  if (file.size === 0) {
    throw new ImageValidationError(
      "INVALID_IMAGE",
      "The selected image is empty.",
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError(
      "IMAGE_TOO_LARGE",
      "Choose an image smaller than 4 MB.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const processor = sharp(buffer, {
      failOn: "warning",
      limitInputPixels: 70_000_000,
    });
    const metadata = await processor.metadata();
    const format = metadata.format;
    const width = metadata.width;
    const height = metadata.height;

    if (
      !format ||
      !(format in FORMAT_TO_MIME) ||
      !width ||
      !height ||
      FORMAT_TO_MIME[format as keyof typeof FORMAT_TO_MIME] !== file.type
    ) {
      throw new ImageValidationError(
        "INVALID_IMAGE",
        "The file contents do not match a supported image format.",
      );
    }

    if (
      width > MAX_IMAGE_EDGE ||
      height > MAX_IMAGE_EDGE ||
      width * height > MAX_IMAGE_PIXELS
    ) {
      throw new ImageValidationError(
        "IMAGE_DIMENSIONS_EXCEEDED",
        "Choose an image no larger than 16 megapixels.",
      );
    }

    const normalized = await processor
      .rotate()
      .resize({
        width: NORMALIZED_MAX_EDGE,
        height: NORMALIZED_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#f5f8f7" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();

    return {
      data: normalized.toString("base64"),
      mimeType: "image/jpeg",
      original: {
        width,
        height,
        format: format as PreparedImage["original"]["format"],
      },
    };
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }

    throw new ImageValidationError(
      "INVALID_IMAGE",
      "The image is corrupt or cannot be decoded.",
    );
  }
}
