/**
 * LLM Only 버전
 * - 룰 기반 생성/판정(템플릿/랜덤팁 배열/퀴즈 ok/why) 전부 제거
 * - 격려/팁/조언/퀴즈 피드백 => 항상 LLM 호출
 */

// -------------------------
// Local Storage Helpers
// -------------------------
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function nowISO(){ return new Date().toISOString(); }
function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso){
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}
function escapeHTML(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

// -------------------------
// State
// -------------------------
const state = {
  achievements: loadJSON("achievements", []),
  lastActiveDate: loadJSON("lastActiveDate", null),
  streak: loadJSON("streak", 0)
};

// LLM 설정 - 항상 서버의 /generate 엔드포인트 사용
const LLM_CONFIG = {
  endpoint: "/generate",  // 상대 경로 사용 (같은 서버)
  temperature: 0.7,
  max_new_tokens: 1000
};

// -------------------------
// UI refs
// -------------------------
const achInput = document.getElementById("achInput");
const addAchBtn = document.getElementById("addAchBtn");
const encourageBtn = document.getElementById("encourageBtn");
const bellBtn = document.getElementById("bellBtn");
const toneSelect = document.getElementById("toneSelect");
const encourageBox = document.getElementById("encourageBox");

const achListEl = document.createElement("ul");
achListEl.className = "ach-list";
encourageBox.parentElement.insertBefore(achListEl, encourageBox.nextSibling);

const kpiCount = document.getElementById("kpiCount");
const kpiStreak = document.getElementById("kpiStreak");
const kpiToday = document.getElementById("kpiToday");

const randomTipBtn = document.getElementById("randomTipBtn");
const breathBtn = document.getElementById("breathBtn");
const tipBox = document.getElementById("tipBox");

const stressInput = document.getElementById("stressInput");
const adviceBtn = document.getElementById("adviceBtn");
const clearAdviceBtn = document.getElementById("clearAdviceBtn");
const adviceBox = document.getElementById("adviceBox");

const quizArea = document.getElementById("quizArea");
const quizResult = document.getElementById("quizResult");

// -------------------------
// LLM Prompt Builders (생성은 LLM이, 우리는 지시만)
// -------------------------
function promptEncourage(ach, tone){
  return [
    "너는 멘탈 웰니스 코치(mental wellness coach)야.",
    "자기소개 금지",
    "아래 사용자의 '작은 성취'에 대해 짧고 따뜻한 격려를 한국어로 작성해줘.",
    "조건:",
    
    "- 3~5문장",
    "- 톤은 사용자가 고른 tone에 맞게: warm/playful/coach",
    "- 의료 진단/치료 조언 금지, 위기 대응이 필요해 보이면 '전문가 도움 권장'을 부드럽게 한 줄 추가",
    "",
    `tone: ${tone}`,
    `작은 성취: "${ach}"`
  ].join("\n");
}

function promptTip(){
  return [
    "너는 멘탈 웰니스 코치야.",
    "자기소개 금지",
    "사용자에게 지금 당장 할 수 있는 '스트레스 완화 팁'을 한국어로 1개만 제시해줘.",
    "조건:",
    "- 1~2문장",
    "- 과장 금지, 의료 진단/치료 언급 금지",
    "- 구체적 행동(예: 호흡, 스트레칭, 짧은 정리 등) 위주"
  ].join("\n");
}

function promptAdvice(situation){
  return [
    "너는 멘탈 웰니스 코치야.",
    "자기소개 금지",
    "사용자의 상황에 대해 안전하고 실용적인 대처 조언을 한국어로 작성해줘.",
    "조건:",
    "- 4단계(step)로 번호를 매겨 제시",
    "- 각 단계는 1~2문장으로 짧게",
    "- 의료 진단/치료 조언 금지, 위험 신호가 있으면 전문가 도움 권장 1줄",
    "",
    `상황: "${situation}"`
  ].join("\n");
}

function promptDailyQuiz(){
  return [
    "너는 멘탈 웰니스 코치야.",
    "자기소개 금지",
    "일상 생활에서 겪을 수 있는 스트레스 상황이나 대인관계 시나리오를 3개 생성하고, 각 상황에 대한 객관식 퀴즈(선택지 3개)를 만들어줘.",
    "조건:",
    "- 출력은 오직 JSON 포맷이어야 함 (마크다운 코드블록 없이 순수 JSON text)",
    "- JSON 형식: [ { \"q\": \"지문\", \"a\": [\"선택1\", \"선택2\", \"선택3\"] }, ... ]",
    "- 문제 3개 필수",
    "- 한국어 작성",
    "- 내용은 직장인나 현대인이 겪을법한 일상적인 스트레스 상황",
    "- 선택지는: 1) 공격적/충동적 반응(안 좋은 예), 2) 건전하고 지혜로운 대처(정답), 3) 회피/무시(좋지 않은 예) 순서 섞어서",
    "- 의료적 진단이 필요한 심각한 상황은 제외"
  ].join("\n");
}

function promptQuizFeedback(question, choices, pickedIndex){
  const choiceLines = choices.map((c, i)=> `${i+1}) ${c}`).join("\n");
  return [
    "너는 멘탈 웰니스 코치야.",
    "자기소개 금지",
    "아래 시나리오 퀴즈에서 사용자가 고른 선택을 평가하고, 더 도움이 되는 '추천 선택지'를 제시해줘.",
    "조건:",
    "- 한국어",
    "- 출력 형식은 반드시 아래 3줄을 포함:",
    "  1) 사용자의 선택: (번호)",
    "  2) 추천 선택: (번호) — 이유 1~2문장",
    "  3) 다음 행동 1개: (아주 구체적으로 1문장)",
    "- 비난/자책 유도 금지, 과장 금지, 의료 진단/치료 조언 금지",
    "",
    `문제: ${question}`,
    "선택지:",
    choiceLines,
    "",
    `사용자 선택 번호: ${pickedIndex + 1}`
  ].join("\n");
}

// -------------------------
// LLM Call (서버 프록시 사용)
// -------------------------
async function callLLMText(promptText){
  const res = await fetch(LLM_CONFIG.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: promptText,
      temperature: LLM_CONFIG.temperature,
      max_new_tokens: LLM_CONFIG.max_new_tokens
    })
  });
  
  if(!res.ok){
    const txt = await safeReadText(res);
    throw new Error(`서버 응답 오류: ${res.status} ${txt}`);
  }
  
  const data = await res.json();
  if(!data || typeof data.text !== "string"){
    throw new Error("서버 응답 형식 오류");
  }
  
  return data.text.trim();
}

