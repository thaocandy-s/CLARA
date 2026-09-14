import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.user import UserProfile, DimensionWeights
from backend.models.candidate import CandidateProfile, CandidateQuestionnaire
from backend.engines.compatibility_engine import compatibility_engine
from backend.engines.copilot_engine import copilot_engine
from backend.engines.observation_engine import observation_engine
from backend.engines.guardrails import guardrails
from backend.services.data_store import data_store

client = TestClient(app)


def test_health_check():
    """Kiểm tra endpoint /api/health"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "claude_api_configured" in data


def test_list_candidates():
    """Kiểm tra endpoint /api/candidates"""
    response = client.get("/api/candidates")
    assert response.status_code == 200
    candidates = response.json()
    assert len(candidates) >= 3
    ids = [c["candidate_id"] for c in candidates]
    assert "cand_01" in ids
    assert "cand_02" in ids
    assert "cand_03" in ids


def test_get_candidate_detail():
    """Kiểm tra lấy chi tiết ứng viên Mai Linh"""
    response = client.get("/api/candidates/cand_01")
    assert response.status_code == 200
    cand = response.json()
    assert cand["name"] == "Mai Linh"
    assert "Làm gốm" in cand["tags"]


def test_guardrails():
    """Kiểm tra Engine 4: Bộ lọc an toàn tài chính & đạo đức"""
    is_risky, warning = guardrails.check_input_safety("Bạn này có bảo mình chuyển khoản 5 triệu đầu tư crypto")
    assert is_risky is True
    assert "CẢNH BÁO AN TOÀN TÀI CHÍNH" in warning

    is_risky_safe, _ = guardrails.check_input_safety("Cuối tuần này chúng mình nên đi uống cafe ở đâu?")
    assert is_risky_safe is False

    sanitized = guardrails.sanitize_output("đây là người hoàn hảo 100% cho bạn")
    assert "hoàn hảo 100%" not in sanitized


def test_compatibility_engine():
    """Kiểm tra Engine 1: Phân tích tương thích 7 trục & checklist"""
    import asyncio
    user = data_store.get_user()
    cand = data_store.get_candidate("cand_01")
    assert cand is not None

    result = asyncio.run(compatibility_engine.analyze(user, cand))
    assert 0 <= result.overall_compatibility <= 100
    assert 0 <= result.data_completeness <= 100
    assert len(result.radar_axes) == 7
    assert len(result.checklist.matched) > 0
    assert len(result.checklist.needs_check) > 0
    assert len(result.icebreakers) >= 2
    assert len(result.probing_questions) >= 2

    # Kiểm tra mọi mục trong checklist đều có căn cứ nguồn (source_evidence)
    for item in result.checklist.matched:
        assert item.source_evidence != ""
    for item in result.checklist.needs_check:
        assert item.source_evidence != ""


def test_copilot_engine():
    """Kiểm tra Engine 2: Trợ lý Clara Coach trò chuyện theo ngữ cảnh"""
    import asyncio
    user = data_store.get_user()
    cand = data_store.get_candidate("cand_01")
    
    # Test câu hỏi về mở đầu
    res = asyncio.run(copilot_engine.chat("Gợi ý cho mình câu mở đầu với Linh", user, cand))
    assert len(res.message) > 0
    assert len(res.recommendations) > 0

    # Test câu hỏi về tài chính
    res_fin = asyncio.run(copilot_engine.chat("Quan điểm tài chính của Linh thế nào?", user, cand))
    assert "tài chính" in res_fin.message.lower()


def test_observation_engine_reanalysis():
    """Kiểm tra Engine 3: Cập nhật bản đồ tương thích từ ghi chú sau hẹn"""
    import asyncio
    user = data_store.get_user()
    cand = data_store.get_candidate("cand_01")
    note = "Hôm nay cafe ở Thảo Điền, Linh chia sẻ là muốn định cư lâu dài ở TP.HCM và dự định kết hôn sau 2 năm nữa."

    re_res = asyncio.run(observation_engine.reanalyze(cand, user, note))
    assert re_res.updated_data_completeness >= 85
    assert len(re_res.promoted_items) > 0
    assert re_res.promoted_items[0].to_category == "matched"
    assert len(re_res.updated_radar_axes) == 7


def test_api_analyze_and_reanalyze_endpoints():
    """Kiểm tra các endpoint REST API /api/clara/analyze và /reanalyze"""
    # 1. Gọi Analyze API
    res = client.post("/api/clara/analyze", json={"candidate_id": "cand_01"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["data"]["candidate_id"] == "cand_01"
    assert len(data["data"]["radar_axes"]) == 7

    # 2. Gọi Chat API
    chat_res = client.post("/api/clara/chat", json={
        "query": "Linh có thích thú cưng không?",
        "candidate_id": "cand_01"
    })
    assert chat_res.status_code == 200
    assert "message" in chat_res.json()["data"]

    # 3. Gọi Reanalyze API
    re_res = client.post("/api/clara/reanalyze", json={
        "candidate_id": "cand_01",
        "new_observation_note": "Linh đã xác nhận muốn kết hôn trong 2 năm tới và thích sống tại TP.HCM."
    })
    assert re_res.status_code == 200
    re_data = re_res.json()["data"]
    assert re_data["updated_data_completeness"] >= 85
    assert len(re_data["promoted_items"]) > 0
