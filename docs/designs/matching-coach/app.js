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

/* ============================================================
   LIVE REFLECTION BRIDGE
   Global radar state — single source of truth for axis values
   ============================================================ */
let radarState = [
  { label: 'Mục tiêu lâu dài', value: 85 },
  { label: 'Giá trị sống',       value: 90 },
  { label: 'Giao tiếp',           value: 80 },
  { label: 'Lối sống & Thói quen', value: 85 },
  { label: 'Sở thích & Giải trí', value: 75 },
  { label: 'Tài chính & Thực tế', value: 65 },
  { label: 'Kế hoạch tương lai', value: 70 }
];

function updateRadar(axisUpdates) {
  if (!axisUpdates || Object.keys(axisUpdates).length === 0) return;
  let changed = false;
  radarState = radarState.map(axis => {
    if (axisUpdates[axis.label] !== undefined) {
      changed = true;
      return { ...axis, value: axisUpdates[axis.label] };
    }
    return axis;
  });
  if (!changed) return;

  const container = document.getElementById('radar-container');
  if (!container) return;

  // Add flash class for animation
  container.classList.add('updating');
  renderRadarChart('radar-container', radarState);
  setTimeout(() => container.classList.remove('updating'), 1400);
}

/* Compute overall average score from current radarState */
function computeOverallScore() {
  const avg = radarState.reduce((sum, a) => sum + a.value, 0) / radarState.length;
  return Math.round(avg);
}

/* Update checklist item in DOM */
function updateChecklistItem(update) {
  const { id, to_status, new_detail, new_source, new_badge_label } = update;
  const item = document.querySelector(`[data-checklist-id="${id}"]`);
  if (!item) return;

  // Update status classes
  item.classList.remove('matched', 'check', 'friction');
  item.classList.add(to_status);

  // Trigger appropriate animation
  item.classList.remove('live-promoted', 'live-flagged', 'newly-added');
  void item.offsetWidth; // force reflow
  if (to_status === 'matched') item.classList.add('live-promoted');
  else if (to_status === 'friction') item.classList.add('live-flagged');
  else item.classList.add('newly-added');

  // Update detail text
  if (new_detail) {
    const detailEl = item.querySelector('.check-item-detail');
    if (detailEl) detailEl.textContent = new_detail;
  }

  // Update source text
  if (new_source) {
    const sourceEl = item.querySelector('.check-data-source');
    if (sourceEl) sourceEl.textContent = 'Nguồn: ' + new_source;
  }

  // Update badge
  const badgeEl = item.querySelector('.badge');
  if (badgeEl) {
    badgeEl.className = '';
    if (to_status === 'matched') badgeEl.className = 'badge badge-match';
    else if (to_status === 'friction') badgeEl.className = 'badge badge-friction';
    else badgeEl.className = 'badge badge-check';
    badgeEl.style.fontSize = '0.65rem';
    badgeEl.textContent = new_badge_label || (to_status === 'matched' ? 'Đã xác nhận ✔' : to_status === 'friction' ? 'Lưu ý' : 'Cần quan sát');
  }

  // Inject "✨ Mới" badge
  const header = item.querySelector('.check-item-header span:first-child');
  if (header) {
    const existing = header.querySelector('.badge-new-insight');
    if (existing) existing.remove();
    const newBadge = document.createElement('span');
    newBadge.className = 'badge-new-insight';
    newBadge.textContent = '✨ Mới';
    header.appendChild(newBadge);
    // Auto-remove after 8 seconds
    setTimeout(() => newBadge.remove(), 8000);
  }
}