async function safeReadText(res){
  try{ return (await res.text()).slice(0, 400); }catch(e){ return ""; }
}

// -------------------------
// Streak logic (생성 룰이 아니라 기록 유지 로직이므로 유지)
// -------------------------
function updateStreakOnAdd(){
  const today = todayKey();
  const last = state.lastActiveDate;

  if(!last){
    state.streak = 1;
  } else {
    const lastDate = new Date(last);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000*60*60*24));
    if(diffDays === 0){
      // already counted today
    } else if(diffDays === 1){
      state.streak += 1;
    } else {
      state.streak = 1;
    }
  }
  state.lastActiveDate = today;
  saveJSON("streak", state.streak);
  saveJSON("lastActiveDate", state.lastActiveDate);
}

// -------------------------
// Achievements UI
// -------------------------
function addAchievement(text){
  const t = (text || "").trim();
  if(!t) return;

  state.achievements.unshift({ text: t, at: nowISO(), day: todayKey() });
  saveJSON("achievements", state.achievements);

  updateStreakOnAdd();
  renderAchievements();
  updateKPIs();

  achInput.value = "";
  encourageBox.textContent = "기록 완료! 이제 '격려 받기'를 누르면 LLM이 응답합니다.";
}

function renderAchievements(){
  achListEl.innerHTML = "";
  const items = state.achievements.slice(0, 12);
  items.forEach((it)=>{
    const li = document.createElement("li");
    li.className = "ach-item";
    li.innerHTML = `
      <div>
        <b>${escapeHTML(it.text)}</b>
        <div class="muted small">클릭하면 이 성취로 격려 프롬프트가 생성됩니다.</div>
      </div>
      <div class="time">${formatTime(it.at)}</div>
    `;
    li.addEventListener("click", ()=>{
      achInput.value = it.text;
      playChime();
    });

    const del = document.createElement("button");
    del.className = "btn secondary";
    del.style.padding = "8px 10px";
    del.textContent = "삭제";
    del.addEventListener("click", (e)=>{
      e.stopPropagation();
      state.achievements.splice(state.achievements.indexOf(it), 1);
      saveJSON("achievements", state.achievements);
      renderAchievements();
      updateKPIs();
      encourageBox.textContent = "삭제 완료.";
    });
    li.appendChild(del);

    achListEl.appendChild(li);
  });
}

