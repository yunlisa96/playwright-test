import * as fs from 'fs';
import * as path from 'path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { explainResult, getTestMeta } from './test-catalog';

interface RawAttachment {
  name: string;
  contentType: string;
  sourcePath: string;
}

interface MediaItem {
  name: string;
  label: string;
  type: 'screenshot' | 'video' | 'trace' | 'image';
  relativePath: string;
}

interface RecordedTest {
  key: string;
  title: string;
  fullTitle: string;
  file: string;
  line: number;
  project: string;
  describePath: string[];
  status: string;
  duration: number;
  retry: number;
  errorMessage: string;
  errorStack: string;
  steps: string[];
  annotations: Array<{ type: string; description?: string }>;
  attachments: RawAttachment[];
  media: MediaItem[];
}

interface ReporterOptions {
  outputFile?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function collectSteps(steps: TestStep[], depth = 0): string[] {
  const result: string[] = [];
  for (const step of steps) {
    if (step.category === 'test.step') {
      const prefix = depth > 0 ? '  '.repeat(depth) : '';
      const status = step.error ? ' ✗' : step.duration >= 0 ? '' : '';
      result.push(`${prefix}${step.title}${status}`);
    }
    if (step.steps?.length) {
      result.push(...collectSteps(step.steps, depth + 1));
    }
  }
  return result;
}

function getDescribePath(test: TestCase): string[] {
  const titles: string[] = [];
  let suite: Suite | undefined = test.parent;
  while (suite && suite.title) {
    titles.unshift(suite.title);
    suite = suite.parent ?? undefined;
  }
  return titles;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    passed: '통과',
    failed: '실패',
    skipped: '건너뜀',
    timedOut: '타임아웃',
    interrupted: '중단',
  };
  return labels[status] ?? status;
}

