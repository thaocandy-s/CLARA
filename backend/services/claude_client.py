import json
import re
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from anthropic import Anthropic, AsyncAnthropic
from ..config import settings

logger = logging.getLogger("clara.claude_client")


class ClaudeClient:
    def __init__(self):
        self.api_key = settings.anthropic_api_key.strip() if settings.anthropic_api_key else ""
        self.model = settings.claude_model
        self.sync_client: Optional[Anthropic] = None
        self.async_client: Optional[AsyncAnthropic] = None
        
        if self.api_key and not self.api_key.startswith("your-"):
            try:
                self.sync_client = Anthropic(api_key=self.api_key)
                self.async_client = AsyncAnthropic(api_key=self.api_key)
                logger.info(f"Khởi tạo Claude Client thành công với model: {self.model}")
            except Exception as e:
                logger.warning(f"Không thể khởi tạo Anthropic client: {e}. Sẽ dùng fallback mode.")
        else:
            logger.info("Chưa có ANTHROPIC_API_KEY hợp lệ. Hệ thống sẽ kích hoạt Fallback AI Engine.")

    @property
    def is_available(self) -> bool:
        return self.sync_client is not None and bool(self.api_key)

    def extract_json(self, text: str) -> Dict[str, Any]:
        """Trích xuất và parse JSON an toàn từ phản hồi LLM"""
        text = text.strip()
        
        # Tìm khối ```json ... ```
        json_block_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if json_block_match:
            text = json_block_match.group(1).strip()
            
        # Tìm cặp ngoặc { ... } ngoài cùng
        brace_match = re.search(r"(\{[\s\S]*\})", text)
        if brace_match:
            text = brace_match.group(1).strip()
            
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Lỗi parse JSON từ Claude: {e}\nNội dung: {text[:200]}")
            raise ValueError(f"Không thể parse JSON từ kết quả Claude: {e}")

    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2, lang: str = "vi") -> Dict[str, Any]:
        """Gọi Claude API yêu cầu output dạng JSON có cấu trúc"""
        if not self.is_available:
            raise RuntimeError("Claude API Key chưa được thiết lập hoặc không hợp lệ.")

        if lang == "ja":
            instruction = (
                "【重要】回答はすべて日本語で記述し、指定されたスキーマに従った有効なJSON文字列のみを返してください。"
                "挨拶や前置き、解説文は含めず、JSONの前後に余計なテキストを一切出力しないでください。"
            )
        else:
            instruction = (
                "QUAN TRỌNG: Chỉ trả về duy nhất chuỗi JSON hợp lệ theo đúng schema yêu cầu. "
                "Không bao gồm lời chào, không giải thích ngoài lề, không đặt văn bản trước hoặc sau chuỗi JSON."
            )

        prompt_with_instructions = (
            f"{user_prompt}\n\n"
            f"{instruction}"
        )

        response = await self.async_client.messages.create(
            model=self.model,
            max_tokens=6000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt_with_instructions}],
            extra_body={"temperature": temperature}
        )

        raw_text = response.content[0].text
        return self.extract_json(raw_text)

    async def generate_chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7
    ) -> str:
        """Gọi Claude trò chuyện tự nhiên"""
        if not self.is_available:
            raise RuntimeError("Claude API Key chưa được thiết lập.")

        response = await self.async_client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=system_prompt,
            messages=messages,
            extra_body={"temperature": temperature}
        )
        return response.content[0].text

    async def generate_chat_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Stream phản hồi từ Claude dạng SSE"""
        if not self.is_available:
            raise RuntimeError("Claude API Key chưa được thiết lập.")

        stream = await self.async_client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=system_prompt,
            messages=messages,
            stream=True,
            extra_body={"temperature": temperature}
        )

        async for event in stream:
            if event.type == "content_block_delta" and hasattr(event.delta, "text"):
                yield event.delta.text


claude_client = ClaudeClient()