function updateKPIs(){
  kpiCount.textContent = state.achievements.length;
  const tk = todayKey();
  const todayCount = state.achievements.filter(x => x.day === tk).length;
  kpiToday.textContent = todayCount;
  kpiStreak.textContent = state.streak || 0;
}

// -------------------------
// Web Audio Chime (종소리)
// -------------------------
let audioCtx = null;
function playChime(){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;

    const freqs = [880, 1320, 1760];
    freqs.forEach((f, i)=>{
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t0);

      const start = t0 + i*0.01;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.22/(i+1), start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);

      o.connect(g).connect(audioCtx.destination);
      o.start(start);
      o.stop(start + 1.25);
    });
  }catch(e){
    alert("종소리 재생이 브라우저에서 차단될 수 있어요. 버튼을 한 번 더 눌러보세요.");
  }
}

// -------------------------
// Breath timer (도구 기능이므로 유지)
// -------------------------
function startBreathTimer(){
  const total = 60;
  let t = 0;
  tipBox.textContent = "호흡 시작! 4초 들이마시고 6초 내쉬기. (총 60초)";
  const id = setInterval(()=>{
    t++;
    const remain = total - t;
    if(remain <= 0){
      clearInterval(id);
      tipBox.textContent = "끝! 지금 상태가 ‘조금’만 더 나아졌으면 성공입니다.";
    }
  }, 1000);
}

// -------------------------
// Quiz (LLM 판정)
// -------------------------
// 초기엔 null, 로드 후 업데이트
let quiz = [];

async function loadDailyQuiz(){
  const today = todayKey();
  const cachedKey = `dailyQuiz_${today}`;
  const cached = localStorage.getItem(cachedKey);

  if(cached){
    try{
      quiz = JSON.parse(cached);
      if(Array.isArray(quiz) && quiz.length > 0){
        renderQuiz();
        return;
      }
    }catch(e){
      console.error("Quiz parsing error", e);
    }
  }

  // 없으면 생성 버튼 표시
  quizArea.innerHTML = `
    <div class="notice-box" style="text-align:center; padding:20px; background:#f5f5f5; border-radius:8px;">
      <p>오늘의 퀴즈가 아직 없습니다.</p>
      <button class="btn primary" id="genQuizBtn">오늘의 퀴즈 생성하기 (LLM)</button>
    </div>
  `;
  
  // 동적으로 생성된 버튼이므로 여기서 이벤트 바인딩
  const btn = document.getElementById("genQuizBtn");
  if(btn){
    btn.addEventListener("click", generateDailyQuiz);
  }
}

