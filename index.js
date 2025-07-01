const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

// Your bot token
const token = '7685007895:AAHvVqzZMyykZ5C5LM9iuRWgKaqNdvJtrSo';
const bot = new TelegramBot(token, { polling: true });

const clockEmojis = [
  "🕛", "🕧", "🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓", "🕟",
  "🕔", "🕠", "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤",
  "🕙", "🕥", "🕚", "🕦"
];

function getClockEmoji(time) {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return "⌛";
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const isPM = m[3].toUpperCase() === 'PM';
  if (h === 12) h = 0;
  const hour24 = h + (isPM ? 12 : 0);
  const index = (hour24 * 2 + (min >= 30 ? 1 : 0)) % 24;
  return clockEmojis[index];
}

function parseText(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  const d = {}, owner = {};
  let inOwner = false;

  lines.forEach(l => {
    if (l.includes('Owner Info')) inOwner = true;
    const m = l.match(/^[├└][─–]\s*([^:]+):\s*(.+)$/);
    if (m) {
      const key = m[1].trim(), val = m[2].trim();
      if (inOwner) owner[key] = val;
      else d[key] = val;
    }
    if (!d['Created At'] && l.startsWith('Created At:')) {
      d['Created At'] = l.split('Created At:')[1].trim();
    }
  });

  const loginTime = d['Last Login'] || '';
  const emoji = getClockEmoji(loginTime);
  const fmt = [];

  fmt.push('🎮 Account Info By 🛡️ Ri Fahad 👑');
  fmt.push(`├👤 Name: ${d['Nickname']||''}`);
  fmt.push(`├🆔 UID: ${d['UID']||''}`);
  fmt.push(`├🔥Level: ${d['Level']||''}${d['Exp']?` (Exp: ${d['Exp']})`:''}`);
  fmt.push(`├🇷🇩 Region: ${d['Region']||''}`);
  fmt.push(`├👍 Likes: ${d['Likes']||''}`);
  fmt.push(`├📝 Bio: ${d['Signature']||''}`);
  fmt.push(`├⏱️ Created At: ${d['Created At']||''}`);
  fmt.push(`└${emoji} Last Login: ${loginTime}`);
  fmt.push('');
  fmt.push(' 🔰Guild Info by 🛡️ Ri Fahad 👑');
  fmt.push(`├👤Guild Name: ${d['Guild Name']||''}`);
  fmt.push(`├🆔 Guild ID: ${d['Guild ID']||''}`);
  fmt.push(`├🔥 Level: ${d['Guild Level']||''}`);
  fmt.push(`├👍 Likes: ${d['Likes']||''}`);
  fmt.push(`└👥 Members: ${d['Live Members']||''}`);
  fmt.push('');
  fmt.push(' 🔰 Guild Leader Info by 🛡️ Ri Fahad 👑');
  fmt.push(`├👤Name: ${owner['Nickname']||''}`);
  fmt.push(`├🆔 UID: ${owner['UID']||''}`);
  fmt.push(`├🔥 Level: ${owner['Level']||''}`);
  fmt.push(`└👍 LIKES: ${owner['Likes']||''}`);
  fmt.push('');
  fmt.push('🌐 Powered By fflike.netlify.app');
  return fmt.join('\n');
}

// Normal message handling (for private or allowed group use)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const sender = msg.from;
  const isGroup = chatId < 0;
  const isFromBot = sender && sender.is_bot;

  const text = msg.text || msg.caption || (msg.document && msg.document.caption);
  if (!text || text.length < 20) return;

  if (isGroup && !isFromBot) {
    // User message in group: delete
    try {
      await bot.deleteMessage(chatId, msg.message_id);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
    return;
  }

  if (!isGroup) {
    // Private chat — allow all
    try {
      const result = parseText(text);
      bot.sendMessage(chatId, result, {
        reply_to_message_id: msg.message_id
      });
    } catch (e) {
      bot.sendMessage(chatId, '❌ Something went wrong while formatting.');
    }
  }
});

// /p command for reply-based parsing (from other bots)
bot.onText(/^\/con$/, async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.reply_to_message || !msg.reply_to_message.text) {
    return bot.sendMessage(chatId, '📌 Reply to a Free Fire account message and send /p');
  }

  const repliedText = msg.reply_to_message.text;

  try {
    const result = parseText(repliedText);
    await bot.sendMessage(chatId, result, {
      reply_to_message_id: msg.message_id
    });
  } catch (e) {
    bot.sendMessage(chatId, '❌ Could not parse the replied message.');
  }
});
