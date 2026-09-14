from typing import List, Optional
from pydantic import BaseModel, Field


class DimensionWeights(BaseModel):
    long_term_goals: float = Field(0.90, description="Trọng số: Mục tiêu lâu dài (0.0 - 1.0)")
    core_values: float = Field(0.85, description="Trọng số: Giá trị sống (0.0 - 1.0)")
    communication: float = Field(0.80, description="Trọng số: Giao tiếp & Giải quyết mâu thuẫn (0.0 - 1.0)")
    lifestyle_habits: float = Field(0.70, description="Trọng số: Lối sống & Thói quen (0.0 - 1.0)")
    interests: float = Field(0.60, description="Trọng số: Sở thích & Giải trí (0.0 - 1.0)")
    finances: float = Field(0.75, description="Trọng số: Tài chính & Tính thực tế (0.0 - 1.0)")
    future_plans: float = Field(0.85, description="Trọng số: Kế hoạch tương lai & Định cư (0.0 - 1.0)")


class UserProfile(BaseModel):
    user_id: str = Field("usr_001", description="ID người dùng")
    name: str = Field("Hải Nam", description="Tên người dùng")
    age: int = Field(28, description="Tuổi")
    relationship_goal: str = Field("Nghiêm túc, kết hôn trong 2-3 năm", description="Mục tiêu quan hệ")
    deal_breakers: List[str] = Field(
        default_factory=lambda: ["Không hút thuốc lá", "Yêu động vật"],
        description="Điều không thể thỏa hiệp"
    )
    lifestyle: str = Field("Dậy sớm, chạy bộ, cafe sáng, coi trọng sự nghiệp", description="Lối sống đặc trưng")
    dimension_weights: DimensionWeights = Field(default_factory=DimensionWeights, description="Trọng số 7 trục tương thích")
    private_incognito: bool = Field(False, description="Chế độ ẩn danh (không lưu phân tích vào lịch sử)")
    additional_notes: Optional[str] = Field(None, description="Ghi chú thêm của người dùng")
