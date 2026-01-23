/**
 * 1. Readiness(회복도) 분석 로직
 */
function analyzeReadiness() {
    const hrv = document.getElementById('hrvLevel').value;
    const sore = parseInt(document.getElementById('soreness').value);
    const scoreEl = document.getElementById('readinessScore');
    const box = document.getElementById('readinessBox');
    
    let score = 75; // 기본 점수
    
    // HRV 기반 가감점
    const hrvWeights = { 'high': 25, 'normal': 0, 'low': -20, 'very_low': -45 };
    score += hrvWeights[hrv] || 0;
    
    // 피로도 기반 차감
    score -= (sore * 15);
    
    // 범위 제한 (0~100)
    score = Math.max(0, Math.min(100, score));
    scoreEl.textContent = score;
    
    // 상태별 디자인 및 피드백 변경
    if(score >= 85) {
        scoreEl.style.borderColor = "var(--accent)";
        box.innerHTML = "✨ <b>컨디션 최상!</b> 오늘은 고강도 훈련이나 새로운 기록 도전에 적합한 날입니다.";
    } else if(score >= 60) {
        scoreEl.style.borderColor = "var(--accent2)";
        box.innerHTML = "✅ <b>양호한 상태.</b> 평소 계획대로 운동을 진행하되, 세트 사이 휴식을 충분히 가져가세요.";
    } else if(score >= 40) {
        scoreEl.style.borderColor = "var(--warn)";
        box.innerHTML = "⚠️ <b>회복 필요.</b> 중강도 이하의 운동을 권장하며 수면과 영양에 집중하세요.";
    } else {
        scoreEl.style.borderColor = "var(--danger)";
        box.innerHTML = "🛑 <b>완전 휴식 권고.</b> 오늘은 스트레칭이나 명상으로 몸을 달래주세요. 부상 위험이 높습니다.";
    }
}

/**
 * 2. Recovery Prescription (운동별 부위 추출)
 */
const workoutData = {
    swim: ["어깨 가동성", "등 근육(광배근) 이완", "코어/복근 스트레칭"],
    run: ["발바닥 근막 이완", "종아리/아킬레스건", "장요근(골반) 스트레칭"],
    gym: ["대퇴사두근/햄스트링", "흉추 가동성 가이드", "손목/전완근 케어"]
};

function showWorkoutParts(type) {
    const step1 = document.getElementById('recoveryStep1');
    const step2 = document.getElementById('recoveryStep2');
    const select = document.getElementById('partSelect');
    
    step1.style.display = 'none';
    step2.style.display = 'block';
    select.innerHTML = "";
    
    workoutData[type].forEach(part => {
        const opt = document.createElement('option');
        opt.value = part;
        opt.textContent = part;
        select.appendChild(opt);
    });
}

function resetRecovery() {
    document.getElementById('recoveryStep1').style.display = 'block';
    document.getElementById('recoveryStep2').style.display = 'none';
    document.getElementById('prescriptionBox').style.display = 'none';
}

function getRecoveryAdvice() {
    const part = document.getElementById('partSelect').value;
    const box = document.getElementById('prescriptionBox');
    box.style.display = 'block';
    
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(part + " 스트레칭")}`;
    
    box.innerHTML = `
        <strong>[${part}] 집중 회복 가이드</strong><br><br>
        • 방법: 통증이 없는 범위에서 20초간 유지 (3회 반복)<br>
        • 팁: 호흡을 깊게 내뱉으며 근육의 긴장을 푸세요.<br>
        🔗 <a href="${searchUrl}" target="_blank" class="yt-link">추천 스트레칭 영상 보기</a>
    `;
}

/**
 * 3. Sleep Optimization
 */
function calculateSleep() {
    const intensity = document.getElementById('intensity').value;
    const tag = document.getElementById('sleepTimeTag');
    const box = document.getElementById('sleepBox');
    
    const sleepConfig = {
        high: { time: "9시간 이상", color: "var(--danger)", msg: "근성장과 신경계 회복을 위해 '딥 슬립'이 절대적으로 필요한 날입니다." },
        mid: { time: "7.5~8.5시간", color: "var(--warn)", msg: "수면 위생 팁을 적용하여 오늘 쌓인 피로를 씻어내세요." },
        low: { time: "7시간 이상", color: "var(--accent)", msg: "규칙적인 수면 패턴을 유지하는 것만으로도 충분합니다." }
    };

    const config = sleepConfig[intensity];
    tag.textContent = `권장 수면: ${config.time}`;
    tag.style.backgroundColor = config.color;
    box.textContent = config.msg;
}

/**
 * 4. Injury Prevention
 */
function togglePain(el) {
    el.classList.toggle('active');
}

function analyzePain() {
    const actives = document.querySelectorAll('.body-part.active');
    const other = document.getElementById('otherPain').value;
    const box = document.getElementById('injuryBox');
    
    if(actives.length === 0 && !other) {
        box.textContent = "통증 부위를 선택하시면 맞춤 케어법을 알려드려요.";
        return;
    }
    
    let parts = Array.from(actives).map(el => el.textContent);
    if(other) parts.push(other);
    
    const searchPart = parts[0];
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchPart + " 재활 완화")}`;
    
    box.innerHTML = `
        <strong>[${parts.join(', ')}] 관리 솔루션</strong><br><br>
        • 초기 대응: 붓기가 있다면 냉찜질, 묵직한 통증이라면 온찜질<br>
        • 주의: 통증이 심해진다면 즉시 중단하고 전문의와 상담하세요.<br>
        🏥 <a href="${searchUrl}" target="_blank" class="yt-link">통증 완화 재활 영상 보기</a>
    `;
}

// 초기 실행
window.onload = () => {
    calculateSleep();
};