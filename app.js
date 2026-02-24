const excludeInput = document.getElementById("excludeInput");
const seedInput = document.getElementById("seedInput");
const btnGenerate = document.getElementById("btnGenerate");
const balls = document.getElementById("balls");
const genMeta = document.getElementById("genMeta");

function parseNums(text) {
  if (!text) return [];
  return text
    .split(/[,\s]+/)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 45);
}

function uniqueSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

// 조합 개수 계산: nCk
function nCk(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= (n - (k - i));
    den *= i;
  }
  return Math.floor(num / den);
}

// seed RNG
function makeRng(seed) {
  if (!seed) return Math.random;

  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0;

  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 4294967296;
  };
}

function generateNumbers(exclude, seed) {
  const ex = new Set(exclude);
  const rng = makeRng(seed);

  const pool = [];
  for (let i = 1; i <= 45; i++) {
    if (!ex.has(i)) pool.push(i);
  }

  if (pool.length < 6) {
    throw new Error("제외 번호가 너무 많아서 6개를 뽑을 수 없어요. (최소 6개는 남겨야 함)");
  }

  // 셔플 후 6개 픽
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 6).sort((a, b) => a - b);
}

function generateFiveLines(exclude, seed) {
  const ex = uniqueSorted(exclude);
  const poolSize = 45 - ex.length;

  // 가능한 조합이 5개 미만이면 5줄 중복 없이 생성 불가
  const combos = nCk(poolSize, 6);
  if (combos < 5) {
    throw new Error(
      `현재 제외 번호로 가능한 조합이 ${combos}개라서 5줄(중복 없이) 생성 불가예요. 제외 번호를 줄여주세요.`
    );
  }

  const lines = [];
  const seen = new Set();

  const maxAttempts = 5000;
  let attempts = 0;

  while (lines.length < 5) {
    if (++attempts > maxAttempts) {
      throw new Error("중복 없이 5줄 생성이 어려워요. (시드 제거 또는 제외 번호를 줄여주세요)");
    }

    // seed가 있으면 시도마다 달라지게 변형
    const attemptSeed = seed ? `${seed}_${attempts}` : "";
    const nums = generateNumbers(ex, attemptSeed);
    const key = nums.join("-");

    if (seen.has(key)) continue;

    seen.add(key);
    lines.push(nums);
  }

  return lines;
}

function render(lines) {
  balls.innerHTML = "";

  lines.forEach((nums) => {
    const row = document.createElement("div");
    row.className = "row";

    nums.forEach((n) => {
      const ball = document.createElement("div");
      ball.className = "ball";
      ball.textContent = n;
      row.appendChild(ball);
    });

    balls.appendChild(row);
  });
}

function now() {
  return new Date().toLocaleString();
}

btnGenerate.onclick = () => {
  try {
    const exclude = uniqueSorted(parseNums(excludeInput.value));
    excludeInput.value = exclude.join(", "); // 정리해서 다시 보여주기

    const seed = (seedInput.value || "").trim();

    const lines = generateFiveLines(exclude, seed);
    render(lines);

    genMeta.textContent = `생성 완료: ${now()} · 제외 ${exclude.length ? exclude.join(", ") : "없음"} · 시드 ${seed || "없음"}`;
  } catch (e) {
    console.error(e);
    alert(e.message || "오류가 발생했어요. (F12 콘솔 확인)");
  }
};