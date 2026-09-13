/* ==========================================================================
   CLARA Matching-Coach Interactive Script
   Features:
   - Dynamic 7-Axis SVG Radar Chart Generator (Light Theme Optimized)
   - Interactive AI Clara Chat Simulator with realistic contextual responses
   - Observation Logger & Dynamic Re-analysis Simulation
   - Filter chips toggle
   - Criteria sliders live feedback
   ========================================================================== */

// 1. Radar Chart Generator
function renderRadarChart(containerId, dataPoints) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const totalAxes = dataPoints.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // Grid levels (3 levels: 33%, 66%, 100%)
  const levels = [0.33, 0.66, 1.0];
  let gridPolygons = '';

  levels.forEach(level => {
    const levelPoints = [];
    for (let i = 0; i < totalAxes; i++) {
      const r = radius * level;
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      levelPoints.push(`${x},${y}`);
    }
    gridPolygons += `<polygon points="${levelPoints.join(' ')}" fill="none" stroke="rgba(15, 23, 42, 0.08)" stroke-width="1"/>`;
  });

  // Axis lines & labels
  let axisLines = '';
  let labels = '';

  dataPoints.forEach((point, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    axisLines += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(15, 23, 42, 0.12)" stroke-width="1"/>`;

    // Label position (slightly offset outward)
    const labelR = radius + 22;
    const lx = center + labelR * Math.cos(angle);
    const ly = center + labelR * Math.sin(angle) + 4;
    
    // Text anchor depending on side
    let anchor = 'middle';
    if (Math.cos(angle) > 0.3) anchor = 'start';
    else if (Math.cos(angle) < -0.3) anchor = 'end';

    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" fill="#475569" font-size="9.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600">${point.label}</text>`;
  });

  // Data Polygon
  const userPolygonPoints = [];
  dataPoints.forEach((point, i) => {
    const score = point.value / 100; // 0 to 1
    const r = radius * score;
    const angle = i * angleSlice - Math.PI / 2;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    userPolygonPoints.push(`${x},${y}`);
  });

  const svgContent = `
    <svg width="100%" height="100%" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e11d48" stop-opacity="0.45"/>
          <stop offset="60%" stop-color="#db2777" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
      ${gridPolygons}
      ${axisLines}
      <polygon points="${userPolygonPoints.join(' ')}" fill="url(#radarGrad)" stroke="#e11d48" stroke-width="2.5"/>
      ${userPolygonPoints.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3.5" fill="#fff" stroke="#e11d48" stroke-width="2"/>`).join('')}
      ${labels}
    </svg>
  `;

  container.innerHTML = svgContent;
}

// 2. Chat Simulator
function setupChatSimulator() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');

  if (!chatMessages || !chatInput || !sendBtn) return;

  function appendMessage(sender, text, recommendations = null) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;

    let recHtml = '';
    if (recommendations && recommendations.length > 0) {
      recHtml = `
        <div class="agent-recommendation-card">
          <div class="rec-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Gợi ý hành động từ Clara
          </div>
          <ul class="rec-list">
            ${recommendations.map(r => `<li class="rec-item">${r}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="bubble-content">
        ${text}
        ${recHtml}
      </div>
    `;

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleUserQuery(userText) {
    if (!userText.trim()) return;

    appendMessage('user', userText);
    chatInput.value = '';

    // Simulate Agent Thinking
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message-bubble agent';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="bubble-content" style="display:flex; gap:6px; align-items:center;">
        <span style="font-size:0.75rem; color:#64748b;">CLARA đang đối chiếu tiêu chí...</span>
      </div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      typingIndicator.remove();
      const lower = userText.toLowerCase();

      if (lower.includes('mở đầu') || lower.includes('bắt đầu') || lower.includes('icebreaker')) {
        appendMessage('agent', 
          `Dựa trên hồ sơ của Mai Linh, cô ấy có niềm đam mê đặc biệt với <strong>thiết kế sản phẩm (UI/UX)</strong> và rất thích <strong>workshop làm gốm cuối tuần</strong>.`,
          [
            `"Chào Linh, anh thấy em nhắc tới gốm Bát Tràng trong bio. Em hay đi workshop vào cuối tuần à, có địa chỉ nào thú vị không gợi ý anh với?"`,
            `"Thấy em làm Product Design, phong cách thiết kế tối giản hay playful hợp vibe em hơn?"`
          ]
        );
      } else if (lower.includes('hỏi gì') || lower.includes('câu hỏi') || lower.includes('tiếp theo')) {
        appendMessage('agent',
          `Hồ sơ của hai bạn có độ tương thích cao về <strong>mục tiêu định hướng nghiêm túc</strong> và <strong>gu thẩm mỹ</strong>. Tuy nhiên, dữ liệu về <em>cân bằng công việc/cuộc sống</em> của Linh chưa rõ nét (cô ấy có nhắc tới việc 'đang chạy nước rút cho startup').`,
          [
            `Hỏi khéo léo về nhịp sinh hoạt: "Đợt này startup của em có chiếm nhiều thời gian cuối tuần không?"`,
            `Làm rõ giá trị: "Khi rảnh rỗi hiếm hoi, em thích ở nhà sạc năng lượng hay đi ra ngoài tụ tập bạn bè?"`,
            `Xác nhận kế hoạch tương lai: "Em dự định phát triển sự nghiệp tại TP.HCM lâu dài hay có ý định đi xa?"`
          ]
        );
      } else if (lower.includes('tài chính') || lower.includes('tiền') || lower.includes('sở thích')) {
        appendMessage('agent',
          `⚠️ <strong>Lưu ý về độ đầy đủ dữ liệu</strong>: Profile của Linh không có thông tin trực tiếp về phong cách quản lý tài chính cá nhân (tiết kiệm vs tận hưởng). Bạn đã đặt đây là một trong các tiêu chí cần lưu ý.<br><br>💡 Lời khuyên: Đừng hỏi quá dồn dập về tiền bạc ở buổi đầu. Hãy quan sát qua thói quen lựa chọn địa điểm hẹn hoặc quan điểm chi tiêu khi đi du lịch.`
        );
      } else {
        appendMessage('agent',
          `Tôi đã ghi nhận câu hỏi của bạn. Nhìn chung, giữa bạn và đối phương có <strong>75% điểm tương đồng về lối sống</strong>. Điểm cần bạn tự xác minh thêm trong buổi gặp là: <em>mức độ ưu tiên gia đình so với sự nghiệp trong 2 năm tới</em>. Bạn có muốn lưu lại điểm này vào checklist ghi nhớ không?`,
          [
            `Gợi ý địa điểm hẹn lý tưởng: Một quán cafe có không gian yên tĩnh, nhiều cây xanh tại Quận 1 hoặc workshop trải nghiệm.`,
            `Nhắc nhở: Hãy giữ tâm thế cởi mở, Agent chỉ hỗ trợ góc nhìn, cảm xúc trực tiếp khi gặp mặt mới là yếu tố quyết định!`
          ]
        );
      }
    }, 900);
  }

  sendBtn.addEventListener('click', () => handleUserQuery(chatInput.value));
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserQuery(chatInput.value);
  });

  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-query') || chip.innerText;
      handleUserQuery(text);
    });
  });
}

