const selects = document.querySelectorAll("select");
const statusIcon = document.querySelector(".status-icon");
const statusTitle = document.querySelector(".status-title");
const statusDesc = document.querySelector(".status-desc");
const statusSub = document.querySelector(".status-sub");

function evaluateVaccinationStatus() {
  let total = selects.length;
  let completed = 0;
  let unknown = 0;

  selects.forEach(select => {
    const value = select.value;

    if (!value) return;

    if (value === "잘 모르겠음") {
      unknown++;
      return;
    }

    // 접종 완료로 보는 조건들
    if (
      value.includes("완료") ||
      value.includes("접종")
    ) {
      completed++;
    }
  });

  // 아이콘 색 초기화
  statusIcon.className = "status-icon";

  // 👉 상태 판단
  if (unknown === total) {
    statusIcon.classList.add("gray");
    statusTitle.textContent = "예방접종 정보가 부족합니다.";
    statusDesc.innerHTML = "접종 이력을 확인해 주세요.";
    statusSub.textContent = "현재 평가 가능한 항목이 없습니다.";
    return;
  }

  const rate = Math.round((completed / total) * 100);

  if (rate === 100) {
    statusIcon.classList.add("green");
    statusTitle.textContent = "예방접종 관리 상태가 양호합니다";
    statusDesc.textContent = "현재 기준에서 권장 접종이 완료되었습니다.";
    statusSub.textContent = `완료율 ${rate}%`;
  } 
  else if (rate >= 50) {
    statusIcon.classList.add("yellow");
    statusTitle.textContent = "예방접종이 일부 완료되었습니다";
    statusDesc.textContent = "추가 접종이 필요한 항목이 있습니다.";
    statusSub.textContent = `완료율 ${rate}%`;
  } 
  else {
    statusIcon.classList.add("red");
    statusTitle.textContent = "예방접종 관리가 필요합니다";
    statusDesc.textContent = "미접종 또는 추가 접종이 권장되는 항목이 있습니다.";
    statusSub.textContent = `완료율 ${rate}%`;
  }
}

// 이벤트 연결
selects.forEach(select => {
  select.addEventListener("change", evaluateVaccinationStatus);
});

// 최초 1회 실행
evaluateVaccinationStatus();


// 예방접종 후 증상 · 부작용 안내 (LLM 연결용)

const askBtn = document.getElementById("ask-btn");
const resultBox = document.getElementById("llm-result");

askBtn.addEventListener("click", async () => {
  const vaccine = document.getElementById("vaccine-select").value;
  const symptom = document.getElementById("symptom-input").value;

  if (!vaccine || !symptom) {
    resultBox.textContent = "예방접종 종류와 증상을 모두 입력해주세요.";
    return;
  }

  resultBox.textContent = "안내 내용을 불러오는 중입니다...";

  try {
    const response = await fetch("http://127.0.0.1:8000/symptom-guide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vaccine: vaccine,
        symptom: symptom
      })
    });

    const data = await response.json();
    resultBox.textContent = data.result;

  } catch (error) {
    resultBox.textContent = "현재 안내 서비스를 이용할 수 없습니다.";
    console.error(error);
  }
});
