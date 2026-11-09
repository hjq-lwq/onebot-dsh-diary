/**
 * 日记：write / read / list。
 * 按天存成 <前缀>-YYYY-MM-DD.md，追加式写入，带时间戳小节。
 */
import fs from 'node:fs';
import path from 'node:path';
import { safeDate, safeFilename, todayStr, timeStr } from './auth.mjs';

const MAX_WRITE = 4000;
const MAX_READ = 20000;
const MAX_LIST = 14;

function requireDir(diaryDir) {
  fs.mkdirSync(diaryDir, { recursive: true });
  return diaryDir;
}

function fileNameOf(diaryDir, prefix, date) {
  const safePrefix = safeFilename(prefix);
  if (!safePrefix) throw new Error(`日记前缀不合法：${JSON.stringify(prefix)}`);
  return path.join(diaryDir, `${safePrefix}-${date}.md`);
}

export function diaryWrite(diaryDir, prefix, text, mood = '') {
  const content = String(text ?? '').trim();
  if (!content) throw new Error('日记内容不能为空');
  if (content.length > MAX_WRITE) throw new Error(`日记单次最多 ${MAX_WRITE} 字`);
  const date = todayStr();
  const file = fileNameOf(diaryDir, prefix, date);
  requireDir(diaryDir);
  const moodLine = typeof mood === 'string' && mood.trim() ? `\n心情：${mood.trim().slice(0, 20)}\n` : '\n';
  const block = `\n## ${timeStr(Date.now())}${moodLine}${content}\n`;
  fs.appendFileSync(file, block, 'utf8');
  return { date, file: path.basename(file), ok: true };
}

export function diaryRead(diaryDir, prefix, date = todayStr()) {
  const safe = safeDate(date);
  if (!safe) throw new Error(`日期格式应为 YYYY-MM-DD：${JSON.stringify(date)}`);
  const file = fileNameOf(diaryDir, prefix, safe);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    throw new Error(`这一天还没有日记：${safe}`);
  }
  if (text.length > MAX_READ) text = text.slice(0, MAX_READ) + '\n…（已截断）';
  return { date: safe, text };
}

export function diaryList(diaryDir, prefix) {
  requireDir(diaryDir);
  const safePrefix = safeFilename(prefix);
  if (!safePrefix) throw new Error(`日记前缀不合法：${JSON.stringify(prefix)}`);
  const re = new RegExp(`^${safePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{4}-\\d{2}-\\d{2})\\.md$`);
  const out = [];
  for (const name of fs.readdirSync(diaryDir)) {
    const m = re.exec(name);
    if (!m) continue;
    try {
      const stat = fs.statSync(path.join(diaryDir, name));
      out.push({ date: m[1], file: name, size: stat.size });
    } catch {
      // 忽略消失的文件
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, MAX_LIST);
}
