# Ai_web_project

# 1) 레포 클론(내 폴더 이름을 "웹페이지 스터디"로 쓰고 싶으면 뒤에 폴더명 지정)
git clone https://github.com/EJEJejje/Ai_web_project.git "웹페이지 스터디"
cd "웹페이지 스터디"

# 2) 개인 브랜치 생성 + 이동 (예: eunjung)
git switch -c name/작업 할 것 이름

# 3) 작업 후 커밋/푸시
git add .
git commit -m "test"
git push -u origin name

# 4) main 최신 내용 내 브랜치로 가져오기(동기화)
git fetch origin
git merge origin/main

0) 사전 준비(필수)
Git 설정(처음 1회)
git config --global user.name "홍길동"
git config --global user.email "hong@example.com"

1) “GitHub(원격) ↔ 로컬(내 PC)” 연동 방법 2가지
방법 A (추천): 레포를 먼저 Clone(클론)하고 그 폴더에서 작업

원격이 기준이 되는 팀 작업에 가장 안전합니다.
(메인이 업데이트 된 경우)
git clone https://github.com/EJEJejje/Ai_web_project.git "웹페이지 스터디"
cd "웹페이지 스터디"

방법 B: 이미 있는 로컬 폴더(웹페이지 스터디)를 레포로 만들어서 원격 연결

로컬이 먼저인 경우에 사용합니다.

cd "웹페이지 스터디"
git init -b main
git remote add origin https://github.com/EJEJejje/Ai_web_project.git
git add .
git commit -m "Initial commit"
git push -u origin main


2) 개인 브랜치(Branch) 만들기 + 작업 올리기(필수 루틴)

브랜치(Branch)는 main에서 분기해서 개인 작업을 분리합니다.

2-1) 브랜치 생성(Create) + 이동(Switch)
# main 최신화 먼저(권장)
git switch main
git pull origin main

# 개인 브랜치 생성 + 이동
git switch -c <닉네임>/<작업이름>
# 예: git switch -c eunjung/navbar


git switch -c는 “브랜치 만들고 바로 이동”입니다(편의 명령).

(깃그래프 버튼 한방으로 해결가능)
2-2) 커밋(Commit) + 푸시(Push)
git add .
git commit -m "설명 메시지"
git push -u origin <닉네임>/<작업이름>
