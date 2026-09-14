# -*- coding: utf-8 -*-
"""
Bộ Testcase Kịch bản Kiểm thử Toàn diện cho Clara Dating Compatibility Agent.
Bao gồm:
1. Multi-turn conversation (Hội thoại nhiều lượt với lịch sử ngữ cảnh)
2. Cá nhân hóa theo từng ứng viên (Mai Linh vs Tuấn Anh vs Minh Châu)
3. Bộ lọc an toàn tài chính & đạo đức (Guardrails)
4. Sinh câu mở đầu (Icebreakers) & câu hỏi khai thác sâu (Probing questions)
5. Cập nhật bản đồ tương thích từ ghi chú sau hẹn (Observation Engine & Re-analysis)
6. Stream chat phản hồi từng token
"""

import pytest
import asyncio
from backend.services.data_store import data_store
from backend.engines.compatibility_engine import compatibility_engine
from backend.engines.copilot_engine import copilot_engine
from backend.engines.observation_engine import observation_engine
from backend.engines.guardrails import guardrails
from backend.models.analysis import ChatMessage


@pytest.fixture
def test_user():
    return data_store.get_user()


@pytest.fixture
def candidate_mai_linh():
    return data_store.get_candidate("cand_01")


@pytest.fixture
def candidate_tuan_anh():
    return data_store.get_candidate("cand_02")


@pytest.fixture
def candidate_minh_chau():
    return data_store.get_candidate("cand_03")


def test_multi_turn_conversation_flow(test_user, candidate_mai_linh):
    """
    Kịch bản 1: Hội thoại nhiều lượt liên tiếp (Multi-turn conversation).
    Kiểm tra Agent nhớ và tiếp nối ngữ cảnh qua từng câu hỏi.
    """
    async def _run():
        history = []
        cand = candidate_mai_linh
        analysis = await compatibility_engine.analyze(test_user, cand)

        # Lượt 1: Hỏi câu mở đầu
        turn1_query = "Gợi ý cho mình cách mở đầu tự nhiên với Linh"
        res1 = await copilot_engine.chat(turn1_query, test_user, cand, analysis, history)
        assert len(res1.message) > 0
        assert len(res1.recommendations) >= 2
        assert res1.safety_reminder is None

        # Cập nhật lịch sử
        history.append(ChatMessage(role="user", content=turn1_query))
        history.append(ChatMessage(role="assistant", content=res1.message))
        assert len(history) == 2

        # Lượt 2: Hỏi sâu về chủ đề nhạy cảm (quan điểm tài chính)
        turn2_query = "Quan điểm tài chính của Linh thế nào, mình có nên hỏi thẳng không?"
        res2 = await copilot_engine.chat(turn2_query, test_user, cand, analysis, history)
        assert len(res2.message) > 0
        assert any("tài chính" in rec.lower() or "quan sát" in rec.lower() for rec in res2.recommendations) or "tài chính" in res2.message.lower()

        history.append(ChatMessage(role="user", content=turn2_query))
        history.append(ChatMessage(role="assistant", content=res2.message))
        assert len(history) == 4

        # Lượt 3: Chuẩn bị cho buổi gặp đầu tiên
        turn3_query = "Lần đầu gặp mặt tụi mình nên hẹn ở đâu để an toàn và thoải mái?"
        res3 = await copilot_engine.chat(turn3_query, test_user, cand, analysis, history)
        assert len(res3.message) > 0
        assert any("cafe" in rec.lower() or "an toàn" in rec.lower() or "không gian" in rec.lower() for rec in res3.recommendations) or "an toàn" in res3.message.lower()

    asyncio.run(_run())


def test_candidate_specific_context_personalization(test_user, candidate_mai_linh, candidate_tuan_anh, candidate_minh_chau):
    """
    Kịch bản 2: Kiểm tra tính cá nhân hóa theo từng ứng viên.
    Câu trả lời cho Mai Linh (Designer/Gốm) phải khác với Tuấn Anh (Bác sĩ) và Minh Châu (Content/Nhiếp ảnh).
    """
    async def _run():
        # 1. Mai Linh -> Đề cập đến Thiết kế / Gốm
        res_linh = await copilot_engine.chat("Mở đầu câu chuyện thế nào?", test_user, candidate_mai_linh)
        assert "linh" in res_linh.message.lower() or any("gốm" in r.lower() or "product" in r.lower() or "thiết kế" in r.lower() for r in res_linh.recommendations)

        # 2. Phân tích Tuấn Anh -> Radar giá trị sống cao, lối sống thấp hơn do trực đêm
        analysis_anh = await compatibility_engine.analyze(test_user, candidate_tuan_anh)
        axes_map_anh = {axis.key: axis.value for axis in analysis_anh.radar_axes}
        assert axes_map_anh["core_values"] >= 90
        assert axes_map_anh["lifestyle_habits"] <= 70  # Lệch pha ca trực đêm

        # 3. Phân tích Minh Châu -> Khác biệt về kế hoạch tương lai (châu Âu remote)
        analysis_chau = await compatibility_engine.analyze(test_user, candidate_minh_chau)
        axes_map_chau = {axis.key: axis.value for axis in analysis_chau.radar_axes}
        assert axes_map_chau["future_plans"] <= 60  # Khác biệt kế hoạch tương lai
        assert len(analysis_chau.checklist.potential_friction) > 0

    asyncio.run(_run())


