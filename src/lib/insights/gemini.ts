import "server-only"

import { GoogleGenAI, Type } from "@google/genai"

import type { InsightContext } from "./build-context"
import { SYSTEM_PROMPT } from "./system-prompt"

export type InsightBullet = {
  type: "progress" | "plateau" | "warning"
  text: string
}

export type Insight = {
  headline: string
  bullets: InsightBullet[]
  suggestion: string
}

const TIMEOUT_MS = 20_000

export async function generateInsight(context: InsightContext): Promise<Insight> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const ai = new GoogleGenAI({ apiKey })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: JSON.stringify(context) }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        abortSignal: controller.signal,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            bullets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ["progress", "plateau", "warning"],
                  },
                  text: { type: Type.STRING },
                },
                required: ["type", "text"],
              },
            },
            suggestion: { type: Type.STRING },
          },
          required: ["headline", "bullets", "suggestion"],
        },
      },
    })

    const text = res.text
    if (!text) {
      throw new Error("Gemini returned empty response")
    }
    return JSON.parse(text) as Insight
  } finally {
    clearTimeout(timeout)
  }
}
