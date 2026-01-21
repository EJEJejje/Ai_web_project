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
  streak: loadJSON("streak", 0),
  llm: loadJSON("llmConfig", {
    mode: "proxy",                 // "proxy" | "hfDirect"
    proxyUrl: "http://localhost:8000/generate",
    hfEndpoint: "",
    hfToken: "",
    temperature: 0.7,
    max_new_tokens: 160
  })
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

// Settings UI
const modeSelect = document.getElementById("modeSelect");
const proxyUrlInput = document.getElementById("proxyUrlInput");
const hfEndpointInput = document.getElementById("hfEndpointInput");
const hfTokenInput = document.getElementById("hfTokenInput");
const saveCfgBtn = document.getElementById("saveCfgBtn");
const testCfgBtn = document.getElementById("testCfgBtn");
const llmStatusBox = document.getElementById("llmStatusBox");

// -------------------------
// LLM Prompt Builders (생성은 LLM이, 우리는 지시만)
// -------------------------
function promptEncourage(ach, tone){
  return [
    "너는 멘탈 웰니스 코치(mental wellness coach)야.",
    "아래 사용자의 '작은 성취'에 대해 짧고 따뜻한 격려를 한국어로 작성해줘.",
    "조건:",
    "- 반드시 “오! 그 방법 되게 나이스한데요?” 문장을 포함",
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
    "사용자에게 지금 당장 할 수 있는 '스트레스 완화 팁'을 한국어로 1개만 제시해줘.",
    "조건:",
    "- 1~2문장",
    "- 과장 금지, 의료 진단/치료 언급 금지",
    "- '오! 그 방법 되게 나이스한데요?'를 문장 어딘가에 포함",
    "- 구체적 행동(예: 호흡, 스트레칭, 짧은 정리 등) 위주"
  ].join("\n");
}

function promptAdvice(situation){
  return [
    "너는 멘탈 웰니스 코치야.",
    "사용자의 상황에 대해 안전하고 실용적인 대처 조언을 한국어로 작성해줘.",
    "조건:",
    "- '오! 그 방법 되게 나이스한데요?' 포함",
    "- 4단계(step)로 번호를 매겨 제시",
    "- 각 단계는 1~2문장으로 짧게",
    "- 의료 진단/치료 조언 금지, 위험 신호가 있으면 전문가 도움 권장 1줄",
    "",
    `상황: "${situation}"`
  ].join("\n");
}

function promptQuizFeedback(question, choices, pickedIndex){
  const choiceLines = choices.map((c, i)=> `${i+1}) ${c}`).join("\n");
  return [
    "너는 멘탈 웰니스 코치야.",
    "아래 시나리오 퀴즈에서 사용자가 고른 선택을 평가하고, 더 도움이 되는 '추천 선택지'를 제시해줘.",
    "조건:",
    "- 한국어",
    "- '오! 그 방법 되게 나이스한데요?' 포함",
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
// LLM Call (proxy or HF direct)
// -------------------------
async function callLLMText(promptText){
  const cfg = state.llm;

  if(cfg.mode === "proxy"){
    if(!cfg.proxyUrl) throw new Error("Proxy URL이 비어 있습니다.");
    const res = await fetch(cfg.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptText,
        temperature: cfg.temperature,
        max_new_tokens: cfg.max_new_tokens
      })
    });
    if(!res.ok){
      const txt = await safeReadText(res);
      throw new Error(`Proxy 응답 오류: ${res.status} ${txt}`);
    }
    const data = await res.json();
    // 기대: { text: "..." }
    if(!data || typeof data.text !== "string") throw new Error("Proxy 응답 형식이 올바르지 않습니다. {text:string} 필요");
    return data.text.trim();
  }

  if(cfg.mode === "hfDirect"){
    if(!cfg.hfEndpoint) throw new Error("HF endpoint가 비어 있습니다.");
    if(!cfg.hfToken) throw new Error("HF token이 비어 있습니다.");

    const res = await fetch(cfg.hfEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.hfToken}`
      },
      body: JSON.stringify({
        inputs: promptText,
        parameters: {
          temperature: cfg.temperature,
          max_new_tokens: cfg.max_new_tokens,
          return_full_text: false
        }
      })
    });

    if(!res.ok){
      const txt = await safeReadText(res);
      throw new Error(`HF 응답 오류: ${res.status} ${txt}`);
    }

    // HF Inference API는 모델에 따라 응답 형태가 다를 수 있어 최대한 견고하게 파싱
    const data = await res.json();
    // 흔한 형태: [{generated_text:"..."}]
    if(Array.isArray(data) && data[0]?.generated_text){
      return String(data[0].generated_text).trim();
    }
    // 다른 형태: {generated_text:"..."} 또는 {text:"..."}
    if(data?.generated_text) return String(data.generated_text).trim();
    if(data?.text) return String(data.text).trim();

    // 마지막 fallback: JSON stringify
    return JSON.stringify(data).trim();
  }

  throw new Error("알 수 없는 LLM 모드입니다.");
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
const quiz = [
  {
    q: "내일 발표가 있는데 불안해서 아무것도 못 하겠어요. 첫 행동으로 가장 좋은 건?",
    a: [
      "완벽한 자료를 한 번에 끝내려고 밤새기",
      "3분만에 할 일 3개를 적고, 가장 쉬운 1개를 5분만 시작하기",
      "불안이 사라질 때까지 아무것도 안 하고 기다리기"
    ]
  },
  {
    q: "스트레스 때문에 자꾸 스마트폰을 계속 보게 돼요. 대안으로 더 좋은 선택은?",
    a: [
      "폰을 아예 없애기(극단적으로 차단)",
      "‘2분만’ 폰 내려놓고 물 마시기 + 어깨 힘 10% 빼기",
      "자책하면서 더 의지로 버티기"
    ]
  },
  {
    q: "상대가 나를 무시한 것 같아 화가 나요. 가장 건강한 첫 대응은?",
    a: [
      "즉시 따지며 공격적으로 말하기",
      "사실(Fact)과 해석(Interpretation)을 분리해 적고, 차분할 때 요청을 말하기",
      "아무 말도 안 하고 계속 참기"
    ]
  }
];

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

// -------------------------
// Settings UI
// -------------------------
function syncSettingsToUI(){
  modeSelect.value = state.llm.mode;
  proxyUrlInput.value = state.llm.proxyUrl || "";
  hfEndpointInput.value = state.llm.hfEndpoint || "";
  hfTokenInput.value = state.llm.hfToken || "";
}
function saveSettingsFromUI(){
  state.llm.mode = modeSelect.value;
  state.llm.proxyUrl = proxyUrlInput.value.trim();
  state.llm.hfEndpoint = hfEndpointInput.value.trim();
  state.llm.hfToken = hfTokenInput.value.trim();
  saveJSON("llmConfig", state.llm);
}

saveCfgBtn.addEventListener("click", ()=>{
  saveSettingsFromUI();
  llmStatusBox.textContent = "상태: 설정 저장 완료.";
});

testCfgBtn.addEventListener("click", async ()=>{
  saveSettingsFromUI();
  llmStatusBox.textContent = "상태: 테스트 중...";
  try{
    const testPrompt = "테스트: 한국어로 '연결 성공' 한 문장만 출력해줘.";
    const out = await callLLMText(testPrompt);
    llmStatusBox.textContent = "상태: 연결 성공 ✅\n" + out;
  }catch(err){
    llmStatusBox.textContent = "상태: 연결 실패 ❌\n" + err.message;
  }
});

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
syncSettingsToUI();
renderAchievements();
updateKPIs();
renderQuiz();
