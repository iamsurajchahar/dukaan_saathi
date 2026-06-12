import { Request, Response, NextFunction } from 'express';
import { assistantService } from '../services/assistant.service';

export const assistantController = {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      const result = await assistantService.chat(
        req.storeId!,
        message.trim(),
        history
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
