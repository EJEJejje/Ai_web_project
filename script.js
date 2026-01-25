const selects = document.querySelectorAll("select");
const resultText = document.getElementById("result-text");
const progressText = document.getElementById("progress-text");
const summarySection = document.querySelector(".summary");

function evaluateVaccinationStatus() {
  let completedCount = 0;
  let hasUnvaccinated = false;

  selects.forEach(select => {
    if (select.value === "완료") completedCount++;
    if (select.value === "미접종") hasUnvaccinated = true;
  });

  const total = selects.length;
  const percent = Math.round((completedCount / total) * 100);

  // 완료율 표시
  progressText.textContent = `완료율: ${percent}%`;

  // 상태 클래스 초기화
  summarySection.classList.remove("good", "warn", "danger");

  // 상태 판단
  if (completedCount === total) {
    resultText.textContent =
      "🟢 예방접종 관리 상태가 매우 양호합니다. 잘하고 있어요!";
    summarySection.classList.add("good");
  } else if (hasUnvaccinated) {
    resultText.textContent =
      "🔴 미접종 항목이 있습니다. 예방접종 관리를 권장합니다.";
    summarySection.classList.add("danger");
  } else {
    resultText.textContent =
      "🟡 예방접종이 진행 중입니다. 거의 다 왔어요!";
    summarySection.classList.add("warn");
  }
}

// select 변경 시 재계산
selects.forEach(select => {
  select.addEventListener("change", evaluateVaccinationStatus);
});

// 페이지 로드 시 최초 1회 계산
evaluateVaccinationStatus();
