import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z } from 'zod';

const MODEL = 'gemini-2.5-flash';
const MAX_BRANCHES = 8;
const MAX_CHILDREN = 5;

const SYSTEM_INSTRUCTION = `당신은 한국어 마인드맵 생성기입니다. 사용자가 주제를 입력하면 그 주제를 중심으로 한 마인드맵을 JSON으로 만드세요.

규칙:
- root: 주제를 짧고 명확하게 (5~15자)
- branches: 주제의 핵심 측면 3~${MAX_BRANCHES}개. 각 라벨은 5~20자
- 각 branch의 children: 0~${MAX_CHILDREN}개의 구체 항목. 각 라벨은 5~20자
- 라벨은 명사구 위주, 한국어로 작성
- 중복·동어반복을 피하고 서로 명확히 구분되는 항목을 고르세요`;

// Gemini structured output용 스키마 (OpenAPI subset).
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    root: { type: SchemaType.STRING },
    branches: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          children: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['label'],
      },
    },
  },
  required: ['root', 'branches'],
};

// 응답 런타임 검증. Gemini가 스키마를 지키더라도 빈 라벨·과도 항목은 한 번 더 거른다.
export const mindmapSchema = z.object({
  root: z.string().trim().min(1).max(40),
  branches: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        children: z.array(z.string().trim().min(1).max(40)).max(MAX_CHILDREN).default([]),
      }),
    )
    .min(1)
    .max(MAX_BRANCHES),
});

export type Mindmap = z.infer<typeof mindmapSchema>;

export async function generateMindmap(topic: string): Promise<Mindmap> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      // SchemaType은 SDK의 enum이고 responseSchema 시그니처가 Schema를 요구하지만
      // 실제 구조는 호환된다. 캐스팅 외에 더 깔끔한 방법이 없다.
      responseSchema: RESPONSE_SCHEMA as never,
    },
  });

  const result = await model.generateContent(topic);
  const raw = result.response.text();
  const parsed = mindmapSchema.parse(JSON.parse(raw));
  return parsed;
}
