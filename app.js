const state = {
  rows: [],
  results: [],
  stats: null,
};

const el = {
  fileInput: document.querySelector("#fileInput"),
  demoButton: document.querySelector("#demoButton"),
  reportButton: document.querySelector("#reportButton"),
  csvButton: document.querySelector("#csvButton"),
  statusText: document.querySelector("#statusText"),
  totalCount: document.querySelector("#totalCount"),
  highCount: document.querySelector("#highCount"),
  reductionRate: document.querySelector("#reductionRate"),
  riskRate: document.querySelector("#riskRate"),
  highBar: document.querySelector("#highBar"),
  mediumBar: document.querySelector("#mediumBar"),
  lowBar: document.querySelector("#lowBar"),
  highPct: document.querySelector("#highPct"),
  mediumPct: document.querySelector("#mediumPct"),
  lowPct: document.querySelector("#lowPct"),
  qualityList: document.querySelector("#qualityList"),
  exceptionBody: document.querySelector("#exceptionBody"),
  riskFilter: document.querySelector("#riskFilter"),
  limitSelect: document.querySelector("#limitSelect"),
};

el.fileInput.addEventListener("change", handleFile);
el.demoButton.addEventListener("click", runDemo);
el.reportButton.addEventListener("click", downloadExcelReport);
el.csvButton.addEventListener("click", downloadExceptionCsv);
el.riskFilter.addEventListener("change", renderTable);
el.limitSelect.addEventListener("change", renderTable);

async function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  setStatus(`${file.name} 파일을 읽는 중입니다...`);
  const text = await file.text();
  const parsed = parseCsv(text);
  analyze(parsed.rows, parsed.headers);
}

