from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .user import UserProfile
from .candidate import CandidateProfile


class RadarAxis(BaseModel):
    key: str = Field(..., description="Mã định danh trục (vd: long_term_goals)")
    label: str = Field(..., description="Tên hiển thị tiếng Việt (vd: Mục tiêu lâu dài)")
    value: int = Field(..., ge=0, le=100, description="Điểm số tương thích 0-100")


class DirectComparisonItem(BaseModel):
    criterion: str = Field(..., description="Tiêu chí so sánh")
    user_val: str = Field(..., description="Giá trị của bạn")
    target_val: str = Field(..., description="Giá trị của đối phương")
    status: Literal["matched", "needs_check", "potential_friction"] = Field("matched", description="Trạng thái so sánh")


class ChecklistItem(BaseModel):
    title: str = Field(..., description="Tiêu đề hạng mục")
    detail: str = Field(..., description="Mô tả chi tiết phân tích")
    source_evidence: str = Field(..., description="Căn cứ dữ liệu (Bio, trắc nghiệm, ghi chú)")
    match_score: Optional[int] = Field(None, description="Điểm số khớp (nếu có, 0-100)")


class ChecklistGroup(BaseModel):
    matched: List[ChecklistItem] = Field(default_factory=list, description="Phù hợp & Đồng điệu (Xanh lá)")
    needs_check: List[ChecklistItem] = Field(default_factory=list, description="Cần xác nhận thêm do thiếu dữ liệu (Vàng)")
    potential_friction: List[ChecklistItem] = Field(default_factory=list, description="Điểm khác biệt cần cân nhắc (Đỏ)")


class AnalyzeRequest(BaseModel):
    user_profile: Optional[UserProfile] = Field(None, description="Hồ sơ và tiêu chí của user (nếu None sẽ lấy mặc định)")
    candidate_profile: Optional[CandidateProfile] = Field(None, description="Hồ sơ ứng viên cần phân tích")
    candidate_id: Optional[str] = Field(None, description="ID của ứng viên (nếu lấy từ kho dữ liệu)")
    lang: Optional[str] = Field("vi", description="Ngôn ngữ phân tích ('vi' hoặc 'ja')")


class AnalyzeResponseData(BaseModel):
    analysis_id: str = Field(..., description="ID phiên phân tích")
    candidate_id: str = Field(..., description="ID ứng viên")
    overall_compatibility: int = Field(..., ge=0, le=100, description="Độ tương thích tổng thể %")
    data_completeness: int = Field(..., ge=0, le=100, description="Mức độ đầy đủ dữ liệu %")
    confidence_level: str = Field(..., description="Mức độ tin cậy (vd: Tin cậy khá)")
    confidence_detail: str = Field(..., description="Giải thích cơ sở dữ liệu đã dùng")
    radar_axes: List[RadarAxis] = Field(..., description="Mảng 7 trục radar")
    direct_comparison: List[DirectComparisonItem] = Field(default_factory=list, description="Bảng đối chiếu trực diện")
    checklist: ChecklistGroup = Field(..., description="Checklist 3 tầng phân loại")
    icebreakers: List[str] = Field(default_factory=list, description="Gợi ý câu mở đầu tự nhiên")
    probing_questions: List[str] = Field(default_factory=list, description="3 câu hỏi sâu để kiểm chứng các điểm cần xác nhận")
    summary_narrative: Optional[str] = Field(None, description="Lời nhắn nhủ tổng quan từ Clara Coach")


class AnalyzeResponse(BaseModel):
    status: str = Field("success")
    data: AnalyzeResponseData


# --- Chat Contracts ---
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = Field(...)
    content: str = Field(...)


class ChatRequest(BaseModel):
    query: str = Field(..., description="Câu hỏi hoặc chia sẻ của user với Clara Coach")
    candidate_id: Optional[str] = Field(None, description="ID ứng viên đang xem xét")
    analysis_id: Optional[str] = Field(None, description="ID phân tích hiện tại (nếu có)")
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Lịch sử hội thoại trước đó")
    lang: Optional[str] = Field("vi", description="Ngôn ngữ trò chuyện ('vi' hoặc 'ja')")


class ChatResponseData(BaseModel):
    message: str = Field(..., description="Lời phản hồi từ Clara Coach")
    recommendations: List[str] = Field(default_factory=list, description="Các hành động gợi ý thiết thực")
    safety_reminder: Optional[str] = Field(None, description="Nhắc nhở an toàn hẹn hò nếu phát hiện rủi ro")


class ChatResponse(BaseModel):
    status: str = Field("success")
    data: ChatResponseData


# --- Dynamic Re-analysis Contracts ---
class PromotedItem(BaseModel):
    from_category: Literal["needs_check", "potential_friction", "matched"] = Field(...)
    to_category: Literal["matched", "needs_check", "potential_friction"] = Field(...)
    title: str = Field(...)
    new_detail: str = Field(...)
    source_evidence: str = Field(...)


class ReanalyzeRequest(BaseModel):
    candidate_id: str = Field(..., description="ID đối tượng đang theo dõi")
    new_observation_note: str = Field(..., description="Ghi chú quan sát thực tế sau cuộc gặp hoặc trò chuyện")
    previous_analysis_id: Optional[str] = Field(None, description="ID phân tích trước đó")
    lang: Optional[str] = Field("vi", description="Ngôn ngữ phân tích ('vi' hoặc 'ja')")


class ReanalyzeResponseData(BaseModel):
    candidate_id: str = Field(...)
    updated_overall_compatibility: int = Field(..., ge=0, le=100)
    updated_data_completeness: int = Field(..., ge=0, le=100)
    confidence_level: str = Field(...)
    confidence_detail: Optional[str] = Field(None)
    promoted_items: List[PromotedItem] = Field(default_factory=list)
    updated_radar_axes: List[RadarAxis] = Field(default_factory=list)
    updated_checklist: Optional[ChecklistGroup] = Field(None)
    coach_note: Optional[str] = Field(None, description="Lời khuyên cập nhật từ Clara")
    next_date_ideas: List[str] = Field(default_factory=list, description="Gợi ý cho buổi hẹn tiếp theo")


class ReanalyzeResponse(BaseModel):
    status: str = Field("success")
    data: ReanalyzeResponseData
