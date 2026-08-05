/**
 * SMS Routes
 * Purpose: Defines all API endpoints for SMS queue operations.
 * Maps HTTP methods to controller actions with validation middleware.
 */

import { Router } from 'express';
import { SmsController } from '../controllers/smsController';
import { validateRequest, createMessageSchema, updateStatusSchema } from '../middleware/validateRequest';

const router = Router();
const controller = new SmsController();

// GET /messages - Get all messages (optionally filtered by status)
router.get('/', controller.getMessages);

// GET /messages/pending - Get only pending messages
router.get('/pending', controller.getPendingMessages);

// GET /messages/count - Get pending message count
router.get('/count', controller.getPendingCount);

// POST /messages - Create new message
router.post('/', validateRequest(createMessageSchema), controller.createMessage);

// POST /messages/:id/sent - Mark message as sent
router.post('/:id/sent', validateRequest(updateStatusSchema), controller.markAsSent);

// POST /messages/:id/failed - Mark message as failed
router.post('/:id/failed', validateRequest(updateStatusSchema), controller.markAsFailed);

// POST /messages/retry - Retry failed messages
router.post('/retry', controller.retryFailed);

export default router;