function runDemo() {
  setStatus("데모 거래 데이터를 생성하고 분석 중입니다...");
  const demoRows = [];
  for (let i = 0; i < 5000; i += 1) {
    const isOutlier = i % 197 === 0;
    const repeated = i % 311 === 0;
    const amount = isOutlier
      ? 1600 + Math.random() * 2800
      : Math.max(1, 35 + Math.random() * 180 + Math.sin(i / 17) * 30);
    demoRows.push({
      TransactionID: `DEMO-${String(i + 1).padStart(5, "0")}`,
      Time: i * 38,
      Amount: repeated ? 777.77 : Number(amount.toFixed(2)),
      V1: isOutlier ? 5 + Math.random() : Math.random() * 2 - 1,
      V2: repeated ? -4.8 : Math.random() * 2 - 1,
      V3: isOutlier ? -5.4 : Math.random() * 2 - 1,
      Class: isOutlier || repeated ? 1 : 0,
    });
  }
  analyze(demoRows, ["TransactionID", "Time", "Amount", "V1", "V2", "V3", "Class"]);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map((item) => item.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      const raw = cells[index] ?? "";
      const value = raw.trim();
      const numeric = Number(value);
      row[header] = value !== "" && Number.isFinite(numeric) ? numeric : value;
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function analyze(rows, headers = []) {
  if (!rows.length) {
    setStatus("분석 가능한 거래 데이터가 없습니다.");
    return;
  }

  const cleanRows = rows.map((row, index) => normalizeRow(row, index));
  const amountValues = cleanRows.map((row) => row.Amount).filter(Number.isFinite);
  const amountThreshold = percentile(amountValues, 0.99);
  const amountStats = summaryStats(amountValues);
  const featureKeys = findFeatureKeys(cleanRows, headers);
  const featureStats = Object.fromEntries(
    featureKeys.map((key) => [key, summaryStats(cleanRows.map((row) => Number(row[key])).filter(Number.isFinite))])
  );
  const duplicateMap = buildDuplicateMap(cleanRows);
  const missingCount = rows.reduce((count, row) => {
    return count + Object.values(row).filter((value) => value === "" || value == null).length;
  }, 0);

  const results = cleanRows.map((row) => {
    const reasons = [];
    let score = 0;

    const highAmount = row.Amount >= amountThreshold;
    if (highAmount) {
      score += 20;
      reasons.push("Amount 상위 1% 고액 거래");
    }

    const amountZ = zScore(row.Amount, amountStats);
    const featureZ = featureKeys.reduce((maxValue, key) => {
      const value = Number(row[key]);
      return Math.max(maxValue, Math.abs(zScore(value, featureStats[key])));
    }, 0);
    const abnormal = Math.abs(amountZ) >= 3 || featureZ >= 3.5;
    if (abnormal) {
      score += 30;
      reasons.push("평균 거래 패턴 대비 큰 편차");
    }

    const repeated = duplicateMap.get(row.Signature) > 1;
    if (repeated) {
      score += 10;
      reasons.push("유사 거래 패턴 반복");
    }

    const mlProbability = anomalyProbability(amountZ, featureZ, repeated);
    if (mlProbability >= 0.72) {
      score += 50;
      reasons.push(`ML 보조 모델 이상 가능성 ${(mlProbability * 100).toFixed(1)}%`);
    }

    score = Math.min(100, score);
    return {
      ...row,
      RiskScore: score,
      RiskLevel: score >= 70 ? "High Risk" : score >= 30 ? "Medium Risk" : "Low Risk",
      RiskReason: reasons.length ? reasons.join(" / ") : "일반 거래 패턴",
      MLProbability: mlProbability,
    };
  });

  results.sort((a, b) => b.RiskScore - a.RiskScore || b.Amount - a.Amount);

  state.rows = cleanRows;
  state.results = results;
  state.stats = {
    total: cleanRows.length,
    missingCount,
    duplicateCount: [...duplicateMap.values()].filter((count) => count > 1).length,
    amountThreshold,
    featureKeys,
    amountStats,
  };

  renderDashboard();
  renderTable();
  el.reportButton.disabled = false;
  el.csvButton.disabled = false;
  setStatus(`${cleanRows.length.toLocaleString()}건 분석 완료. 상위 위험 거래를 검토하세요.`);
}

function normalizeRow(row, index) {
  const amount = Number(row.Amount ?? row.amount ?? row.TransactionAmount ?? 0);
  const time = Number(row.Time ?? row.time ?? row.TransactionTime ?? index);
  const id = row.TransactionID ?? row.TransactionId ?? row.ID ?? row.id ?? `TX-${index + 1}`;
  return {
    ...row,
    TransactionID: id,
    Time: Number.isFinite(time) ? time : index,
    Amount: Number.isFinite(amount) ? amount : 0,
  };
}

function findFeatureKeys(rows, headers) {
  const candidates = headers.length ? headers : Object.keys(rows[0] ?? {});
  return candidates.filter((key) => {
    if (["TransactionID", "TransactionId", "ID", "id", "Time", "Amount", "Class"].includes(key)) {
      return false;
    }
    const sample = rows.slice(0, 200).map((row) => Number(row[key]));
    return sample.some(Number.isFinite);
  });
}

function buildDuplicateMap(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const hourBucket = Math.floor(row.Time / 3600);
    const amountBucket = Math.round(row.Amount * 100) / 100;
    row.Signature = `${hourBucket}|${amountBucket}`;
    map.set(row.Signature, (map.get(row.Signature) ?? 0) + 1);
  });
  return map;
}

function summaryStats(values) {
  if (!values.length) return { mean: 0, sd: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { mean, sd: Math.sqrt(variance) };
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * ratio));
  return sorted[index];
}

function zScore(value, stats) {
  if (!Number.isFinite(value) || !stats?.sd) return 0;
  return (value - stats.mean) / stats.sd;
}

function anomalyProbability(amountZ, featureZ, repeated) {
  const signal = Math.abs(amountZ) * 0.38 + featureZ * 0.42 + (repeated ? 0.75 : 0) - 2.4;
  return 1 / (1 + Math.exp(-signal));
}

