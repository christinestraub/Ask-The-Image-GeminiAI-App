import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  ImageValidationError,
  prepareImage,
} from "@/lib/image";
import { MAX_IMAGE_BYTES } from "@/lib/limits";

async function png(width = 12, height = 12) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#315cfa",
    },
  })
    .png()
    .toBuffer();
}

describe("prepareImage", () => {
  it("normalizes a valid PNG to an inline JPEG", async () => {
    const source = await png();
    const result = await prepareImage(
      new File([source], "fixture.png", { type: "image/png" }),
    );

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.original).toMatchObject({
      width: 12,
      height: 12,
      format: "png",
    });
    expect(result.data.length).toBeGreaterThan(20);
  });

  it("rejects a spoofed MIME type", async () => {
    const source = await png();
    const action = prepareImage(
      new File([source], "fixture.jpg", { type: "image/jpeg" }),
    );

    await expect(action).rejects.toMatchObject({
      code: "INVALID_IMAGE",
    });
  });

  it("rejects corrupt and oversized files", async () => {
    await expect(
      prepareImage(
        new File(["not an image"], "broken.png", { type: "image/png" }),
      ),
    ).rejects.toBeInstanceOf(ImageValidationError);

    await expect(
      prepareImage(
        new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toMatchObject({
      code: "IMAGE_TOO_LARGE",
    });
  });

  it("rejects images above 16 megapixels", async () => {
    const source = await png(5_000, 4_000);

    await expect(
      prepareImage(
        new File([source], "too-many-pixels.png", { type: "image/png" }),
      ),
    ).rejects.toMatchObject({
      code: "IMAGE_DIMENSIONS_EXCEEDED",
    });
  });
});
