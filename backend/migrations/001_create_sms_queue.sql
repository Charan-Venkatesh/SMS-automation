-- SMS Queue Table Migration
-- Created: 2024-01-01
-- Purpose: Stores SMS messages to be sent via Android device

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS sms_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    device_id VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_created_at ON sms_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_queue_pending ON sms_queue(status, created_at) WHERE status = 'PENDING';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_queue_updated_at
    BEFORE UPDATE ON sms_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO sms_queue (phone_number, message, status)
VALUES 
    ('+911234567890', 'Hello! This is a test message from SMS Automation System.', 'PENDING'),
    ('+911234567891', 'Your order #12345 has been shipped successfully.', 'PENDING'),
    ('+911234567892', 'Reminder: Your appointment is scheduled for tomorrow at 10:00 AM.', 'PENDING')
ON CONFLICT DO NOTHING;
