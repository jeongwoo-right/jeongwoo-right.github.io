# Audit Risk Analyzer

거래 데이터 기반 감사 위험 식별 자동화 시스템입니다. GitHub Pages에서 바로 실행되는 정적 웹앱으로, CSV 업로드 후 감사 Rule 기반 위험 탐지, 브라우저 기반 이상치 보조 점수, Risk Score 산정, Exception Report 다운로드를 제공합니다.

## 사용 방법

1. `index.html`을 GitHub Pages 루트에 배포합니다.
2. Credit Card Fraud Detection 형식의 CSV를 업로드합니다.
3. 대시보드에서 전체 거래 수, High Risk 거래 수, 검토 축소율, 위험 비율을 확인합니다.
4. `Excel Report 다운로드` 버튼으로 감사 산출물 형태의 `.xlsx` 파일을 생성합니다.

## 주요 기능

- Missing Value 확인
- Duplicate Transaction / 유사 반복 거래 확인
- 거래금액 상위 1% 고액 거래 탐지
- 거래 특성 변수 표준화 기반 비정상 패턴 탐지
- 브라우저 실행형 이상치 보조 모델
- Risk Score 0~100 산정
- High / Medium / Low Risk 분류
- Summary Dashboard, Exception List, Analysis Result 시트로 구성된 Excel Report 생성

## 배포

이 저장소가 `jeongwoo-right.github.io`라면 GitHub Pages는 루트의 `index.html`을 자동으로 웹사이트 첫 화면으로 사용합니다.
