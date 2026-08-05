/**
 * SMS Controller
 * Purpose: HTTP request handlers for SMS queue endpoints.
 * Validates input, delegates to service layer, formats responses.
 */

import { Request, Response, NextFunction } from 'express';
import { SmsService } from '../services/smsService';
import { logger } from '../utils/logger';

export class SmsController {
  private readonly service: SmsService;

  constructor(service: SmsService = new SmsService()) {
    this.service = service;
  }

  /**
   * GET /messages
   * Returns pending messages by default, or all messages if query param provided
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      const messages = await this.service.getAllMessages(status as any);

      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /messages/pending
   * Returns only pending messages (FIFO order)
   */
  getPendingMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages = await this.service.getPendingMessages();

      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /messages/:id/sent
   * Updates message status to SENT
   */
  markAsSent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { deviceId } = req.body;

      const message = await this.service.markMessageAsSent(id, deviceId);

      res.status(200).json({
        success: true,
        message: 'Message marked as sent successfully',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /messages/:id/failed
   * Updates message status to FAILED
   */
  markAsFailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { errorMessage, deviceId } = req.body;

      if (!errorMessage) {
        res.status(400).json({
          success: false,
          message: 'errorMessage is required',
        });
        return;
      }

      const message = await this.service.markMessageAsFailed(id, errorMessage, deviceId);

      res.status(200).json({
        success: true,
        message: 'Message marked as failed',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /messages/retry
   * Reset failed messages back to pending for retry
   */
  retryFailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.service.retryFailedMessages();

      res.status(200).json({
        success: true,
        message: `${count} failed messages queued for retry`,
        count,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /messages/count
   * Returns count of pending messages
   */
  getPendingCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.service.getPendingCount();

      res.status(200).json({
        success: true,
        data: { pendingCount: count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /messages
   * Create a new SMS message
   */
  createMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phoneNumber, message } = req.body;

      const newMessage = await this.service.createMessage(phoneNumber, message);

      res.status(201).json({
        success: true,
        message: 'SMS message created successfully',
        data: newMessage,
      });
    } catch (error) {
      next(error);
    }
  };
}
