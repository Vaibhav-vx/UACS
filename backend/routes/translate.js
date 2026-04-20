// ═══════════════════════════════════════
// UACS Translation Routes
// ═══════════════════════════════════════

import { Router } from 'express';
import { translateText } from '../integrations/translateApi.js';

const router = Router();

// UACS language key → ISO code
const LANGUAGE_MAP = {
  en:      'en',
  english: 'en',
  hindi:   'hi',
  urdu:    'ur',
  tamil:   'ta',
  bengali: 'bn',
  telugu:  'te',
  hi: 'hi', ur: 'ur', ta: 'ta', bn: 'bn', te: 'te',
};

// ─── POST /api/translate ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { text, languages } = req.body;

    if (!text?.trim())
      return res.status(400).json({ error: 'text is required' });

    if (!Array.isArray(languages) || languages.length === 0)
      return res.status(400).json({ error: 'languages array is required' });

    console.log(`[UACS TRANSLATE] Translating to: ${languages.join(', ')}`);
    const startTime = Date.now();

    const translationPromises = languages.map(async (lang) => {
      const langCode = LANGUAGE_MAP[lang.toLowerCase()] || lang;

      // English — return master content as-is
      if (langCode === 'en') {
        return { language: lang, text, code: langCode, duration: 0, error: null };
      }

      const langStart = Date.now();
      try {
        const translated = await translateText(text, 'en', langCode);
        const duration = Date.now() - langStart;
        console.log(`[UACS TRANSLATE] ✅ ${lang} (${langCode}): "${translated.slice(0, 50)}..." (${duration}ms)`);
        return { language: lang, text: translated, code: langCode, duration, error: null };
      } catch (err) {
        const duration = Date.now() - langStart;
        console.error(`[UACS TRANSLATE] ❌ ${lang} FAILED: ${err.message}`);
        return { language: lang, text, code: langCode, duration, error: err.message }; // fallback: original
      }
    });

    const results = await Promise.all(translationPromises);
    const totalDuration = Date.now() - startTime;

    const translations = {};
    const errors = {};
    results.forEach(r => {
      translations[r.language] = r.text;
      if (r.error) errors[r.language] = r.error;
    });

    console.log(`[UACS TRANSLATE] Done in ${totalDuration}ms`);
    res.json({ translations, errors: Object.keys(errors).length > 0 ? errors : null, totalDuration, results });
  } catch (err) {
    console.error('[UACS TRANSLATE] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