function renderDashboard() {
  const total = state.results.length;
  const high = state.results.filter((row) => row.RiskLevel === "High Risk").length;
  const medium = state.results.filter((row) => row.RiskLevel === "Medium Risk").length;
  const low = total - high - medium;
  const reviewCount = high + medium;

  el.totalCount.textContent = total.toLocaleString();
  el.highCount.textContent = high.toLocaleString();
  el.reductionRate.textContent = total ? `${Math.max(0, (100 - (reviewCount / total) * 100)).toFixed(1)}%` : "0%";
  el.riskRate.textContent = total ? `${((high / total) * 100).toFixed(2)}%` : "0%";

  updateBar("high", high, total);
  updateBar("medium", medium, total);
  updateBar("low", low, total);

  el.qualityList.innerHTML = `
    <li>Missing Value: ${state.stats.missingCount.toLocaleString()}개 확인</li>
    <li>Duplicate Transaction: ${state.stats.duplicateCount.toLocaleString()}개 유사 패턴 그룹</li>
    <li>Amount 상위 1% 기준: ${formatMoney(state.stats.amountThreshold)}</li>
    <li>Feature Scaling: ${state.stats.featureKeys.length.toLocaleString()}개 거래 특성 변수 표준화</li>
  `;
}

function updateBar(type, count, total) {
  const pct = total ? (count / total) * 100 : 0;
  el[`${type}Bar`].style.width = `${pct}%`;
  el[`${type}Pct`].textContent = `${pct.toFixed(1)}%`;
}

function renderTable() {
  const risk = el.riskFilter.value;
  const limit = Number(el.limitSelect.value);
  const rows = state.results
    .filter((row) => risk === "all" || row.RiskLevel === risk)
    .slice(0, limit);

  if (!rows.length) {
    el.exceptionBody.innerHTML = `<tr><td colspan="6">표시할 거래가 없습니다.</td></tr>`;
    return;
  }

  el.exceptionBody.innerHTML = rows
    .map((row) => {
      const levelClass =
        row.RiskLevel === "High Risk"
          ? "risk-high"
          : row.RiskLevel === "Medium Risk"
            ? "risk-medium"
            : "risk-low";
      return `
        <tr>
          <td>${escapeHtml(row.TransactionID)}</td>
          <td>${formatNumber(row.Time)}</td>
          <td>${formatMoney(row.Amount)}</td>
          <td><strong>${row.RiskScore}</strong></td>
          <td><span class="risk-pill ${levelClass}">${row.RiskLevel}</span></td>
          <td>${escapeHtml(row.RiskReason)}</td>
        </tr>
      `;
    })
    .join("");
}

function downloadExcelReport() {
  if (!window.XLSX) {
    setStatus("Excel 라이브러리를 불러오지 못했습니다. CSV 다운로드를 사용해주세요.");
    return;
  }

  const total = state.results.length;
  const high = state.results.filter((row) => row.RiskLevel === "High Risk").length;
  const medium = state.results.filter((row) => row.RiskLevel === "Medium Risk").length;
  const workbook = XLSX.utils.book_new();

  const summary = [
    ["Metric", "Value"],
    ["Total Transactions", total],
    ["High Risk Transactions", high],
    ["Medium Risk Transactions", medium],
    ["Risk Ratio", total ? high / total : 0],
    ["Review Reduction Rate", total ? 1 - (high + medium) / total : 0],
  ];
  const exceptionRows = state.results
    .filter((row) => row.RiskScore > 0)
    .slice(0, 5000)
    .map((row) => ({
      TransactionID: row.TransactionID,
      Time: row.Time,
      Amount: row.Amount,
      RiskScore: row.RiskScore,
      RiskLevel: row.RiskLevel,
      MLProbability: Number(row.MLProbability.toFixed(4)),
      RiskReason: row.RiskReason,
    }));
  const analysis = [
    ["Analysis Criteria", "Finding"],
    ["High Amount Rule", `Amount top 1% threshold: ${state.stats.amountThreshold}`],
    ["Abnormal Pattern Rule", "Amount z-score >= 3 or feature z-score >= 3.5"],
    ["Repeated Transaction Rule", "Same hour bucket and same amount pattern"],
    ["ML Assist", "Browser-based anomaly probability score"],
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary Dashboard");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(exceptionRows), "Exception List");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(analysis), "Analysis Result");
  XLSX.writeFile(workbook, "Audit Risk Report.xlsx");
}

function downloadExceptionCsv() {
  const headers = ["TransactionID", "Time", "Amount", "RiskScore", "RiskLevel", "MLProbability", "RiskReason"];
  const rows = state.results
    .filter((row) => row.RiskScore > 0)
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","));
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "audit_exception_list.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function setStatus(message) {
  el.statusText.textContent = message;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
