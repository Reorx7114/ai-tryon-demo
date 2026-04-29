import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

type TryOnProvider = "openai" | "forge" | "demo";

type TryOnResult = {
  imageUrl: string;
  provider: TryOnProvider;
  demoMode: boolean;
  message: string;
};

const tryOnInputSchema = z.object({
  personImage: z.string().min(32),
  clothingImage: z.string().min(32),
  productName: z.string().min(1).max(80),
  styleNote: z.string().max(500).optional(),
});

function buildTryOnPrompt(productName: string, styleNote?: string) {
  return [
    "Create a commercial virtual try-on product image.",
    "Use the first image as the customer/person reference and preserve the person's face, pose, body proportion, and identity as much as possible.",
    "Use the second image as the clothing/product reference and preserve its color, neckline, silhouette, sleeve length, texture, and overall design as much as possible.",
    `Garment/product name: ${productName}.`,
    styleNote ? `Extra styling note: ${styleNote}.` : "",
    "Make the result look like a clean e-commerce fitting preview, realistic lighting, natural fabric placement, no extra logos, no text overlay.",
  ]
    .filter(Boolean)
    .join("\n");
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { blob: new Blob([buffer], { type: mimeType }), mimeType };
}

function demoImageDataUrl(productName: string): string {
  const safeProductName = productName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 60);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365" viewBox="0 0 1024 1365">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff7ed"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </linearGradient>
      <linearGradient id="dress" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fb7185"/>
        <stop offset="100%" stop-color="#f97316"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1365" fill="url(#bg)"/>
    <circle cx="512" cy="235" r="92" fill="#f2c6a0"/>
    <path d="M380 420 C405 330 620 330 644 420 L710 995 C720 1075 304 1075 314 995 Z" fill="url(#dress)"/>
    <path d="M356 430 C275 520 245 670 248 828" stroke="#f2c6a0" stroke-width="54" stroke-linecap="round" fill="none"/>
    <path d="M668 430 C749 520 779 670 776 828" stroke="#f2c6a0" stroke-width="54" stroke-linecap="round" fill="none"/>
    <path d="M410 421 C458 465 565 468 614 421" stroke="#fff7ed" stroke-width="18" fill="none" stroke-linecap="round"/>
    <rect x="192" y="1116" width="640" height="118" rx="28" fill="#ffffff" opacity="0.88"/>
    <text x="512" y="1164" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#111827">Demo mode preview</text>
    <text x="512" y="1206" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#475569">${safeProductName}</text>
    <text x="512" y="1276" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">Set OPENAI_API_KEY to generate real try-on images.</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function generateWithOpenAI(input: z.infer<typeof tryOnInputSchema>): Promise<TryOnResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const person = dataUrlToBlob(input.personImage);
  const clothing = dataUrlToBlob(input.clothingImage);
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5");
  form.append("image[]", person.blob, `person.${person.mimeType.split("/")[1] || "png"}`);
  form.append("image[]", clothing.blob, `clothing.${clothing.mimeType.split("/")[1] || "png"}`);
  form.append("prompt", buildTryOnPrompt(input.productName, input.styleNote));
  form.append("size", "1024x1536");
  form.append("quality", "medium");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI image edit failed: ${response.status} ${response.statusText}${detail ? ` - ${detail}` : ""}`);
  }

  const result = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const first = result.data?.[0];
  const imageUrl = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : first?.url;
  if (!imageUrl) {
    throw new Error("OpenAI image edit did not return an image");
  }

  return {
    imageUrl,
    provider: "openai",
    demoMode: false,
    message: "已使用 OpenAI Images API 生成試穿圖。",
  };
}

async function generateWithForge(input: z.infer<typeof tryOnInputSchema>): Promise<TryOnResult | null> {
  try {
    const result = await generateImage({
      prompt: buildTryOnPrompt(input.productName, input.styleNote),
      originalImages: [
        { url: input.personImage },
        { url: input.clothingImage },
      ],
    });

    if (!result.url) return null;

    return {
      imageUrl: result.url,
      provider: "forge",
      demoMode: false,
      message: "已使用內建圖片服務生成試穿圖。",
    };
  } catch {
    return null;
  }
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  tryOn: router({
    generate: publicProcedure
      .input(tryOnInputSchema)
      .mutation(async ({ input }) => {
        const openAIResult = await generateWithOpenAI(input);
        if (openAIResult) return openAIResult;

        const forgeResult = await generateWithForge(input);
        if (forgeResult) return forgeResult;

        return {
          imageUrl: demoImageDataUrl(input.productName),
          provider: "demo",
          demoMode: true,
          message: "目前是 Demo 模式：流程已接好，但尚未偵測到 OPENAI_API_KEY 或可用圖片服務。",
        } satisfies TryOnResult;
      }),
  }),
});

export type AppRouter = typeof appRouter;
