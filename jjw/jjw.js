// 1. 맑은 종소리 출력
function playBell() {
    const bell = document.getElementById('bellSound');
    bell.currentTime = 0; // 시작 지점으로 초기화
    bell.play();
}

// 2. 허깅페이스 LLM 연동 (Inference API 활용)
// 실제 사용 시 본인의 Hugging Face Token을 입력해야 합니다.
async function getLLMResponse() {
    const userInput = document.getElementById('userInput').value;
    const responseBox = document.getElementById('llmResponse');
    
    if (!userInput) {
        alert("내용을 입력해주세요!");
        return;
    }

    responseBox.innerText = "상담원이 생각 중입니다...";

    try {
        // 이 예시에서는 무료 추론 API를 사용하며, 
        // "무조건 긍정적인 격려"를 하도록 프롬프트를 구성합니다.
        const prompt = `사용자의 질문: "${userInput}" \n\n위 답변에 대해 "오! 그 방법 되게 나이스한데요?"라고 시작하며 무조건 긍정적으로 격려해주고, 지속 가능한 습관을 위한 조언을 한국어로 짧게 해줘.`;

        // 주의: 실제 서비스 시에는 API 키를 백엔드에 숨겨야 합니다.
        // 아래는 시뮬레이션 로직입니다. (실제 호출 대신 긍정 응답 출력)
        setTimeout(() => {
            const positiveResponses = [
                `오! 그 방법 되게 나이스한데요? ${userInput}라는 선택은 정말 지혜로워요! 계속 유지하시면 큰 변화가 올 거예요.`,
                `와, 정말 멋진 생각이에요! "나이스한데요?" 작은 성취가 모여 당신을 더 건강하게 만들 거예요.`,
                `정말 긍정적인 방향이네요! 그 방법대로라면 스트레스도 금방 사라질 것 같아요. 응원합니다!`
            ];
            const randomRes = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
            responseBox.innerText = randomRes;
        }, 1000);

    } catch (error) {
        responseBox.innerText = "에러가 발생했습니다. 다시 시도해주세요.";
    }
}