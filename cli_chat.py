#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
CLARA TERMINAL CHAT & TEST ENVIRONMENT
Giao diện tương tác trực tiếp với Dating Compatibility Agent (Clara) qua Terminal.
Hỗ trợ song ngữ: Tiếng Việt (🇻🇳) và Tiếng Nhật (🇯🇵).
Không cần khởi động Frontend UI, hỗ trợ kiểm thử prompt, hội thoại nhiều lượt,
ghi chú sau hẹn hò (/note / /メモ) và xem bản đồ tương thích 7 trục radar (/analyze / /分析).
"""

import sys
import os
import asyncio
from typing import List, Optional

# Cấu hình UTF-8 cho Windows Terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stdin.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Thêm root vào sys.path để chạy trực tiếp không cần cài package
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from backend.config import settings
from backend.services.data_store import data_store
from backend.engines.compatibility_engine import compatibility_engine
from backend.engines.copilot_engine import copilot_engine
from backend.engines.observation_engine import observation_engine
from backend.engines.guardrails import guardrails
from backend.services.claude_client import claude_client
from backend.models.analysis import ChatMessage, AnalyzeResponseData
from backend.models.candidate import CandidateProfile
from backend.models.user import UserProfile
from backend import i18n
# Database
from backend.database.engine import create_all_tables, AsyncSessionLocal
from backend.database.seed import seed_initial_data


# ==========================
# BẢNG MÀU TERMINAL (ANSI)
# ==========================
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    
    # Text colors
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"


def colorize(text: str, color: str) -> str:
    return f"{color}{text}{Colors.RESET}"


def make_bar(value: int, total: int = 100, length: int = 16) -> str:
    """Tạo thanh tiến trình trực quan trong terminal"""
    filled = int(round(length * (value / total)))
    empty = length - filled
    if value >= 80:
        bar_color = Colors.GREEN
    elif value >= 60:
        bar_color = Colors.YELLOW
    else:
        bar_color = Colors.RED
    return f"[{bar_color}{'█' * filled}{Colors.DIM}{'░' * empty}{Colors.RESET}] {value:3d}%"


def select_language() -> str:
    """Language selection menu — shown once at startup"""
    print(f"\n{Colors.MAGENTA}{Colors.BOLD}╔══════════════════════════════════════════════════════════════════════════════╗")
    print(f"║           {i18n.get('lang_select_title', 'vi')}              ║")
    print(f"╚══════════════════════════════════════════════════════════════════════════════╝{Colors.RESET}")
    print(f"  {Colors.CYAN}{i18n.get('lang_opt_vi', 'vi')}{Colors.RESET}")
    print(f"  {Colors.CYAN}{i18n.get('lang_opt_ja', 'vi')}{Colors.RESET}")

    while True:
        try:
            choice = input(f"\n{Colors.YELLOW}{i18n.get('lang_select_prompt', 'vi')}{Colors.RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            choice = "1"
        if choice == "1":
            return "vi"
        elif choice == "2":
            return "ja"
        else:
            print(f"{Colors.RED}{i18n.get('lang_invalid', 'vi')}{Colors.RESET}")


class ClaraTerminalChat:
    def __init__(self, lang: str = "vi"):
        self.lang = lang
        self.user: Optional[UserProfile] = None  # loaded async in chat_loop
        data_store.set_active_lang(lang)
        self.candidate: Optional[CandidateProfile] = None
        self.analysis: Optional[AnalyzeResponseData] = None
        self.history: List[ChatMessage] = []
        self.streaming_enabled: bool = True

    def t(self, key: str) -> str:
        """Shorthand for i18n.get(key, self.lang)"""
        return i18n.get(key, self.lang)

    def print_banner(self):
        age_label = self.t("banner_age")
        goal_label = self.t("banner_goal_label")
        banner = f"""
{Colors.MAGENTA}{Colors.BOLD}╔══════════════════════════════════════════════════════════════════════════════╗
║              {self.t("banner_title"):<52}  ║
║              {self.t("banner_subtitle"):<52}  ║
╚══════════════════════════════════════════════════════════════════════════════╝{Colors.RESET}
  {Colors.CYAN}• {self.t("banner_user_label")}:{Colors.RESET} {self.user.name} ({self.user.age} {age_label}) | {goal_label}: {self.user.relationship_goal}
  {Colors.CYAN}• {self.t("banner_engine_label")}:{Colors.RESET} {f"{Colors.GREEN}{self.t('banner_engine_claude')} ({settings.claude_model}){Colors.RESET}" if claude_client.is_available else f"{Colors.YELLOW}{self.t('banner_engine_local')}{Colors.RESET}"}
  {Colors.DIM}• {self.t("banner_hint")}{Colors.RESET}
