import { generateText } from "ai";
import { HOT_ISSUES_SUMMARY_FETCH_TIMEOUT_MS } from "./constants";

const SUMMARY_MODEL = "anthropic/claude-haiku-4.5";
const SUMMARY_MAX_CHARS = 400;

// TASK-BE-5 steps 3: 요약 생성 실패는 배치 전체를 막지 않고 해당 항목만 summary=null로 저장한다.
export async function summarizeInKorean(title: string, excerpt: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HOT_ISSUES_SUMMARY_FETCH_TIMEOUT_MS);
  try {
    const { text } = await generateText({
      model: SUMMARY_MODEL,
      abortSignal: controller.signal,
      prompt:
        `다음 개발/기술 이슈를 한국어로 2~3문장, ${SUMMARY_MAX_CHARS}자 이내로 요약해줘. ` +
        `설명 없이 요약 문장만 출력해.\n\n제목: ${title}\n본문 발췌: ${excerpt.slice(0, 4000)}`,
    });
    const summary = text.trim();
    return summary.length > 0 ? summary.slice(0, SUMMARY_MAX_CHARS) : null;
  } catch (e) {
    console.error("hot-issue summary generation failed", { title, error: e });
    return null;
  } finally {
    clearTimeout(timer);
  }
}
