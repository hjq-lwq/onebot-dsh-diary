/**
 * 唤醒提示组装：【会话令牌】+【本次消息】。
 * 零依赖。
 */
import { timeStr } from './auth.mjs';

const SNAPSHOT_LIMIT = 12;

function senderOf(m) {
  return m?.isSelf ? '我' : (m?.sender || '对方');
}

function bodyOf(m) {
  return String(m?.text ?? m?.plain ?? '').replace(/\s+/g, ' ').slice(0, 200);
}

/**
 * @param {object} args
 * @param {string} args.key - 当前会话 key（private:<QQ号>）
 * @param {object} args.st - 该会话状态（recentMessages / agentToken）
 */
export function buildWakePrompt({ key, st }) {
  const tokenLine = `【会话令牌】${st.agentToken}（调用任何 mcp__onebot-diary__* 工具都必须带这个 token）\n\n`;
  const recent = Array.isArray(st.recentMessages) ? st.recentMessages.slice(-SNAPSHOT_LIMIT) : [];
  const snapshot = recent.length
    ? `【本次消息】\n${recent.map((m) => `${senderOf(m)}：${bodyOf(m)}`).join('\n')}\n\n`
    : '';
  const nowLine = `【现在时间】${timeStr(Date.now())}\n\n`;
  return `${tokenLine}${nowLine}${snapshot}【要求】请以聊天对象的身份自然回复当前会话 ${key}。文本输出不会自动发送到 QQ：发言必须调用 mcp__onebot-diary__qq_send_message（key 和 token 用上面的）。回复简短、口语化、不要 Markdown。没有可回的内容时可以只看不回。`;
}