"""
        print(banner)

    async def select_candidate_menu(self, db) -> CandidateProfile:
        candidates = await data_store.list_candidates(db=db, lang=self.lang)
        print(f"\n{Colors.BOLD}{self.t('candidate_menu_title')}{Colors.RESET}")
        for idx, cand in enumerate(candidates, 1):
            tags_str = ", ".join(cand.tags[:3])
            # Country flag based on candidate_id prefix
            flag = "🇯🇵" if cand.candidate_id.startswith("cand_jp") else "🇻🇳"
            print(f"  {Colors.CYAN}[{idx}]{Colors.RESET} {flag} {Colors.BOLD}{cand.name}{Colors.RESET} ({cand.age} {self.t('banner_age')}) - {cand.job} ({cand.location})")
            bio_preview = cand.bio[:70]
            print(f"      {Colors.DIM}{self.t('candidate_bio_label')}: {bio_preview}...{Colors.RESET}")
            print(f"      {Colors.DIM}{self.t('candidate_tags_label')}: [{tags_str}]{Colors.RESET}")

        while True:
            prompt = self.t("candidate_select_prompt").replace("{n}", str(len(candidates)))
            choice = input(f"\n{Colors.YELLOW}{prompt}{Colors.RESET}").strip()
            if choice.isdigit() and 1 <= int(choice) <= len(candidates):
                return candidates[int(choice) - 1]
            for cand in candidates:
                if choice.lower() in [cand.candidate_id.lower(), cand.name.lower()]:
                    return cand
            print(f"{Colors.RED}{self.t('candidate_invalid')}{Colors.RESET}")

    async def initialize_candidate(self, candidate: CandidateProfile, db):
        self.candidate = candidate
        self.history = []
        analyzing_msg = self.t("candidate_analyzing").replace("{name}", candidate.name)
        print(f"\n{Colors.DIM}{analyzing_msg}{Colors.RESET}")
        self.analysis = await compatibility_engine.analyze(self.user, self.candidate, lang=self.lang)
        await data_store.save_analysis(self.analysis, db=db, lang=self.lang)

        # In tóm tắt ngắn gọn
        self.print_quick_scorecard()

    def print_quick_scorecard(self):
        if not self.analysis or not self.candidate:
            return
        
        print("\n" + "─" * 78)
        print(f" {Colors.BOLD}{self.t('scorecard_profile')}:{Colors.RESET} {Colors.MAGENTA}{self.candidate.name}{Colors.RESET} ({self.candidate.age} {self.t('banner_age')}, {self.candidate.job})")
        print(f" {Colors.BOLD}{self.t('scorecard_compat')}:{Colors.RESET} {make_bar(self.analysis.overall_compatibility)}  |  {Colors.BOLD}{self.t('scorecard_completeness')}:{Colors.RESET} {make_bar(self.analysis.data_completeness)}")
        print(f" {Colors.DIM}{self.t('scorecard_confidence')}: {self.analysis.confidence_level} ({self.analysis.confidence_detail}){Colors.RESET}")
        print("─" * 78)

        # Điểm phù hợp nổi bật
        if self.analysis.checklist.matched:
            print(f" {Colors.GREEN}{Colors.BOLD}{self.t('scorecard_matched')}{Colors.RESET}")
            for m in self.analysis.checklist.matched[:2]:
                print(f"   • {Colors.BOLD}{m.title}{Colors.RESET}: {m.detail}")

        # Điểm cần xác nhận
        if self.analysis.checklist.needs_check:
            print(f" {Colors.YELLOW}{Colors.BOLD}{self.t('scorecard_needs_check')}{Colors.RESET}")
            for n in self.analysis.checklist.needs_check[:2]:
                print(f"   • {Colors.BOLD}{n.title}{Colors.RESET}: {n.detail}")

        # Gợi ý mở đầu
        if self.analysis.icebreakers:
            print(f" {Colors.CYAN}{Colors.BOLD}{self.t('scorecard_icebreaker')}{Colors.RESET}")
            print(f"   \"{self.analysis.icebreakers[0]}\"")
        print("─" * 78)
        print(f"{Colors.DIM}{self.t('scorecard_hint')}{Colors.RESET}\n")

    def print_full_analysis(self):
        if not self.analysis or not self.candidate:
            print(f"{Colors.RED}{self.t('analysis_title')} — N/A{Colors.RESET}")
            return

        print("\n" + "=" * 78)
        print(f" {self.t('analysis_title')} — {self.candidate.name.upper()}")
        print("=" * 78)
        
        # 1. Bảng 7 trục Radar
        print(f"\n{Colors.BOLD}{self.t('analysis_radar')}{Colors.RESET}")
        for axis in self.analysis.radar_axes:
            print(f"  • {axis.label:<26} {make_bar(axis.value)}")

        evidence_label = self.t("analysis_evidence")

        # 2. Checklist Matched
        print(f"\n{Colors.GREEN}{Colors.BOLD}{self.t('analysis_matched')}{Colors.RESET}")
        for item in self.analysis.checklist.matched:
            print(f"  {Colors.GREEN}✓{Colors.RESET} {Colors.BOLD}{item.title}{Colors.RESET}")
            print(f"    {item.detail}")
            print(f"    {Colors.DIM}{evidence_label}: {item.source_evidence}{Colors.RESET}")

        # 3. Checklist Needs Check
        print(f"\n{Colors.YELLOW}{Colors.BOLD}{self.t('analysis_needs_check')}{Colors.RESET}")
        for item in self.analysis.checklist.needs_check:
            print(f"  {Colors.YELLOW}?{Colors.RESET} {Colors.BOLD}{item.title}{Colors.RESET}")
            print(f"    {item.detail}")
            print(f"    {Colors.DIM}{evidence_label}: {item.source_evidence}{Colors.RESET}")

        # 4. Checklist Potential Friction (nếu có)
        if self.analysis.checklist.potential_friction:
            print(f"\n{Colors.RED}{Colors.BOLD}{self.t('analysis_friction')}{Colors.RESET}")
            for item in self.analysis.checklist.potential_friction:
                print(f"  {Colors.RED}!{Colors.RESET} {Colors.BOLD}{item.title}{Colors.RESET}")
                print(f"    {item.detail}")
                print(f"    {Colors.DIM}{evidence_label}: {item.source_evidence}{Colors.RESET}")

        # 5. Câu hỏi sâu
        print(f"\n{Colors.CYAN}{Colors.BOLD}{self.t('analysis_probe')}{Colors.RESET}")
        for idx, q in enumerate(self.analysis.probing_questions, 1):
            print(f"  {idx}. \"{q}\"")

        print("=" * 78 + "\n")

    async def handle_date_note(self, note_text: str):
        """Ghi chú sau buổi hẹn -> Kích hoạt Engine 3 để tái phân tích"""
        if not self.candidate or not self.analysis:
            print(f"{Colors.RED}{self.t('note_no_candidate')}{Colors.RESET}")
            return

        if not note_text.strip():
            print(f"{Colors.YELLOW}{self.t('note_empty')}{Colors.RESET}")
            return

        print(f"\n{Colors.CYAN}{self.t('note_processing')}{Colors.RESET}")
        
        # Lưu vào data_store
        if self.lang == "ja":
            time_str = "たった今記録"
        else:
            time_str = "Vừa ghi nhận qua Terminal"
        data_store.add_observation(self.candidate.candidate_id, note_text, time_str)

        # Gọi Observation Engine
        re_res = await observation_engine.reanalyze(
            candidate=self.candidate,
            user=self.user,
            note=note_text,
            prev_analysis=self.analysis,
            lang=self.lang
        )

        # Cập nhật state nội bộ
        self.analysis.overall_compatibility = re_res.updated_overall_compatibility
        self.analysis.data_completeness = re_res.updated_data_completeness
        self.analysis.confidence_level = re_res.confidence_level
        if re_res.updated_radar_axes:
            self.analysis.radar_axes = re_res.updated_radar_axes

        print(f"\n{Colors.GREEN}{Colors.BOLD}✨ {self.t('note_updated_title')}{Colors.RESET}")
        print(f"  • {self.t('note_compat_new')}: {make_bar(re_res.updated_overall_compatibility)}")
        print(f"  • {self.t('note_completeness_new')}: {make_bar(re_res.updated_data_completeness)} ({re_res.confidence_level})")

        if re_res.promoted_items:
            print(f"\n{Colors.BOLD}  🚀 {self.t('note_promoted_title')}{Colors.RESET}")
            for p in re_res.promoted_items:
                print(f"    • {Colors.YELLOW}{p.from_category}{Colors.RESET} ➔ {Colors.GREEN}{p.to_category}{Colors.RESET}: {Colors.BOLD}{p.title}{Colors.RESET}")
                print(f"      {p.new_detail}")

        if re_res.coach_note:
            print(f"\n  {Colors.MAGENTA}{Colors.BOLD}{self.t('note_coach')}:{Colors.RESET} {re_res.coach_note}")

        if re_res.next_date_ideas:
            print(f"\n  {Colors.CYAN}{Colors.BOLD}{self.t('note_next_date')}{Colors.RESET}")
            for idea in re_res.next_date_ideas:
                print(f"    - {idea}")

        print("\n" + "─" * 78 + "\n")

    def print_help(self):
        print(f"""
{Colors.BOLD}{self.t('help_title')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_analyze')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_note')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_switch')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_history')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_stream')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_clear')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_help')}{Colors.RESET}
  {Colors.CYAN}{self.t('help_exit')}{Colors.RESET}

