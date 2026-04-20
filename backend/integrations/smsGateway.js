import twilio from 'twilio';

let client = null;

function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

// Maps both ISO codes and UACS language names to a common lookup
// e.g. recipient.language = 'en' or 'hi' or 'hindi'
const LANG_KEY_MAP = {
  'en':      ['en', 'english'],
  'hi':      ['hi', 'hindi'],
  'ur':      ['ur', 'urdu'],
  'ta':      ['ta', 'tamil'],
  'bn':      ['bn', 'bengali'],
  'te':      ['te', 'telugu'],
  // reverse
  'english': ['en', 'english'],
  'hindi':   ['hi', 'hindi'],
  'urdu':    ['ur', 'urdu'],
  'tamil':   ['ta', 'tamil'],
  'bengali': ['bn', 'bengali'],
  'telugu':  ['te', 'telugu'],
};

/**
 * Find the best translation for a recipient.
 * Looks up the recipient's language preference against
 * the translations object (which may use UACS names like 'hindi' or ISO codes like 'hi').
 */
function pickTranslation(recipientLang, translations, masterContent) {
  if (!translations || typeof translations !== 'object') return masterContent;

  const recipLang = (recipientLang || 'en').toLowerCase();

  // 1. Direct key match
  if (translations[recipLang]) return translations[recipLang];

  // 2. Try all aliases for this language
  const aliases = LANG_KEY_MAP[recipLang] || [recipLang];
  for (const alias of aliases) {
    if (translations[alias]) return translations[alias];
  }

  // 3. Recipient wants English — always use en or master content
  if (recipLang === 'en' || recipLang === 'english') {
    return translations['en'] || translations['english'] || masterContent;
  }

  // 4. Fallback: master content (English)
  return masterContent;
}

export async function sendSMS(phoneNumber, messageBody) {
  const normalizedPhone = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+91${phoneNumber.replace(/^0/, '')}`;

  const msgPayload = {
    body: messageBody,
    to:   normalizedPhone,
  };

  // Prefer Messaging Service SID (supports geo-permissions + better deliverability)
  if (process.env.TWILIO_Messaging_Service_SID?.startsWith('MG')) {
    msgPayload.messagingServiceSid = process.env.TWILIO_Messaging_Service_SID;
  } else {
    msgPayload.from = process.env.TWILIO_PHONE_NUMBER?.trim();
  }

  try {
    const result = await getClient().messages.create(msgPayload);
    console.log(`[UACS SMS] ✅ Sent to ${normalizedPhone} | SID: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error(`[UACS SMS] ❌ Failed to ${normalizedPhone}:`, error.message);
    return { success: false, error: error.message };
  }
}


export async function sendBulkSMS(recipients, message) {
  // Parse translations if still a string (from DB)
  let translations = message.translations || {};
  if (typeof translations === 'string') {
    try { translations = JSON.parse(translations); } catch { translations = {}; }
  }

  console.log(`[UACS SMS] Translations available for keys: ${Object.keys(translations).join(', ') || 'none'}`);

  const results = await Promise.allSettled(
    recipients.map(recipient => {
      // Pick the right translation for this recipient's language
      const translatedText = pickTranslation(recipient.language, translations, message.master_content);

      const formattedMessage =
        message.urgency === 'critical'
          ? `🚨 EMERGENCY ALERT 🚨\n${translatedText}\n- Government Authority`
          : `[UACS ALERT - ${(message.urgency || 'medium').toUpperCase()}]\n${translatedText}\n- Government Authority\nReply STOP to opt out.`;

      console.log(`[UACS SMS] → ${recipient.phone} (lang: ${recipient.language}): "${translatedText.slice(0, 60)}..."`);
      return sendSMS(recipient.phone, formattedMessage);
    })
  );

  const report = { total: recipients.length, sent: 0, failed: 0, details: [] };

  results.forEach((result, index) => {
    const phone = recipients[index].phone;
    const masked = '****' + phone.slice(-4);
    if (result.status === 'fulfilled' && result.value.success) {
      report.sent++;
      report.details.push({ phone: masked, zone: recipients[index].zone, language: recipients[index].language, status: 'sent', messageId: result.value.messageId });
    } else {
      report.failed++;
      report.details.push({ phone: masked, status: 'failed', error: result.reason?.message || result.value?.error });
    }
  });

  return report;
}
