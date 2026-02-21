import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth.js';
import { generateSpeech } from '../../services/tts/ttsService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// All TTS routes require authentication
router.use(authenticateToken);

// POST / - Generate speech from text
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    // Rate limit: max text length 1000 characters
    if (text.length > 1000) {
      res.status(400).json({
        error: 'Text exceeds maximum length of 1000 characters',
      });
      return;
    }

    logger.info('TTS request received', {
      metadata: {
        userId: req.user?.id,
        textLength: text.length,
      },
    });

    const audioBuffer = await generateSpeech(text);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'no-cache',
    });

    res.send(audioBuffer);
  } catch (error) {
    logger.error('TTS generation failed', error as Error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

export default router;