{Colors.BOLD}{self.t('help_samples_title')}{Colors.RESET}
  {self.t('help_sample_1')}
  {self.t('help_sample_2')}
  {self.t('help_sample_3')}
  {self.t('help_sample_4')}
""")

    def print_history(self):
        if not self.history:
            print(f"{Colors.YELLOW}{self.t('history_empty')}{Colors.RESET}")
            return
        cand_name = self.candidate.name if self.candidate else ""
        print(f"\n{Colors.BOLD}{self.t('history_title')} ({cand_name}):{Colors.RESET}")
        for msg in self.history:
            role_label = f"{Colors.CYAN}{self.t('history_you')}{Colors.RESET}" if msg.role == "user" else f"{Colors.MAGENTA}{self.t('history_clara')}{Colors.RESET}"
            print(f"[{role_label}]: {msg.content}\n")

    async def chat_loop(self):
        # Bootstrap DB (idempotent)
        await create_all_tables()
        async with AsyncSessionLocal() as db:
            await seed_initial_data(db)

        async with AsyncSessionLocal() as db:
            self.user = await data_store.get_user(db=db, lang=self.lang)
            self.print_banner()
            candidate = await self.select_candidate_menu(db)
            await self.initialize_candidate(candidate, db)

            while True:
                try:
                    prompt_str = self.t("chat_prompt")
                    user_input = input(f"{Colors.CYAN}{Colors.BOLD}{prompt_str}{Colors.RESET}").strip()
                except (KeyboardInterrupt, EOFError):
                    print(f"\n{Colors.MAGENTA}{self.t('exit_interrupt')}{Colors.RESET}")
                    break

                if not user_input:
                    continue

                # Xử lý các câu lệnh đặc biệt (slash commands)
                cmd_lower = user_input.lower()

                # ── EXIT ──────────────────────────────────────────────
                if cmd_lower in ["/exit", "exit", "quit", ":q"]:
                    print(f"\n{Colors.MAGENTA}{self.t('exit_bye')}{Colors.RESET}")
                    break

                # ── HELP ──────────────────────────────────────────────
                elif cmd_lower in ["/help", "/h", "help", "/ヘルプ"]:
                    self.print_help()
                    continue

                # ── ANALYZE (VI: /analyze | JA: /分析) ───────────────
                elif cmd_lower in ["/analyze", "/a", "analyze", "/分析", "/ぶんせき"]:
                    self.print_full_analysis()
                    continue

                # ── NOTE (VI: /note | JA: /メモ) ─────────────────────
                elif cmd_lower.startswith("/note") or cmd_lower.startswith("/メモ") or cmd_lower.startswith("/めも"):
                    if cmd_lower.startswith("/note"):
                        note_content = user_input[5:].strip()
                    elif cmd_lower.startswith("/メモ"):
                        note_content = user_input[3:].strip()
                    else:
                        note_content = user_input[3:].strip()
                    await self.handle_date_note(note_content, db)
                    continue

                # ── SWITCH ────────────────────────────────────────────
                elif cmd_lower in ["/switch", "/s", "/きりかえ", "/切替"]:
                    candidate = await self.select_candidate_menu(db)
                    await self.initialize_candidate(candidate, db)
                    continue

                # ── HISTORY ───────────────────────────────────────────
                elif cmd_lower in ["/history", "/れきし", "/履歴"]:
                    self.print_history()
                    continue

                # ── STREAM ────────────────────────────────────────────
                elif cmd_lower in ["/stream", "/ストリーム"]:
                    self.streaming_enabled = not self.streaming_enabled
                    status_key = "stream_on" if self.streaming_enabled else "stream_off"
                    print(f"{Colors.YELLOW}{self.t(status_key)}{Colors.RESET}")
                    continue

                # ── CLEAR ─────────────────────────────────────────────
                elif cmd_lower in ["/clear", "cls", "clear"]:
                    os.system("cls" if os.name == "nt" else "clear")
                    self.print_banner()
                    self.print_quick_scorecard()
                    continue

                # ── Kiểm tra Guardrails an toàn tài chính / hành vi trước
                is_risky, safety_msg = guardrails.check_input_safety(user_input, lang=self.lang)
                if safety_msg:
                    safety_title = self.t("safety_title")
                    print(f"\n{Colors.RED}{Colors.BOLD}╔══════════════════════════════════════════════════════════════════════════════╗")
                    print(f"║  {safety_title:<73} ║")
                    print(f"╚══════════════════════════════════════════════════════════════════════════════╝{Colors.RESET}")
                    print(f"{Colors.YELLOW}{safety_msg}{Colors.RESET}\n")

                # Gửi tin nhắn đến Clara Copilot Engine
                clara_label = self.t("chat_clara_label")
                print(f"{Colors.MAGENTA}{Colors.BOLD}{clara_label}:{Colors.RESET} ", end="", flush=True)

                try:
                    # 1. Nếu bật streaming và Claude khả dụng
                    if self.streaming_enabled and claude_client.is_available:
                        full_reply = ""
                        async for chunk in copilot_engine.stream_chat(
                            query=user_input,
                            user=self.user,
                            candidate=self.candidate,
                            analysis=self.analysis,
                            history=self.history,
                            lang=self.lang
                        ):
                            print(chunk, end="", flush=True)
                            full_reply += chunk
                        print("\n")

                        # Lưu vào history
                        self.history.append(ChatMessage(role="user", content=user_input))
                        self.history.append(ChatMessage(role="assistant", content=full_reply))

                    else:
                        # 2. Chế độ đồng bộ (hoặc Fallback Engine cục bộ)
                        response_data = await copilot_engine.chat(
                            query=user_input,
                            user=self.user,
                            candidate=self.candidate,
                            analysis=self.analysis,
                            history=self.history,
                            lang=self.lang
                        )

                        print(response_data.message)

                        # In cảnh báo an toàn nếu chưa in ở trên
                        if response_data.safety_reminder and not safety_msg:
                            print(f"\n{Colors.RED}{Colors.BOLD}⚠️  {response_data.safety_reminder}{Colors.RESET}")

                        # In danh sách gợi ý hành động
                        if response_data.recommendations:
                            recs_label = self.t("chat_recommendations")
                            print(f"\n{Colors.CYAN}{Colors.BOLD}{recs_label}{Colors.RESET}")
                            for rec in response_data.recommendations:
                                print(f"  {Colors.WHITE}• {rec}{Colors.RESET}")

                        print()

                        # Lưu vào history
                        self.history.append(ChatMessage(role="user", content=user_input))
                        self.history.append(ChatMessage(role="assistant", content=response_data.message))

                except Exception as e:
                    err_label = self.t("chat_error")
                    print(f"\n{Colors.RED}{err_label}: {e}{Colors.RESET}\n")



def main():
    lang = select_language()
    chat_app = ClaraTerminalChat(lang=lang)
    asyncio.run(chat_app.chat_loop())


if __name__ == "__main__":
    main()