async function generateDailyQuiz(){
  const btn = document.getElementById("genQuizBtn");
  if(btn) btn.disabled = true;
  if(quizArea) quizArea.innerHTML = `<div class="feedback">오늘의 시나리오를 생성하고 있어요... (시간이 조금 걸릴 수 있습니다)</div>`;
  
  try{
    const prompt = promptDailyQuiz();
    let text = await callLLMText(prompt);
    
    // JSON 파싱 시도 (LLM이 마크다운 ```json ... ``` 을 줄 수도 있으므로 처리)
    text = text.trim();
    if(text.startsWith("```json")) text = text.replace(/^```json/, "");
    if(text.startsWith("```")) text = text.replace(/^```/, "");
    if(text.endsWith("```")) text = text.replace(/```$/, "");
    
    const parsed = JSON.parse(text);
    if(!Array.isArray(parsed)){
      throw new Error("JSON 형식이 배열이 아닙니다.");
    }
    
    // 저장 및 렌더링
    quiz = parsed;
    const today = todayKey();
    localStorage.setItem(`dailyQuiz_${today}`, JSON.stringify(quiz));
    renderQuiz();
    
    playChime();
    
  }catch(err){
    console.error(err);
    quizArea.innerHTML = `
      <div class="feedback danger">
        퀴즈 생성 실패: ${err.message}<br>
        <button class="btn secondary" onclick="loadDailyQuiz()">다시 시도</button>
      </div>
    `;
  }
}

function renderQuiz(){
  quizArea.innerHTML = "";
  quiz.forEach((item, idx)=>{
    const wrap = document.createElement("div");
    wrap.className = "quiz-card";

    const title = document.createElement("div");
    title.innerHTML = `<b>Q${idx+1}.</b> ${item.q}`;
    wrap.appendChild(title);

    item.a.forEach((c, j)=>{
      const label = document.createElement("label");
      label.className = "choice";
      label.innerHTML = `
        <input type="radio" name="q${idx}" value="${j}" />
        <div>${escapeHTML(c)}</div>
      `;
      label.addEventListener("click", async ()=>{
        // set checked
        const radios = wrap.querySelectorAll(`input[name="q${idx}"]`);
        radios.forEach(r => r.checked = false);
        label.querySelector("input").checked = true;

        // call LLM
        quizResult.textContent = "LLM 평가 중...";
        try{
          const prompt = promptQuizFeedback(item.q, item.a, j);
          const text = await callLLMText(prompt);
          quizResult.textContent = text;
          playChime();
        }catch(err){
          quizResult.textContent = `LLM 호출 실패: ${err.message}`;
        }
      });
      wrap.appendChild(label);
    });

    quizArea.appendChild(wrap);
  });
}

// Settings UI 제거됨 - 서버에서 자동으로 처리

// -------------------------
// Events
// -------------------------
addAchBtn.addEventListener("click", ()=> addAchievement(achInput.value));
achInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") addAchievement(achInput.value);
});

encourageBtn.addEventListener("click", async ()=>{
  const latest = state.achievements[0]?.text || achInput.value.trim();
  const tone = toneSelect.value;

  if(!latest){
    encourageBox.textContent = "성취가 비어 있어요. 한 줄만 적어주세요!";
    return;
  }

  encourageBox.textContent = "LLM 격려 생성 중...";
  try{
    const prompt = promptEncourage(latest, tone);
    const llm = await callLLMText(prompt);
    encourageBox.textContent = llm;
    playChime();
  }catch(err){
    encourageBox.textContent = `LLM 호출 실패: ${err.message}`;
  }
});

bellBtn.addEventListener("click", ()=> playChime());

randomTipBtn.addEventListener("click", async ()=>{
  tipBox.textContent = "LLM 팁 생성 중...";
  try{
    const text = await callLLMText(promptTip());
    tipBox.textContent = text;
    playChime();
  }catch(err){
    tipBox.textContent = `LLM 호출 실패: ${err.message}`;
  }
});

breathBtn.addEventListener("click", ()=> startBreathTimer());

adviceBtn.addEventListener("click", async ()=>{
  const text = stressInput.value.trim();
  adviceBox.textContent = "LLM 조언 생성 중...";
  try{
    const prompt = promptAdvice(text || "사용자가 상황을 아직 입력하지 않았습니다.");
    const out = await callLLMText(prompt);
    adviceBox.textContent = out;
    playChime();
  }catch(err){
    adviceBox.textContent = `LLM 호출 실패: ${err.message}`;
  }
});

clearAdviceBtn.addEventListener("click", ()=>{
  stressInput.value = "";
  adviceBox.textContent = "초기화 완료.";
});

// -------------------------
// Init
// -------------------------
renderAchievements();
updateKPIs();
renderQuiz();
loadDailyQuiz();
