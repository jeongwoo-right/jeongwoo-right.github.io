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

### 대표 Open Data 3개

| 데이터셋 | 링크 | 주요 특징 | 웹앱 적용 방법 |
| --- | --- | --- | --- |
| Credit Card Fraud Detection | [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) | 약 284,807건의 신용카드 거래 데이터이며, 공개 연구에서 492건의 fraud 거래가 포함된 불균형 데이터로 자주 활용됩니다. | `Time`, `Amount`, `V1`~`V28`, `Class` 구조라서 별도 변환 없이 바로 업로드하기 적합합니다. |
| IEEE-CIS Fraud Detection | [Kaggle](https://www.kaggle.com/competitions/ieee-fraud-detection) | 약 590,000건 규모의 전자상거래 결제 사기 탐지 데이터입니다. 거래 정보뿐 아니라 카드, 주소, 기기, 식별 관련 변수가 포함되어 있습니다. | `TransactionDT`를 `Time`, `TransactionAmt`를 `Amount`, `isFraud`를 `Class`로 바꾸면 기본 분석이 가능합니다. |
| PaySim Synthetic Financial Dataset | [Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1) | 모바일 송금/결제 흐름을 모사한 합성 금융거래 데이터입니다. `TRANSFER`, `CASH_OUT` 등 거래 유형과 계좌 잔액 변화를 함께 볼 수 있습니다. | `step`을 `Time`, `amount`를 `Amount`, `isFraud`를 `Class`로 바꾸면 업로드할 수 있습니다. |

### 3개 데이터셋 실습 결과 및 해석

아래 내용은 세 데이터셋을 같은 감사 관점으로 바라보며 정리한 실습 결과입니다. 본 웹앱은 브라우저 기반 Rule/Anomaly Scoring 도구이므로, Kaggle 대회용 고성능 예측 모델의 점수 경쟁보다는 "어떤 거래를 먼저 감사 검토 대상으로 올릴 것인가"에 초점을 두었습니다.

| 데이터셋 | 실습 결과 요약 | 결과 분석 |
| --- | --- | --- |
| Credit Card Fraud Detection | `Amount` 상위 1% 거래와 `V1`~`V28` 특성값에서 평균 패턴을 크게 벗어난 거래가 우선 검토 대상으로 분류되었습니다. | 실제 fraud 라벨은 전체 거래 중 매우 적기 때문에 Accuracy는 큰 의미가 없었습니다. 감사 관점에서는 전체 거래를 모두 보는 대신, 고액 거래와 이상 패턴 거래를 먼저 좁혀 보는 방식이 더 현실적이었습니다. |
| IEEE-CIS Fraud Detection | 단순 금액 기준만으로는 충분하지 않고, 거래 시간, 카드/주소/기기 관련 변수 등 복합 조건을 함께 봐야 위험 거래가 더 잘 드러납니다. | 전자상거래 사기는 금액이 크지 않아도 반복 패턴이나 식별 정보의 불일치에서 위험이 나타날 수 있습니다. 따라서 감사인은 단일 기준보다 여러 위험 신호가 동시에 나타나는 거래를 우선 검토해야 합니다. |
| PaySim Synthetic Financial Dataset | `TRANSFER`와 `CASH_OUT` 유형에서 금액이 크거나 잔액 흐름이 비정상적인 거래가 주요 검토 대상으로 나타났습니다. | 자금 이동 데이터는 단순 매출/비용 거래보다 "흐름"이 중요합니다. 한 계좌에서 다른 계좌로 자금이 이동한 뒤 빠르게 출금되는 구조는 내부통제와 자금세탁 위험 검토에 연결될 수 있습니다. |

### CPA 준비생 관점의 인사이트

이 실습을 통해 데이터 분석은 단순히 사기 거래를 맞히는 작업이 아니라, 감사인이 중요왜곡표시위험을 평가하고 추가 감사절차의 범위를 정하는 과정과 연결된다는 점을 확인했습니다.

- 표본 추출 전 전체 거래를 먼저 스캔하면, 감사인이 놓칠 수 있는 비정상 거래군을 빠르게 파악할 수 있습니다.
- 불균형 데이터에서는 Accuracy보다 Recall, Precision, F1 Score가 더 중요합니다. 특히 감사에서는 위험 거래를 누락하지 않는 것이 중요하므로 Recall 관점이 필요합니다.
- 고액 거래는 중요성 기준과 연결되고, 반복 거래와 이상 패턴은 내부통제 미비나 승인 절차 우회 가능성과 연결됩니다.
- 같은 fraud 데이터라도 카드 결제, 전자상거래, 모바일 송금 데이터는 위험 신호가 다르게 나타납니다. 따라서 감사인은 업종과 거래 프로세스에 맞게 Risk Rule을 조정해야 합니다.
- Python/ML 모델의 결과를 그대로 믿기보다는, Risk Score와 위험 판단 근거를 함께 제시해야 감사조서와 커뮤니케이션에 활용할 수 있습니다.

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
