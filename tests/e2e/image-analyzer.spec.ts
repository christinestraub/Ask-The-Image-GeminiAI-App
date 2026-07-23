import { expect, test } from "@playwright/test";

const fixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const successPayload = {
  requestId: "35c7d2a0-0e8d-4a8d-8a4f-5ecfe26f06c5",
  summary:
    "A compact blue image fixture with a simple, uniform composition.",
  answer: "Blue is the dominant visible color.",
  detectedDetails: [
    {
      label: "Color field",
      description: "A saturated blue field fills the available frame.",
      confidence: "high",
    },
    {
      label: "Composition",
      description: "No separate objects are distinguishable in the fixture.",
      confidence: "medium",
    },
  ],
  uncertainty: ["The fixture is too small to support fine-grained details."],
  safetyNotes: [],
};

async function selectFixture(page: import("@playwright/test").Page) {
  await page.locator('input[type="file"]').setInputFiles({
    name: "blue-fixture.png",
    mimeType: "image/png",
    buffer: fixture,
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("uploads an image and renders a structured analysis", async ({ page }) => {
  await page.route("**/api/analyze-image", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successPayload),
    });
  });

  await expect(
    page.getByRole("heading", {
      name: "Bring an image. Leave with what matters.",
    }),
  ).toBeVisible();

  await selectFixture(page);
  await expect(page.getByAltText("Preview of blue-fixture.png")).toBeVisible();
  await page
    .getByLabel("Ask something specific")
    .fill("Which color dominates?");
  await page.getByRole("button", { name: "Analyze image" }).click();

  await expect(page.getByText(successPayload.summary)).toBeVisible();
  await expect(
    page.getByText("Blue is the dominant visible color."),
  ).toBeVisible();
  await expect(page.getByText("2 observations")).toBeVisible();
  await expect(page.getByText("high confidence")).toBeVisible();
});

test("gives a useful error and supports retry", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/analyze-image", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "5c9e50f8-d0bc-4ed4-a21b-56f2899dc50d",
          error: {
            code: "PROVIDER_UNAVAILABLE",
            message: "The analysis provider is temporarily unavailable.",
            retryable: true,
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successPayload),
    });
  });

  await selectFixture(page);
  await page.getByRole("button", { name: "Analyze image" }).click();
  await expect(page.locator(".error-state")).toContainText(
    "The analysis provider is temporarily unavailable.",
  );

  await page.getByRole("button", { name: "Try analysis again" }).click();
  await expect(page.getByText(successPayload.summary)).toBeVisible();
});

test("supports direct navigation, refresh, and security headers", async ({
  page,
  request,
}) => {
  await page.reload();
  await expect(page.getByRole("main")).toBeVisible();

  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
});
