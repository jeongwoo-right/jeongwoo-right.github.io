# Audit Risk Analyzer

거래 데이터 기반 감사 위험 식별 자동화 시스템입니다. 대량의 거래 데이터를 브라우저에서 분석하여 감사인이 우선 검토해야 할 고위험 거래를 자동으로 선별합니다.

배포 URL: [https://jeongwoo-right.github.io](https://jeongwoo-right.github.io)

## 1. 프로젝트 목적

기업의 거래 규모가 커질수록 감사인은 제한된 시간 안에 많은 거래를 검토해야 합니다. 기존의 임의 표본 기반 검토 방식만으로는 전체 거래 패턴을 충분히 파악하기 어렵고, 사람이 놓칠 수 있는 이상 거래가 발생할 수 있습니다.

Audit Risk Analyzer는 전체 거래 데이터를 기반으로 고액 거래, 비정상 패턴, 반복 이상 거래, 복합 위험 거래를 탐지하고 Risk Score를 부여합니다. 이를 통해 감사 검토 대상을 위험 중심으로 축소하고, 감사 절차의 효율성과 일관성을 높이는 것을 목표로 합니다.

## 2. 활용 데이터

권장 데이터셋은 Kaggle의 Credit Card Fraud Detection Dataset 형식입니다.

- 데이터 규모: 약 284,000건 거래 데이터
- 데이터 유형: 정상 거래와 이상 거래가 포함된 신용카드 거래 데이터
- 파일 형식: CSV

### 권장 컬럼

| 컬럼 | 설명 |
| --- | --- |
| `Time` | 거래 발생 시점 |
| `Amount` | 거래 금액 |
| `V1` ~ `V28` | 거래 특성 변수 |
| `Class` | 이상 거래 여부 검증용 라벨, 선택 컬럼 |

`TransactionID` 컬럼이 없는 경우 웹앱이 자동으로 거래번호를 생성합니다.

## 3. 주요 기능

### 데이터 전처리

- Missing Value 확인
- Duplicate Transaction 및 유사 반복 거래 확인
- Amount 컬럼 숫자 변환
- 거래 특성 변수 자동 인식
- 금액 및 거래 특성 변수의 표준화 기반 분석

### 감사 Rule 기반 위험 탐지

| Rule | 분석 기준 | 감사 관점 |
| --- | --- | --- |
| 고액 거래 탐지 | 거래금액 상위 1% 이상 | 중요 금액 거래 집중 검토 |
| 비정상 패턴 탐지 | 평균 거래 패턴 대비 큰 편차 | 일반적 영업 흐름과 다른 거래 확인 |
| 반복 이상 거래 탐지 | 유사 금액과 시간대의 반복 발생 | 비정상 반복 처리 가능성 확인 |
| 복합 위험 거래 탐지 | 여러 위험 조건 동시 충족 | 감사 우선순위 설정 |

### ML 보조 위험 점수

웹 브라우저에서 별도 서버 없이 실행되도록, Python 기반 모델 대신 이상치 점수 기반 보조 모델을 적용했습니다. Amount와 거래 특성 변수의 표준화 편차, 반복 거래 여부를 조합하여 ML 이상 가능성을 산정합니다.

## 4. Risk Score 산정 기준

| 위험 조건 | 점수 |
| --- | ---: |
| 고액 거래 발생 | +20 |
| 비정상 패턴 발견 | +30 |
| 유사 반복 거래 발견 | +10 |
| ML 이상 가능성 높음 | +50 |

최종 Risk Score는 0~100점으로 제한되며, 점수에 따라 다음과 같이 분류됩니다.

| 등급 | 기준 | 의미 |
| --- | --- | --- |
| High Risk | 70점 이상 | 즉시 검토 필요 |
| Medium Risk | 30점 이상 70점 미만 | 추가 확인 대상 |
| Low Risk | 30점 미만 | 일반 거래 |

## 5. 화면 구성

### 데이터 입력

CSV 파일을 업로드하거나 `데모 데이터 생성` 버튼으로 샘플 거래 데이터를 생성할 수 있습니다.

### Risk Dashboard

다음 지표를 제공합니다.

- 전체 거래 수
- High Risk 거래 수
- 검토 축소율
- 위험 비율
- High / Medium / Low Risk 분포

### Exception List

Risk Score가 높은 순서대로 검토 대상 거래를 표시합니다.

- 거래번호
- Time
- Amount
- Risk Score
- 위험 등급
- 위험 판단 근거

### Audit Exception Report

`Excel Report 다운로드` 버튼을 누르면 감사 산출물 형태의 Excel 파일이 생성됩니다.

| Sheet | 내용 |
| --- | --- |
| Summary Dashboard | 전체 거래 수, High Risk 거래 수, 위험 비율, 검토 축소율 |
| Exception List | 거래번호, 금액, Risk Score, 위험 등급, 위험 판단 근거 |
| Analysis Result | 분석 기준과 주요 Finding |

## 6. 사용 방법

1. 웹사이트 접속: [https://jeongwoo-right.github.io](https://jeongwoo-right.github.io)
2. `거래 데이터 업로드` 영역을 클릭하여 CSV 파일 선택
3. 분석 완료 후 Risk Dashboard 확인
4. Exception List에서 High Risk 거래 검토
5. 필요 시 `Risk 등급` 필터와 `표시 건수` 옵션 조정
6. `Excel Report 다운로드` 또는 `Exception CSV` 버튼으로 결과 저장

처음 테스트할 때는 실제 CSV 없이 `데모 데이터 생성` 버튼을 눌러 기능을 확인할 수 있습니다.

## 7. 기술 스택

- HTML
- CSS
- JavaScript
- SheetJS `xlsx`
- GitHub Pages

별도의 백엔드 서버 없이 정적 웹앱으로 동작합니다. CSV 분석은 사용자의 브라우저에서 수행되며, 업로드한 데이터는 외부 서버로 전송되지 않습니다.

## 8. 프로젝트 기대 효과

기존 감사 절차는 전체 거래에서 임의 표본을 선정한 뒤 검토하는 방식에 가깝습니다. 이 프로젝트는 전체 거래를 먼저 분석하고 위험도가 높은 거래를 선별하여 감사인이 집중 검토할 수 있도록 지원합니다.

기대 효과는 다음과 같습니다.

- 반복 검토 업무 감소
- 감사 위험 식별력 향상
- 위험 기준 기반의 일관된 분석 수행
- 데이터 기반 감사 의사결정 지원
- 검토 대상 거래량 축소를 통한 감사 효율성 개선

## 9. 로컬 실행 방법

저장소를 내려받은 뒤 `index.html` 파일을 브라우저로 열면 실행됩니다.

```bash
git clone https://github.com/jeongwoo-right/jeongwoo-right.github.io.git
cd jeongwoo-right.github.io
open index.html
```

또는 간단한 로컬 서버를 실행할 수 있습니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## 10. 배포 방법

이 저장소는 GitHub Pages용 사용자 사이트 저장소입니다. `master` 브랜치의 루트 폴더가 배포 소스로 설정되어 있습니다.

수정 후 배포하려면 다음 명령어를 실행합니다.

```bash
git add .
git commit -m "Update Audit Risk Analyzer"
git push origin master
```

push 후 GitHub Pages 배포가 완료되면 [https://jeongwoo-right.github.io](https://jeongwoo-right.github.io)에 반영됩니다.
