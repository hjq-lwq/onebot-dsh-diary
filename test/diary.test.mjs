import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { diaryWrite, diaryRead, diaryList } from '../src/diary.mjs';

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'listen-diary-'));
}

test('写入当天日记并可读回', () => {
  const dir = tmp();
  const { date } = diaryWrite(dir, '日记', '今天写了第一条日记', '开心');
  const { text } = diaryRead(dir, '日记', date);
  assert.match(text, /今天写了第一条日记/);
  assert.match(text, /心情：开心/);
});

test('文件名格式 <前缀>-YYYY-MM-DD.md', () => {
  const dir = tmp();
  const { date } = diaryWrite(dir, '日记', 'x');
  const file = path.join(dir, `日记-${date}.md`);
  assert.ok(fs.existsSync(file));
});

test('读不存在的日期报错', () => {
  const dir = tmp();
  assert.throws(() => diaryRead(dir, '日记', '2020-01-01'));
});

test('非法日期被拒绝', () => {
  const dir = tmp();
  assert.throws(() => diaryRead(dir, '日记', '2020/01/01'));
});

test('list 返回最近日记', () => {
  const dir = tmp();
  diaryWrite(dir, '日记', 'a');
  fs.writeFileSync(path.join(dir, '日记-2026-11-01.md'), '旧日记\n');
  const list = diaryList(dir, '日记');
  assert.equal(list.length, 2);
  assert.ok(list[0].date > list[1].date);
});

test('前缀非法被拒绝', () => {
  const dir = tmp();
  assert.throws(() => diaryWrite(dir, '../x', 'a'));
});
