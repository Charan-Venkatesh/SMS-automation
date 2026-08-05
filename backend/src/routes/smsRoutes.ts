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

/**
 * @openapi
 * /messages:
 *   get:
 *     summary: List all messages (optionally filtered by status)
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, FAILED]
 *     responses:
 *       200:
 *         description: List of messages
 *   post:
 *     summary: Create a new queued SMS message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, message]
 *             properties:
 *               phoneNumber: { type: string, example: "+911234567890" }
 *               message: { type: string, example: "Hello!" }
 *     responses:
 *       201:
 *         description: Message created
 */
router.get('/', controller.getMessages);
router.post('/', validateRequest(createMessageSchema), controller.createMessage);

/**
 * @openapi
 * /messages/pending:
 *   get:
 *     summary: List pending messages (FIFO order) — what the Android app fetches to send
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Pending messages
 */
router.get('/pending', controller.getPendingMessages);

/**
 * @openapi
 * /messages/count:
 *   get:
 *     summary: Get the count of pending messages
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Pending message count
 */
router.get('/count', controller.getPendingCount);

/**
 * @openapi
 * /messages/{id}/sent:
 *   post:
 *     summary: Mark a message as SENT
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId: { type: string }
 *     responses:
 *       200:
 *         description: Message marked as sent
 */
router.post('/:id/sent', validateRequest(updateStatusSchema), controller.markAsSent);

/**
 * @openapi
 * /messages/{id}/failed:
 *   post:
 *     summary: Mark a message as FAILED
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [errorMessage]
 *             properties:
 *               errorMessage: { type: string }
 *               deviceId: { type: string }
 *     responses:
 *       200:
 *         description: Message marked as failed
 */
router.post('/:id/failed', validateRequest(updateStatusSchema), controller.markAsFailed);

/**
 * @openapi
 * /messages/retry:
 *   post:
 *     summary: Reset FAILED messages (retryCount < 3) back to PENDING
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Number of messages requeued
 */
router.post('/retry', controller.retryFailed);

export default router;
