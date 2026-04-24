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
  'mr':      ['mr', 'marathi'],
  // reverse
  'english': ['en', 'english'],
  'hindi':   ['hi', 'hindi'],
  'urdu':    ['ur', 'urdu'],
  'tamil':   ['ta', 'tamil'],
  'bengali': ['bn', 'bengali'],
  'telugu':  ['te', 'telugu'],
  'marathi': ['mr', 'marathi'],
};

function normalizePhone(phone) {
  if (!phone) return null;
  let clean = phone.toString().replace(/\D/g, ''); // remove non-digits
  
  // If it's 10 digits, assume India (+91)
  if (clean.length === 10) {
    return `+91${clean}`;
  }
  
  // If it starts with 91 and has 12 digits, prepend +
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+${clean}`;
  }

  // Fallback: If it already starts with +, keep it. Else assume +91 if shorter than 12
  return phone.startsWith('+') ? phone : `+91${clean}`;
}

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
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!normalizedPhone) {
    console.error(`[UACS SMS] ❌ Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }

  const msgPayload = {
    body: messageBody,
    to:   normalizedPhone,
  };

  // Prefer Messaging Service SID
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

/**
 * Process a batch of SMS sends to avoid hammering the Twilio API
 */
async function processBatch(recipientsBatch, message, translations) {
  return await Promise.all(
    recipientsBatch.map(recipient => {
      const translatedText = pickTranslation(recipient.language, translations, message.master_content);
      const formattedMessage =
        message.urgency === 'critical'
          ? `🚨 EMERGENCY ALERT 🚨\n${translatedText}\n- Gov Alert`
          : `[UACS ALERT]\n${translatedText}\n- Gov Alert`;

      return sendSMS(recipient.phone, formattedMessage);
    })
  );
}

export async function sendBulkSMS(recipients, message) {
  // Parse translations if still a string
  let translations = message.translations || {};
  if (typeof translations === 'string') {
    try { translations = JSON.parse(translations); } catch { translations = {}; }
  }

  console.log(`[UACS SMS] Starting bulk send to ${recipients.length} recipients...`);

  const report = { total: recipients.length, sent: 0, failed: 0, details: [] };
  const BATCH_SIZE = 10; // Send 10 at a time
  
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await processBatch(batch, message, translations);

    results.forEach((result, idx) => {
      const recipient = batch[idx];
      const masked = '****' + recipient.phone.slice(-4);
      if (result.success) {
        report.sent++;
        report.details.push({ phone: masked, zone: recipient.zone, status: 'sent', messageId: result.messageId });
      } else {
        report.failed++;
        report.details.push({ phone: masked, status: 'failed', error: result.error });
      }
    });

    // Brief pause between batches if not the last one
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return report;
}
