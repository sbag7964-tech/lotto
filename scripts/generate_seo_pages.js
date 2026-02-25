// scripts/generate_seo_pages.js
// 매일 1개 SEO 페이지 생성 + sitemap.xml 자동 업데이트 (GitHub Pages용)

const fs = require("fs");
const path = require("path");

const SITE = "https://pick6.xyz";
const SEO_DIR = path.join(process.cwd(), "seo");
const SITEMAP_PATH = path.join(process.cwd(), "sitemap.xml");

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayKST() {
  // GitHub Actions는 UTC 기준이라, KST(+9)로 "오늘"을 맞춰줌
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = pad(kst.getUTCMonth() + 1);
  const d = pad(kst.getUTCDate());
  return `${y}-${m}-${d}`;
}

function slugForDate(dateStr) {
  return `lotto-${dateStr}.html`; // seo/lotto-2026-02-25.html
}

function pageTitle(dateStr) {
  return `오늘의 로또 번호 추천 (${dateStr}) | pick6.xyz`;
}

function pageDescription(dateStr) {
  return `오늘(${dateStr})의 로또 번호 추천을 확인하세요. pick6.xyz에서 로또 번호를 5줄 자동 생성할 수 있습니다.`;
}

function pageHtml(dateStr, canonicalUrl) {
  const title = pageTitle(dateStr);
  const desc = pageDescription(dateStr);

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonicalUrl}" />
</head>
<body style="background:#0b0f17;color:#e5e7eb;font-family:sans-serif;max-width:780px;margin:auto;padding:20px;line-height:1.7;">
  <h1>${title}</h1>

  <p>
    pick6.xyz는 로또 번호를 랜덤 알고리즘으로 5줄 생성해주는 무료 도구입니다.
    제외 번호와 시드 옵션을 사용해 원하는 조건으로 번호를 생성할 수 있습니다.
  </p>

  <h2>오늘의 추천 번호 생성하기</h2>
  <p>
    아래 버튼을 눌러 오늘의 추천 번호 5줄을 생성해보세요.
  </p>

  <p>
    <a href="${SITE}" style="display:inline-block;padding:12px 14px;border-radius:10px;background:#2563eb;color:white;text-decoration:none;font-weight:800;">
      pick6.xyz에서 번호 생성하기
    </a>
  </p>

  <p style="margin-top:18px;color:#9ca3af;font-size:13px;">
    ※ 본 페이지는 정보 제공용이며 당첨을 보장하지 않습니다.
  </p>

  <hr style="border:none;border-top:1px solid #1f2937;margin:18px 0;" />
  <p style="color:#9ca3af;font-size:13px;">
    <a href="${SITE}/about.html">소개</a> ·
    <a href="${SITE}/privacy.html">개인정보처리방침</a> ·
    <a href="${SITE}/contact.html">문의</a>
  </p>
</body>
</html>`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readExistingSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) return null;
  return fs.readFileSync(SITEMAP_PATH, "utf8");
}

function buildSitemap(urls) {
  const items = urls
    .map(
      (u) => `  <url>
    <loc>${u}</loc>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

function extractLocsFromSitemap(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1]);
  return locs;
}

function main() {
  const dateStr = todayKST();
  const filename = slugForDate(dateStr);
  const relPath = `seo/${filename}`;
  const url = `${SITE}/${relPath}`;

  ensureDir(SEO_DIR);

  const outPath = path.join(SEO_DIR, filename);

  // 이미 오늘 페이지가 있으면 종료 (중복 생성 방지)
  if (fs.existsSync(outPath)) {
    console.log("Today page already exists:", outPath);
  } else {
    const html = pageHtml(dateStr, url);
    fs.writeFileSync(outPath, html, "utf8");
    console.log("Generated:", outPath);
  }

  // sitemap.xml 업데이트 (기존 + 신규 합치기)
  const existing = readExistingSitemap();
  let urls = [];

  if (existing) {
    urls = extractLocsFromSitemap(existing);
  }

  // 필수 기본 페이지들 포함
  const mustHave = [
    `${SITE}/`,
    `${SITE}/about.html`,
    `${SITE}/privacy.html`,
    `${SITE}/contact.html`,
    `${SITE}/ads.txt`,
  ];

  for (const u of mustHave) if (!urls.includes(u)) urls.push(u);
  if (!urls.includes(url)) urls.push(url);

  // 너무 커지는 걸 방지(원하면 숫자 조절)
  // 최신 365개만 유지 + 기본 페이지들
  const seoUrls = urls.filter((u) => u.includes(`${SITE}/seo/`)).sort().slice(-365);
  const baseUrls = urls.filter((u) => !u.includes(`${SITE}/seo/`));
  const finalUrls = [...new Set([...baseUrls, ...seoUrls])];

  fs.writeFileSync(SITEMAP_PATH, buildSitemap(finalUrls), "utf8");
  console.log("Updated sitemap.xml with", finalUrls.length, "urls");
}

main();