/* Show live update toast above radar */
function showLiveToast(message) {
  const radarCard = document.querySelector('.radar-chart-card');
  if (!radarCard) return;
  // Remove existing toast
  const existing = radarCard.querySelector('.live-update-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'live-update-toast';
  toast.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    ${message}
  `;
  radarCard.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* Update overall match % badge */
function updateOverallBadge() {
  const badge = document.getElementById('overall-match-badge');
  if (!badge) return;
  const score = computeOverallScore();
  badge.textContent = `Đồng thuận ${score}%`;
  badge.classList.remove('score-updated');
  void badge.offsetWidth;
  badge.classList.add('score-updated');
  setTimeout(() => badge.classList.remove('score-updated'), 700);
}

/* Master orchestrator: called after every agent response */
function applyLiveUpdate(axisUpdates, checklistUpdates) {
  const hasAxisUpdate = axisUpdates && Object.keys(axisUpdates).length > 0;
  const hasChecklistUpdate = checklistUpdates && checklistUpdates.length > 0;
  if (!hasAxisUpdate && !hasChecklistUpdate) return;

  // Small delay so user reads the chat bubble first
  setTimeout(() => {
    if (hasAxisUpdate) {
      updateRadar(axisUpdates);
      updateOverallBadge();
    }
    if (hasChecklistUpdate) {
      checklistUpdates.forEach(u => updateChecklistItem(u));
    }

    // Compose toast message
    const parts = [];
    if (hasAxisUpdate) parts.push(`Bản đồ radar đã cập nhật (${Object.keys(axisUpdates).length} trục)`);
    if (hasChecklistUpdate) parts.push(`${checklistUpdates.length} mục checklist được cập nhật`);
    showLiveToast(parts.join(' · '));
  }, 800);
}

// 2. Chat Simulator & Real API Integration
const API_BASE = (window.location.protocol === 'file:' || !window.location.port) ? 'http://127.0.0.1:8000' : '';

async function callClaraChatApi(userText) {
  try {
    const res = await fetch(`${API_BASE}/api/clara/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userText,
        candidate_id: 'cand_01'
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn('Backend API offline hoặc chưa bật, chuyển sang fallback:', e);
  }
  return null;
}

