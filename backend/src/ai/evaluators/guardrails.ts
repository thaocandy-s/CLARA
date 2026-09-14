import { HttpError } from "../../shared/http.js";

const BANNED = [
  /người này kém/i,
  /đối tượng kém/i,
  /kém chất lượng/i,
  /劣った人/,
  /人間として劣/,
  /rối loạn nhân cách/i,
  /chẩn đoán tâm lý/i,
  /narcissist/i,
  /an toàn tuyệt đối/i,
  /điểm khớp đảm bảo an toàn/i,
  /safe because .{0,40}compat/i,
  /hãy hỏi lương ngay/i,
  /hỏi mức lương buổi đầu/i,
  /初回で年収を聞け/,
];

export const assertGuardrails = (text: string) => {
  for (const pattern of BANNED) {
    if (pattern.test(text)) {
      throw new HttpError(422, "LLM_SCHEMA", "Output failed Clara guardrails");
    }
  }
};