def test_guardrails_scam_and_financial_safety():
    """
    Kịch bản 3: Bộ lọc an toàn (Guardrails) phát hiện lời mời gọi rủi ro.
    Chống các hành vi lừa đảo nạp tiền, crypto, chuyển khoản.
    """
    # Test 1: Rủi ro tài chính rõ ràng
    is_risky_crypto, warning1 = guardrails.check_input_safety("Linh rủ mình nạp tiền vào sàn crypto để kiếm lời nhanh")
    assert is_risky_crypto is True
    assert "CẢNH BÁO AN TOÀN TÀI CHÍNH" in warning1

    # Test 2: Rủi ro chuyển khoản mượn tiền
    is_risky_wire, warning2 = guardrails.check_input_safety("Đối phương nhờ mình chuyển khoản gấp 10 triệu để xoay sở công việc")
    assert is_risky_wire is True
    assert "chuyển khoản" in warning2.lower() or "tài chính" in warning2.lower()

    # Test 3: Câu hỏi bình thường không bị kích hoạt nhầm
    is_risky_normal, warning3 = guardrails.check_input_safety("Hôm nay chúng mình nên đi ăn món gì ở quận 1?")
    assert is_risky_normal is False
    assert warning3 is None


def test_probing_questions_and_icebreakers(test_user, candidate_mai_linh):
    """
    Kịch bản 4: Kiểm tra khả năng tạo Icebreakers và Probing questions.
    Mỗi ứng viên phải có ít nhất 2 câu mở đầu và 2 câu hỏi đào sâu.
    """
    async def _run():
        analysis = await compatibility_engine.analyze(test_user, candidate_mai_linh)
        
        # Kiểm tra icebreakers
        assert len(analysis.icebreakers) >= 2
        for icebreaker in analysis.icebreakers:
            assert len(icebreaker.strip()) > 10

        # Kiểm tra probing questions
        assert len(analysis.probing_questions) >= 2
        for q in analysis.probing_questions:
            assert len(q.strip()) > 10

        # Kiểm tra bằng chứng nguồn của checklist
        for item in analysis.checklist.matched:
            assert item.source_evidence != ""
        for item in analysis.checklist.needs_check:
            assert item.source_evidence != ""

    asyncio.run(_run())


def test_observation_note_real_time_reflection(test_user, candidate_mai_linh):
    """
    Kịch bản 5: Sau buổi hẹn, User nạp ghi chú quan sát thực tế.
    Observation Engine phân tích dữ liệu phi cấu trúc, nâng % hoàn thiện và thăng hạng checklist.
    """
    async def _run():
        # 1. Phân tích ban đầu
        prev_analysis = await compatibility_engine.analyze(test_user, candidate_mai_linh)
        initial_completeness = prev_analysis.data_completeness
        assert initial_completeness <= 80

        # 2. Người dùng nạp ghi chú sau buổi hẹn cafe
        date_note = (
            "Hôm nay cafe ở Thảo Điền rất vui. Linh chia sẻ thẳng thắn là rất yêu thích TP.HCM, "
            "dự định gắn bó lâu dài và muốn lập gia đình trong 2 năm tới khi công ty ổn định. "
            "Hai đứa cũng chia sẻ về quan điểm tài chính, Linh rất có kế hoạch chi tiêu rõ ràng."
        )

        # 3. Kích hoạt re-analysis
        re_result = await observation_engine.reanalyze(
            candidate=candidate_mai_linh,
            user=test_user,
            note=date_note,
            prev_analysis=prev_analysis
        )

        # 4. Kiểm chứng kết quả nâng cấp
        assert re_result.updated_data_completeness >= 85
        assert re_result.updated_data_completeness > initial_completeness
        assert re_result.updated_overall_compatibility >= prev_analysis.overall_compatibility
        assert len(re_result.promoted_items) > 0
        assert any(p.to_category == "matched" for p in re_result.promoted_items)
        assert len(re_result.updated_radar_axes) == 7
        assert len(re_result.next_date_ideas) >= 2

    asyncio.run(_run())


def test_stream_chat_generation(test_user, candidate_mai_linh):
    """
    Kịch bản 6: Kiểm tra tính năng stream trả lời từng token (SSE/Chunk).
    """
    async def _run():
        chunks = []
        async for chunk in copilot_engine.stream_chat(
            query="Gợi ý câu mở đầu thú vị",
            user=test_user,
            candidate=candidate_mai_linh
        ):
            chunks.append(chunk)

        assert len(chunks) > 0
        full_text = "".join(chunks)
        assert len(full_text.strip()) > 0

    asyncio.run(_run())
