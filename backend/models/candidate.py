from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CandidateQuestionnaire(BaseModel):
    relationship_goal: Optional[str] = Field(None, description="Mục tiêu mối quan hệ")
    smoking: Optional[str] = Field(None, description="Thói quen hút thuốc")
    pets: Optional[str] = Field(None, description="Quan điểm về thú cưng")
    weekend_habit: Optional[str] = Field(None, description="Thói quen cuối tuần")
    future_plan: Optional[str] = Field(None, description="Kế hoạch tương lai / Định cư")
    financial_view: Optional[str] = Field(None, description="Quan điểm tài chính & chi tiêu")
    communication_style: Optional[str] = Field(None, description="Phong cách giao tiếp / Giải quyết xung đột")
    children_view: Optional[str] = Field(None, description="Quan điểm về con cái")


class CandidateProfile(BaseModel):
    candidate_id: str = Field(..., description="ID hồ sơ ứng viên (vd: cand_01)")
    name: str = Field(..., description="Tên đối tượng")
    age: int = Field(..., description="Tuổi")
    job: str = Field(..., description="Nghề nghiệp")
    location: str = Field("TP.HCM", description="Địa điểm / Khu vực")
    distance_km: float = Field(3.5, description="Khoảng cách giả lập (km)")
    avatar_gradient: Optional[str] = Field(None, description="Gradient hiển thị avatar")
    bio: str = Field(..., description="Tiểu sử / Bio tự giới thiệu")
    tags: List[str] = Field(default_factory=list, description="Thẻ đặc trưng (Lối sống, mục tiêu...)")
    quick_ai_summary: Optional[str] = Field(None, description="Nhận định nhanh ban đầu từ Clara")
    questionnaire: CandidateQuestionnaire = Field(default_factory=CandidateQuestionnaire, description="Bảng câu hỏi chi tiết")
    extra_attributes: Dict[str, Any] = Field(default_factory=dict, description="Thuộc tính mở rộng khác")
