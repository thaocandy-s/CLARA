import re
from typing import Optional, Tuple


class SafetyGuardrails:
    """Engine 4: Bộ lọc an toàn, đạo đức & bảo vệ quyền riêng tư hẹn hò"""

    SENSITIVE_FINANCIAL_PATTERNS = [
        r"chuyển khoản",
        r"vay tiền",
        r"mượn tiền",
        r"đầu tư tài chính",
        r"tiền mã hóa",
        r"crypto",
        r"chứng khoán",
        r"mã otp",
        r"tài khoản ngân hàng",
        # Japanese financial patterns
        r"振込",
        r"送金",
        r"仮想通貨",
        r"暗号資産",
        r"投資詐欺",
        r"口座番号",
        r"otp番号",
        r"銀行口座",
        r"お金貸して",
        r"お金借りて",
    ]

    RISKY_MEETING_PATTERNS = [
        r"khách sạn ngay lần đầu",
        r"về nhà riêng lần đầu",
        r"nơi vắng vẻ",
        r"đưa đón tận nhà khi chưa quen",
        # Japanese risky meeting patterns
        r"初回にホテル",
        r"初回の家",
        r"人気のない場所",
        r"人気の少ない場所",
    ]

    ETHICAL_DISCLAIMER = (
        "💡 CLARA Coach: Mọi phân tích chỉ mang tính chất tham khảo dựa trên thông tin được chia sẻ. "
        "CLARA không đánh giá phẩm giá con người và không thay thế trực giác, cảm xúc thực tế của bạn."
    )

    def check_input_safety(self, text: str, lang: str = "vi") -> Tuple[bool, Optional[str]]:
        """Kiểm tra câu hỏi của user có kích hoạt cảnh báo an toàn hẹn hò không"""
        lower = text.lower()

        # Kiểm tra rủi ro tài chính
        for pat in self.SENSITIVE_FINANCIAL_PATTERNS:
            if re.search(pat, lower):
                if lang == "ja":
                    return True, (
                        "⚠️ 金銭的安全警告: 初めて会った相手に銀行口座を教えたり、身元不明の投資に実際のお金を振り込んだりしないでください。"
                    )
                return True, (
                    "⚠️ CẢNH BÁO AN TOÀN TÀI CHÍNH: Tuyệt đối không chia sẻ thông tin thẻ, "
                    "không chuyển tiền hoặc tham gia đầu tư tài chính với người mới quen qua mạng."
                )

        # Kiểm tra an toàn buổi hẹn
        for pat in self.RISKY_MEETING_PATTERNS:
            if re.search(pat, lower):
                if lang == "ja":
                    return True, (
                        "🛡️ 安全アドバイス: 初回のデートでは常に公共の場所（カフェ、ショッピングモールなど）を選び、明るい時間帯に会い、自分で交通手段を用意してください。"
                    )
                return True, (
                    "🛡️ LỜI KHUYÊN AN TOÀN: Trong những buổi hẹn đầu, hãy luôn chọn địa điểm công cộng, "
                    "đông người (quán cafe, trung tâm thương mại) vào ban ngày và tự chủ phương tiện đi lại."
                )

        return False, None

    def sanitize_output(self, text: str, lang: str = "vi") -> str:
        """Đảm bảo output của AI tuân thủ nguyên tắc tôn trọng và không phán xét"""
        # Tránh các câu khẳng định tuyệt đối cực đoan
        if lang == "ja":
            replacements = [
                ("この人はあなたにとって100%完璧な相手です", "この人はあなたと多くの共通点がある相手です"),
                ("二人は必ず結婚する", "二人には真剣な交際を築く良い基盤がありそうです"),
                ("この相手は良くない人です", "この相手にはいくつか慎重に考慮が必要な相違点があります"),
            ]
        else:
            replacements = [
                ("đây là người hoàn hảo 100% cho bạn", "đây là đối tượng có nhiều điểm tương đồng nổi bật với bạn"),
                ("hai bạn chắc chắn sẽ cưới nhau", "hai bạn có cơ sở tốt để tìm hiểu nghiêm túc cùng nhau"),
                ("đối tượng này không tốt", "đối tượng này có một số điểm khác biệt cần bạn cân nhắc kỹ"),
            ]
        sanitized = text
        for old, new in replacements:
            sanitized = sanitized.replace(old, new)
        return sanitized


guardrails = SafetyGuardrails()