// 3. Self-Logged Observations & Agent Dynamic Recalculation
function setupObservationLogger() {
  const addBtn = document.getElementById('btn-add-note');
  const noteInput = document.getElementById('note-input');
  const notesContainer = document.getElementById('logged-notes-container');
  const recalculateBtn = document.getElementById('btn-recalculate-analysis');
  const confidenceFill = document.getElementById('candidate-confidence-fill');
  const confidencePercent = document.getElementById('candidate-confidence-pct');

  if (!addBtn || !noteInput || !notesContainer) return;

  addBtn.addEventListener('click', () => {
    const val = noteInput.value.trim();
    if (!val) return;

    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item newly-added';
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} Hôm nay`;

    noteDiv.innerHTML = `
      <div class="note-time">${timeStr} · Ghi nhận bởi bạn</div>
      <div>${val}</div>
    `;

    notesContainer.prepend(noteDiv);
    noteInput.value = '';

    // Show prompt to update AI analysis
    if (recalculateBtn) {
      recalculateBtn.style.animation = 'pulse-dot 1.5s infinite';
      recalculateBtn.classList.remove('btn-secondary');
      recalculateBtn.classList.add('btn-primary');
      recalculateBtn.innerText = '✨ Phân tích lại với dữ liệu mới này';
    }
  });

  if (recalculateBtn) {
    recalculateBtn.addEventListener('click', () => {
      recalculateBtn.innerText = 'Đang phân tích...';
      recalculateBtn.disabled = true;

      setTimeout(() => {
        recalculateBtn.innerText = '✓ Đã cập nhật phân tích tương thích';
        recalculateBtn.disabled = false;
        recalculateBtn.classList.remove('btn-primary');
        recalculateBtn.classList.add('btn-secondary');
        recalculateBtn.style.animation = 'none';

        if (confidenceFill && confidencePercent) {
          confidenceFill.style.width = '88%';
          confidencePercent.innerText = '88%';
        }

        // Notification alert
        alert('CLARA Agent đã tích hợp ghi chú thực tế của bạn vào bản đồ tương thích! Mức độ đầy đủ dữ liệu tăng lên 88%.');
      }, 1000);
    });
  }
}

// 4. Tag Filter Toggle
function setupFilterTags() {
  const tagBtns = document.querySelectorAll('.tag-btn');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
    });
  });
}

// 5. Sliders Live Feedback in Preferences
function setupSlidersFeedback() {
  const rangeInputs = document.querySelectorAll('.range-input');
  rangeInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const targetId = e.target.getAttribute('data-display-target');
      if (targetId) {
        const displayElem = document.getElementById(targetId);
        if (displayElem) displayElem.innerText = `${e.target.value}%`;
      }
    });
  });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupChatSimulator();
  setupObservationLogger();
  setupFilterTags();
  setupSlidersFeedback();
});
