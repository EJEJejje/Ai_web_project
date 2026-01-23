const recoveryData = {
    running: {
        title: "러닝 후 회복 솔루션",
        muscle: "하체 및 발바닥 근막",
        stretch: "종아리 근육(비복근)을 30초간 늘려주고, 5분간 가볍게 걸으며 쿨다운하세요.",
        nutrition: "소실된 전해질과 수분 보충을 위해 이온 음료를 섭취하고 바나나 한 개를 추천합니다.",
        sleep: "심박수가 안정될 때까지 명상 후, 근육 재생을 위해 8시간 이상 숙면하세요."
    },
    weight: {
        title: "웨이트 후 회복 솔루션",
        muscle: "주요 타겟 근육군",
        stretch: "운동 부위의 근막 이완을 위해 폼롤러 마사지와 15초 이상의 정적 스트레칭을 하세요.",
        nutrition: "근성장을 위해 30분 이내에 충분한 단백질(20-30g)과 복합 탄수화물을 섭취하세요.",
        sleep: "깊은 수면 중 분비되는 성장 호르몬을 위해 암막 환경을 철저히 조성하세요."
    },
    swimming: {
        title: "수영 후 회복 솔루션",
        muscle: "어깨 관절 및 전신",
        stretch: "회전근개의 긴장을 풀기 위해 벽을 짚고 어깨 가슴 근육을 시원하게 펴주세요.",
        nutrition: "체온 회복을 위해 따뜻한 꿀물이나 차를 마셔 에너지를 보충하세요.",
        sleep: "체온 조절을 위해 실내 온도를 적절히 유지하며 충분히 휴식하세요."
    },
    sitting: {
        title: "좌식 후 교정 솔루션",
        muscle: "거북목/말린어깨/요추",
        stretch: "벽에 등과 머리를 붙이고 턱을 당기는 운동을 10회 반복하여 척추를 정렬하세요.",
        nutrition: "혈액 순환 정체를 해소하기 위해 오메가-3가 풍부한 견과류를 추천합니다.",
        sleep: "낮 동안 쌓인 정신적 스트레스 수치를 낮추기 위해 취침 전 5분 명상을 제안합니다."
    }
};

function showRecovery(type, btn) {
    // 모든 버튼의 활성화 상태 초기화
    document.querySelectorAll('.exercise-item').forEach(b => b.classList.remove('active'));
    // 선택한 버튼 활성화
    btn.classList.add('active');

    // 데이터 삽입
    const data = recoveryData[type];
    document.getElementById('target-muscle').innerText = data.muscle;
    document.getElementById('selected-title').innerText = data.title;
    document.getElementById('stretch-info').innerText = data.stretch;
    document.getElementById('nutrition-info').innerText = data.nutrition;
    document.getElementById('sleep-info').innerText = data.sleep;

    // 결과 창 표시
    const resultCard = document.getElementById('recovery-result');
    resultCard.style.display = 'block';

    // 부드럽게 화면 이동
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function playRecoveryBell() {
    alert("🔔 [맑은 종소리] 이완 명상을 시작합니다. 1분간 눈을 감고 몸의 감각에 집중해 보세요.");
}