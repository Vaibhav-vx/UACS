import { Router } from 'express';
import { dbGetOne, dbSelect, dbUpdate, dbInsert } from '../database/db.js';

const router = Router();

// ─── POST /api/webhooks/twilio ──────────────────────────
// Handles incoming SMS from citizens (e.g., "SAFE" or "HELP")
router.post('/twilio', async (req, res) => {
  try {
    const { From, Body } = req.body;
    if (!From || !Body) return res.status(400).send('Missing data');

    console.log(`[UACS WEBHOOK] Incoming SMS from ${From}: ${Body}`);

    // 1. Find user by phone number
    const phone = From.replace('+91', '');
    const user = await dbGetOne('users', { email: phone });
    
    if (!user) {
      console.log(`[UACS WEBHOOK] No user found for phone ${phone}`);
      return res.status(200).send('<Response></Response>'); // Silent ignore or generic reply
    }

    const command = Body.trim().toUpperCase();
    let status = null;
    
    if (command.includes('SAFE')) {
      status = 'safe';
    } else if (command.includes('HELP')) {
      status = 'assistance';
    }

    if (status) {
      // 2. Find the latest active message for this zone (or general)
      const activeMessages = await dbSelect('messages', { status: 'active' }, { orderBy: 'created_at', ascending: false, limit: 10 });
      const targetMsg = activeMessages.find(m => m.target_zone === 'General' || m.target_zone === user.zone) || activeMessages[0];

      if (targetMsg) {
        // 3. Record the safety report
        await dbInsert('safety_reports', {
          message_id: targetMsg.id,
          user_id: user.id,
          user_name: user.name,
          zone: user.zone || 'Unknown',
          status: status,
          assisted: false
        });

        console.log(`[UACS WEBHOOK] Recorded ${status} for ${user.name} via SMS`);

        // 4. Send confirmation reply
        const reply = status === 'safe' 
          ? `UACS: Your safety status recorded ✅ Stay safe. Follow official guidance.`
          : `UACS: SOS recorded 🆘 Help is being coordinated. Stay where you are. Help is coming.`;
        
        return res.status(200).send(`
          <Response>
            <Message>${reply}</Message>
          </Response>
        `);
      }
    }

    // Default reply for unknown commands
    res.status(200).send(`
      <Response>
        <Message>UACS: Command not recognized. Reply SAFE if you are safe, or HELP if you need assistance.</Message>
      </Response>
    `);
  } catch (err) {
    console.error('[UACS WEBHOOK] Error:', err.message);
    res.status(200).send('<Response></Response>');
  }
});

export default router;