function statusClass(status: string): string {
  return `status-${status}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
}

function guessExtension(contentType: string, sourcePath?: string): string {
  if (sourcePath) {
    const ext = path.extname(sourcePath);
    if (ext) return ext;
  }
  if (contentType.startsWith('image/png')) return '.png';
  if (contentType.startsWith('image/jpeg')) return '.jpg';
  if (contentType.startsWith('video/webm')) return '.webm';
  if (contentType.includes('zip')) return '.zip';
  return '';
}

function classifyMedia(name: string, contentType: string): MediaItem['type'] {
  if (contentType.startsWith('video/')) return 'video';
  if (name === 'trace' || contentType.includes('zip')) return 'trace';
  if (name === 'screenshot' || name.includes('failed') || name === 'actual') return 'screenshot';
  if (contentType.startsWith('image/')) return 'image';
  return 'image';
}

function attachmentLabel(name: string, type: MediaItem['type']): string {
  const labels: Record<string, string> = {
    screenshot: '테스트 종료 시점 스크린샷',
    video: '테스트 실행 영상',
    trace: 'Trace (타임라인 디버그)',
    expected: '기준 이미지 (Expected)',
    actual: '실제 캡처 (Actual)',
    diff: '차이 비교 (Diff)',
    'test-failed-1.png': '실패 시점 스크린샷',
  };
  if (labels[name]) return labels[name];
  if (type === 'video') return '테스트 실행 영상';
  if (type === 'screenshot') return '스크린샷';
  if (type === 'trace') return 'Trace 파일';
  return name;
}

function collectAttachments(result: TestResult): RawAttachment[] {
  const attachments: RawAttachment[] = [];
  for (const att of result.attachments) {
    if (att.path && fs.existsSync(att.path)) {
      attachments.push({
        name: att.name,
        contentType: att.contentType,
        sourcePath: att.path,
      });
    }
  }
  return attachments;
}

function mergeAttachments(existing: RawAttachment[], incoming: RawAttachment[]): RawAttachment[] {
  const map = new Map<string, RawAttachment>();
  for (const att of [...existing, ...incoming]) {
    map.set(`${att.name}::${att.sourcePath}`, att);
  }
  return Array.from(map.values());
}

function copyMediaToReportDir(tests: RecordedTest[], outputFile: string): void {
  const reportPath = path.resolve(process.cwd(), outputFile);
  const assetsDir = path.join(path.dirname(reportPath), 'detailed-report-data');

  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(assetsDir, { recursive: true });

  tests.forEach((test, idx) => {
    test.media = [];
    test.attachments.forEach((att, attIdx) => {
      if (!fs.existsSync(att.sourcePath)) return;

      const ext = guessExtension(att.contentType, att.sourcePath);
      const type = classifyMedia(att.name, att.contentType);
      const destName = `${String(idx).padStart(3, '0')}-${sanitizeFileName(att.name)}-${attIdx}${ext}`;
      const destPath = path.join(assetsDir, destName);

      fs.copyFileSync(att.sourcePath, destPath);

      test.media.push({
        name: att.name,
        label: attachmentLabel(att.name, type),
        type,
        relativePath: `detailed-report-data/${destName}`,
      });
    });
  });
}

function buildMediaSection(media: MediaItem[]): string {
  if (!media.length) {
    return `<section>
      <h4>스크린샷 / 영상 기록</h4>
      <p class="muted">기록된 미디어가 없습니다.</p>
    </section>`;
  }

  const items = media.map(m => {
    if (m.type === 'video') {
      return `<figure class="media-item media-video">
        <video controls preload="metadata" playsinline src="${escapeHtml(m.relativePath)}"></video>
        <figcaption>${escapeHtml(m.label)}</figcaption>
      </figure>`;
    }
    if (m.type === 'trace') {
      return `<div class="media-item media-trace">
        <a href="${escapeHtml(m.relativePath)}" download class="trace-download">📎 ${escapeHtml(m.label)} 다운로드</a>
        <span class="trace-hint">Playwright Trace Viewer에서 열기: <code>npx playwright show-trace ${escapeHtml(m.relativePath)}</code></span>
      </div>`;
    }
    return `<figure class="media-item media-image">
      <a href="${escapeHtml(m.relativePath)}" target="_blank" rel="noopener">
        <img src="${escapeHtml(m.relativePath)}" alt="${escapeHtml(m.label)}" loading="lazy">
      </a>
      <figcaption>${escapeHtml(m.label)} <span class="open-hint">(클릭하여 원본 보기)</span></figcaption>
    </figure>`;
  }).join('\n');

  return `<section class="media-section">
    <h4>스크린샷 / 영상 기록</h4>
    <div class="media-grid">${items}</div>
  </section>`;
}

function buildHtml(
  config: FullConfig,
  fullResult: FullResult,
  tests: RecordedTest[],
  startTime: Date,
): string {
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;
  const withMedia = tests.filter(t => t.media.length > 0).length;
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.BASE_URL ?? 'http://localhost:5000';

  const projectInfo = config.projects.map(p => {
    const viewport = p.use?.viewport;
    const vp = viewport ? `${viewport.width}×${viewport.height}` : '기본';
    return `<li><strong>${escapeHtml(p.name)}</strong> — ${escapeHtml(String(p.use?.defaultBrowserType ?? 'chromium'))}, viewport ${vp}</li>`;
  }).join('\n');

  const testCards = tests.map((t, idx) => {
    const meta = getTestMeta(t.title, t.file, t.describePath, t.project);
    const resultExplanation = explainResult(t.status, t.errorMessage, meta, t.annotations);
    const catalogSteps = meta.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    const executedSteps = t.steps.length
      ? t.steps.map(s => `<li class="executed">${escapeHtml(s)}</li>`).join('')
      : '<li class="muted">실행 단계 기록 없음 (helpers의 test.step() 또는 테스트 내 step 사용 시 표시됩니다)</li>';

    const annotations = t.annotations.length
      ? t.annotations.map(a =>
          `<span class="annotation"><strong>${escapeHtml(a.type)}</strong>: ${escapeHtml(a.description ?? '')}</span>`,
        ).join('')
      : '';

    const errorBlock = t.errorMessage
      ? `<div class="error-box">
          <h4>원본 에러</h4>
          <pre>${escapeHtml(t.errorMessage)}</pre>
          ${t.errorStack ? `<details><summary>스택 트레이스</summary><pre>${escapeHtml(t.errorStack)}</pre></details>` : ''}
        </div>`
      : '';

    const mediaBadge = t.media.length
      ? `<span class="media-badge">📷 ${t.media.filter(m => m.type !== 'video' && m.type !== 'trace').length} · 🎬 ${t.media.filter(m => m.type === 'video').length}</span>`
      : '';

    return `
    <article class="test-card ${statusClass(t.status)}" data-status="${t.status}" data-category="${escapeHtml(meta.category)}">
      <header class="test-header" onclick="toggleCard(${idx})">
        <span class="badge ${statusClass(t.status)}">${statusLabel(t.status)}</span>
        <span class="test-id">${meta.id ? escapeHtml(meta.id) : ''}</span>
        <h3>${escapeHtml(t.title)}</h3>
        <span class="meta-right">
          ${mediaBadge}
          <span class="category">${escapeHtml(meta.category)}</span>
          <span class="duration">${formatDuration(t.duration)}</span>
          ${t.retry > 0 ? `<span class="retry">재시도 ${t.retry}</span>` : ''}
        </span>
      </header>
      <div class="test-body" id="body-${idx}">
        <div class="info-grid">
          <div class="info-item"><label>프로젝트</label><span>${escapeHtml(t.project)}</span></div>
          <div class="info-item"><label>파일</label><span>${escapeHtml(t.file)}:${t.line}</span></div>
          <div class="info-item"><label>그룹</label><span>${escapeHtml(t.describePath.join(' › ') || '-')}</span></div>
        </div>

        ${buildMediaSection(t.media)}

        <section>
          <h4>테스트 목적</h4>
          <p>${escapeHtml(meta.purpose)}</p>
        </section>

        <section>
          <h4>수행 절차 (정의)</h4>
          <ol class="steps">${catalogSteps}</ol>
        </section>

        <section>
          <h4>실제 실행 단계</h4>
          <ol class="steps executed-steps">${executedSteps}</ol>
        </section>

        <section>
          <h4>기대 결과</h4>
          <p>${escapeHtml(meta.expected)}</p>
        </section>

        <section class="result-section ${statusClass(t.status)}">
          <h4>결과 설명</h4>
          <p>${escapeHtml(resultExplanation)}</p>
        </section>

        ${annotations ? `<section><h4>주석</h4><div class="annotations">${annotations}</div></section>` : ''}
        ${errorBlock}
      </div>
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>테스트 상세 리포트</title>
  <style>
    :root {
      --bg: #f6f8fa; --card: #fff; --text: #1f2328; --muted: #656d76;
      --pass: #1a7f37; --pass-bg: #dafbe1; --fail: #cf222e; --fail-bg: #ffebe9;
      --skip: #656d76; --skip-bg: #f6f8fa; --timeout: #bf8700; --timeout-bg: #fff8c5;
      --border: #d0d7de; --accent: #0969da;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
    h1 { font-size: 1.6rem; margin-bottom: 4px; }
    .subtitle { color: var(--muted); margin-bottom: 24px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .summary-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center; }
    .summary-card .num { font-size: 2rem; font-weight: 700; }
    .summary-card.passed .num { color: var(--pass); }
    .summary-card.failed .num { color: var(--fail); }
    .summary-card.skipped .num { color: var(--skip); }
    .summary-card.total .num { color: var(--accent); }
    .summary-card.media .num { color: #8250df; }
    .env-box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .env-box h2 { font-size: 1rem; margin-bottom: 10px; }
    .env-box ul { margin-left: 20px; }
    .env-box li { margin: 4px 0; }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .filter-btn { padding: 6px 14px; border: 1px solid var(--border); border-radius: 20px; background: var(--card); cursor: pointer; font-size: 0.85rem; }
    .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .test-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
    .test-card.status-failed, .test-card.status-timedOut { border-left: 4px solid var(--fail); }
    .test-card.status-passed { border-left: 4px solid var(--pass); }
    .test-card.status-skipped { border-left: 4px solid var(--skip); opacity: 0.85; }
    .test-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer; user-select: none; }
    .test-header:hover { background: #f6f8fa; }
    .test-header h3 { flex: 1; font-size: 0.95rem; font-weight: 600; }
    .badge { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px; white-space: nowrap; }
    .badge.status-passed { background: var(--pass-bg); color: var(--pass); }
    .badge.status-failed, .badge.status-timedOut { background: var(--fail-bg); color: var(--fail); }
    .badge.status-skipped { background: var(--skip-bg); color: var(--skip); }
    .test-id { font-size: 0.8rem; color: var(--accent); font-weight: 600; min-width: 90px; }
    .meta-right { display: flex; gap: 10px; align-items: center; font-size: 0.8rem; color: var(--muted); flex-wrap: wrap; justify-content: flex-end; }
    .category { background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; }
    .media-badge { background: #fbefff; color: #8250df; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .retry { color: var(--timeout); }
    .test-body { display: none; padding: 0 16px 16px; border-top: 1px solid var(--border); }
    .test-body.open { display: block; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 12px 0; }
    .info-item label { display: block; font-size: 0.75rem; color: var(--muted); font-weight: 600; text-transform: uppercase; }
    .info-item span { font-size: 0.85rem; }
    section { margin-top: 14px; }
    section h4 { font-size: 0.85rem; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
    section p { font-size: 0.9rem; }
    .muted { color: var(--muted); font-size: 0.88rem; }
    .steps { margin-left: 20px; font-size: 0.88rem; }
    .steps li { margin: 3px 0; }
    .steps li.executed { color: #0550ae; }
    .steps li.muted { color: var(--muted); list-style: none; margin-left: -20px; }
    .result-section { padding: 10px 14px; border-radius: 6px; margin-top: 4px; }
    .result-section.status-passed { background: var(--pass-bg); }
    .result-section.status-failed, .result-section.status-timedOut { background: var(--fail-bg); }
    .result-section.status-skipped { background: var(--skip-bg); }
    .media-section { background: #f6f8fa; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-top: 12px; }
    .media-section h4 { margin-bottom: 10px; }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .media-item { margin: 0; }
    .media-item img { width: 100%; height: auto; border: 1px solid var(--border); border-radius: 6px; display: block; background: #fff; cursor: zoom-in; }
    .media-item video { width: 100%; max-height: 360px; border: 1px solid var(--border); border-radius: 6px; background: #000; }
    .media-item figcaption { margin-top: 6px; font-size: 0.82rem; color: var(--muted); text-align: center; }
    .open-hint { font-size: 0.75rem; opacity: 0.7; }
    .media-trace { padding: 12px; background: #fff; border: 1px solid var(--border); border-radius: 6px; }
    .trace-download { color: var(--accent); font-weight: 600; text-decoration: none; }
    .trace-download:hover { text-decoration: underline; }
    .trace-hint { display: block; margin-top: 6px; font-size: 0.78rem; color: var(--muted); word-break: break-all; }
    .trace-hint code { font-size: 0.75rem; background: #eef2f7; padding: 2px 4px; border-radius: 3px; }
    .error-box { margin-top: 12px; background: #0d1117; color: #c9d1d9; border-radius: 6px; padding: 12px; }
    .error-box h4 { color: #8b949e; font-size: 0.75rem; margin-bottom: 6px; }
    .error-box pre { font-size: 0.78rem; white-space: pre-wrap; word-break: break-word; }
    .error-box details { margin-top: 8px; }
    .error-box summary { cursor: pointer; color: #8b949e; font-size: 0.8rem; }
    .footer { margin-top: 32px; text-align: center; color: var(--muted); font-size: 0.85rem; }
    .footer a { color: var(--accent); }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <h1>테스트 상세 리포트</h1>
    <p class="subtitle">${startTime.toLocaleString('ko-KR')} 실행 · ${statusLabel(fullResult.status)} · 총 ${formatDuration(fullResult.duration)}</p>

    <div class="summary">
      <div class="summary-card total"><div class="num">${tests.length}</div><div>전체</div></div>
      <div class="summary-card passed"><div class="num">${passed}</div><div>통과</div></div>
      <div class="summary-card failed"><div class="num">${failed}</div><div>실패</div></div>
      <div class="summary-card skipped"><div class="num">${skipped}</div><div>건너뜀</div></div>
      <div class="summary-card media"><div class="num">${withMedia}</div><div>미디어 포함</div></div>
    </div>

    <div class="env-box">
      <h2>실행 환경</h2>
      <ul>
        <li><strong>BASE_URL</strong>: ${escapeHtml(String(baseURL))}</li>
        <li><strong>타임아웃</strong>: ${config.timeout ?? 30000}ms · <strong>재시도</strong>: ${config.retries ?? 0}회</li>
        <li><strong>로케일</strong>: ${escapeHtml(String(config.projects[0]?.use?.locale ?? 'ko-KR'))}</li>
        <li><strong>미디어 기록</strong>: 모든 테스트 스크린샷 + 영상 저장 (실패 시 trace 추가)</li>
        <li><strong>프로젝트</strong>:
          <ul>${projectInfo}</ul>
        </li>
      </ul>
    </div>

    <div class="filters">
      <button class="filter-btn active" data-filter="all">전체 (${tests.length})</button>
      <button class="filter-btn" data-filter="passed">통과 (${passed})</button>
      <button class="filter-btn" data-filter="failed">실패 (${failed})</button>
      <button class="filter-btn" data-filter="skipped">건너뜀 (${skipped})</button>
    </div>

    <div id="test-list">${testCards}</div>

    <div class="footer">
      <p>Playwright HTML 리포트: <code>npx playwright show-report</code> · 상세 리포트: <code>npm run report:detail</code></p>
      <p>미디어 파일: <code>detailed-report-data/</code> 폴더 (HTML과 함께 보관)</p>
    </div>
  </div>

  <script>
    function toggleCard(idx) {
      const body = document.getElementById('body-' + idx);
      body.classList.toggle('open');
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.test-card').forEach(card => {
          if (filter === 'all') {
            card.classList.remove('hidden');
          } else if (filter === 'failed') {
            card.classList.toggle('hidden', !['failed','timedOut'].includes(card.dataset.status));
          } else {
            card.classList.toggle('hidden', card.dataset.status !== filter);
          }
        });
      });
    });

    document.querySelectorAll('.test-card.status-failed, .test-card.status-timedOut').forEach(card => {
      const idx = card.querySelector('.test-body')?.id?.replace('body-', '');
      if (idx) document.getElementById('body-' + idx)?.classList.add('open');
    });
  </script>
</body>
</html>`;
}

class DetailedReport implements Reporter {
  private config!: FullConfig;
  private outputFile: string;
  private testMap = new Map<string, RecordedTest>();
  private startTime = new Date();

  constructor(options: ReporterOptions = {}) {
    this.outputFile = options.outputFile ?? 'detailed-report.html';
  }

  onBegin(config: FullConfig) {
    this.config = config;
    this.startTime = new Date();
    this.testMap = new Map();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const key = `${test.id}::${test.parent.project()?.name ?? 'unknown'}`;
    const existing = this.testMap.get(key);
    const error = result.error;
    const attachments = mergeAttachments(existing?.attachments ?? [], collectAttachments(result));

    this.testMap.set(key, {
      key,
      title: test.title,
      fullTitle: test.titlePath().join(' › '),
      file: path.basename(test.location.file),
      line: test.location.line,
      project: test.parent.project()?.name ?? 'unknown',
      describePath: getDescribePath(test),
      status: result.status,
      duration: (existing?.duration ?? 0) + result.duration,
      retry: result.retry,
      errorMessage: error?.message ?? existing?.errorMessage ?? '',
      errorStack: error?.stack ?? existing?.errorStack ?? '',
      steps: collectSteps(result.steps).length ? collectSteps(result.steps) : (existing?.steps ?? []),
      annotations: [
        ...test.annotations,
        ...result.annotations,
      ],
      attachments,
      media: [],
    });
  }

  onEnd(result: FullResult) {
    const tests = Array.from(this.testMap.values());
    copyMediaToReportDir(tests, this.outputFile);
    const html = buildHtml(this.config, result, tests, this.startTime);
    const outPath = path.resolve(process.cwd(), this.outputFile);
    fs.writeFileSync(outPath, html, 'utf-8');
    const mediaCount = tests.reduce((sum, t) => sum + t.media.length, 0);
    console.log(`\n📋 상세 리포트 생성: ${outPath}`);
    console.log(`📷 미디어 ${mediaCount}개 복사: ${path.join(path.dirname(outPath), 'detailed-report-data')}`);
  }
}

export default DetailedReport;