async function callClaraReanalyzeApi(noteText) {
  try {
    const res = await fetch(`${API_BASE}/api/clara/reanalyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: 'cand_01',
        new_observation_note: noteText
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn('Backend API offline, chuyển sang fallback:', e);
  }
  return null;
}

function setupChatSimulator() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');

  if (!chatMessages || !chatInput || !sendBtn) return;

  function appendMessage(sender, text, recommendations = null, safetyReminder = null) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;

    let recHtml = '';
    if (recommendations && recommendations.length > 0) {
      recHtml = `
        <div class="agent-recommendation-card">
          <div class="rec-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Gợi ý hành động từ Clara Coach
          </div>
          <ul class="rec-list">
            ${recommendations.map(r => `<li class="rec-item">${r}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let safetyHtml = '';
    if (safetyReminder) {
      safetyHtml = `
        <div style="margin-top:0.6rem; padding:0.5rem 0.75rem; background:rgba(239, 68, 68, 0.1); border-left:3px solid #ef4444; border-radius:6px; font-size:0.75rem; color:#b91c1c;">
          ${safetyReminder}
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="bubble-content">
        ${text}
        ${recHtml}
        ${safetyHtml}
      </div>
    `;

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleUserQuery(userText) {
    if (!userText.trim()) return;

    appendMessage('user', userText);
    chatInput.value = '';

    // Hiển thị trạng thái Clara đang suy luận
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message-bubble agent';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="bubble-content" style="display:flex; gap:6px; align-items:center;">
        <span style="font-size:0.75rem; color:#64748b;">CLARA đang đối chiếu tiêu chí và suy luận...</span>
      </div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 1. Thử gọi API Backend thật
    const apiResult = await callClaraChatApi(userText);
    typingIndicator.remove();

    if (apiResult) {
      appendMessage('agent', apiResult.message, apiResult.recommendations, apiResult.safety_reminder);
      // Apply live update from real API if present
      applyLiveUpdate(apiResult.axis_updates || {}, apiResult.checklist_updates || []);
      return;
    }

    // 2. Fallback nội bộ nếu server chưa bật
    const lower = userText.toLowerCase();
    if (lower.includes('mở đầu') || lower.includes('bắt đầu') || lower.includes('icebreaker')) {
      appendMessage('agent',
        `Dựa trên hồ sơ của Mai Linh, cô ấy có niềm đam mê đặc biệt với <strong>thiết kế sản phẩm (UI/UX)</strong> và rất thích <strong>workshop làm gốm cuối tuần</strong>.`,
        [
          `"Được, anh cũng thích thiết kế tối giản. Phong cách design của em nhiều flat hay typography hơn?"`,
          `"Anh thấy em nhắc tới gốm Bát Tràng trong bio. Em hay đi workshop vào cuối tuần à, có địa chỉ nào thú vị không gợi ý anh với?"`
        ]
      );
      applyLiveUpdate(
        { 'Sở thích & Giải trí': 82 },
        [{ id: 'personal-boundaries', to_status: 'matched', new_detail: 'Cả hai đều thích không gian sáng tạo và nghệ thuật ứng dụng; sở thích workshop xác nhận rõ hơn.', new_badge_label: 'Xác nhận 92%' }]
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
      applyLiveUpdate(
        { 'Giao tiếp': 83, 'Mục tiêu lâu dài': 87 },
        []
      );
    } else if (lower.includes('tài chính') || lower.includes('tiền') || lower.includes('sở thích')) {
      appendMessage('agent',
        `⚠️ <strong>Lưu ý về độ đầy đủ dữ liệu</strong>: Profile của Linh không có thông tin trực tiếp về phong cách quản lý tài chính cá nhân (tiết kiệm vs tận hưởng). Bạn đã đặt đây là một trong các tiêu chí cần lưu ý.<br><br>💡 Lời khuyên: Đừng hỏi quá dồn dập về tiền bạc ở buổi đầu. Hãy quan sát qua thói quen lựa chọn địa điểm hẹn hoặc quan điểm chi tiêu khi đi du lịch.`
      );
      applyLiveUpdate(
        { 'Tài chính & Thực tế': 65 },
        [{ id: 'spending-style', to_status: 'check', new_detail: 'Chưa đủ dữ liệu trực tiếp. Nên quan sát qua hành vi chọn địa điểm và phong cách chi tiêu cá nhân khi có cơ hội.', new_badge_label: 'Cần quan sát', new_source: 'Nhận xét từ Agent Clara' }]
      );
    } else if (lower.includes('deal-breaker') || lower.includes('rào cản') || lower.includes('khác biệt')) {
      appendMessage('agent',
        `Tôi không thấy dấu hiệu xung đột nghiêm trọng (deal-breaker) về lối sống hay đạo đức. Tuy nhiên, có <strong>2 điểm cần làm rõ</strong>: <br>1. <strong>Cân bằng thời gian:</strong> Linh làm tại startup tuyển. Đị hỏi nhịp OT.<br>2. <strong>Kế hoạch kết hôn:</strong> Bạn có mốc 2–3 năm, Linh dừng ở "tùy duyên"."`,
        [
          `Hỏi khéo: "Khi công việc dồn dập, em thường xả stress bằng cách nào: muốn ở một mình hay trò chuyện với ai đó?"`,
          `"Em có hình dung rõ về cuộc sống gia đình trong 3–5 năm tới chưa?"`
        ]
      );
      applyLiveUpdate(
        { 'Kế hoạch tương lai': 68 },
        [{ id: 'work-pressure', to_status: 'friction', new_detail: 'Startup giai đoạn tăng trưởng — OT thường xuyên; cần kiểm tra tác động tới tần suất hẹn hò. Là điểm đáng chú ý.', new_badge_label: 'Deal-breaker tiềm ẩn', new_source: 'Phân tích lại từ Agent' }]
      );
    } else if (lower.includes('kế hoạch') || lower.includes('kết hôn') || lower.includes('tương lai')) {
      appendMessage('agent',
        `🎉 Tin vui! Dựa trên thông tin bạn vừa cung cấp, Linh <strong>có mực tiêu kết hôn trong 2 năm</strong> — điều này rất khớp với kế hoạch 2-3 năm của bạn. Điểm này đã được cập nhật vào phân tích tương thích!`,
        [`Đây là tín hiệu rất tích cực. Hãy tiếp tục quan sát sự nhất quán qua hành động ở các buổi hẹn.`]
      );
      applyLiveUpdate(
        { 'Kế hoạch tương lai': 88, 'Mục tiêu lâu dài': 91 },
        [{ id: 'marriage-timeline', to_status: 'matched', new_detail: 'Đã xác nhận: cả hai muốn kết hôn trong 2-3 năm tới. Mục tiêu đồng nhất.', new_badge_label: 'Đồng thuận ✔', new_source: 'Xác nhận qua trò chuyện' }]
      );
    } else {
      appendMessage('agent',
        `Tôi đã ghi nhận câu hỏi của bạn. Nhìn chung, giữa bạn và đối phương có <strong>75% điểm tương đồng về lối sống</strong>. Điểm cần bạn tự xác minh thêm trong buổi gặp là: <em>mức độ ưu tiên gia đình so với sự nghiệp trong 2 năm tới</em>. Bạn có muốn lưu lại điểm này vào checklist ghi nhớ không?`,
        [
          `Gợi ý địa điểm hẹn lý tưởng: Một quán cafe có không gian yên tĩnh, nhiều cây xanh tại Quận 1 hoặc workshop trải nghiệm.`,
          `Nhắc nhở: Hãy giữ tâm thế cởi mở, Agent chỉ hỗ trợ góc nhìn, cảm xúc trực tiếp khi gặp mặt mới là yếu tố quyết định!`
        ]
      );
      // Generic update: slightly boost communication axis on any engagement
      applyLiveUpdate({ 'Giao tiếp': Math.min(98, radarState.find(a => a.label === 'Giao tiếp').value + 1) }, []);
    }
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

  let latestNoteText = '';

  if (!addBtn || !noteInput || !notesContainer) return;

  addBtn.addEventListener('click', () => {
    const val = noteInput.value.trim();
    if (!val) return;

    latestNoteText = val;
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

    // Bật hiệu ứng nút Phân tích lại
    if (recalculateBtn) {
      recalculateBtn.style.animation = 'pulse-dot 1.5s infinite';
      recalculateBtn.classList.remove('btn-secondary');
      recalculateBtn.classList.add('btn-primary');
      recalculateBtn.innerText = '✨ Phân tích lại với dữ liệu mới này';
    }
  });

  if (recalculateBtn) {
    recalculateBtn.addEventListener('click', async () => {
      recalculateBtn.innerText = 'Đang phân tích qua Claude Core Agent...';
      recalculateBtn.disabled = true;

      const noteToProcess = latestNoteText || "Linh xác nhận muốn định cư lâu dài ở TP.HCM và mong muốn kết hôn sau 2 năm nữa.";
      const apiResult = await callClaraReanalyzeApi(noteToProcess);

      recalculateBtn.innerText = '✓ Đã cập nhật phân tích tương thích';
      recalculateBtn.disabled = false;
      recalculateBtn.classList.remove('btn-primary');
      recalculateBtn.classList.add('btn-secondary');
      recalculateBtn.style.animation = 'none';

      const newPercent = apiResult ? apiResult.updated_data_completeness : 88;
      if (confidenceFill && confidencePercent) {
        confidenceFill.style.width = `${newPercent}%`;
        confidencePercent.innerText = `${newPercent}%`;
      }

      const promotedCount = apiResult && apiResult.promoted_items ? apiResult.promoted_items.length : 1;
      alert(`CLARA Core Agent đã tích hợp ghi chú thực tế của bạn!\n- Mức độ đầy đủ dữ liệu tăng lên ${newPercent}%\n- Đã giải tỏa ${promotedCount} điểm trong nhóm Cần xác nhận sang Phù hợp!`);
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
