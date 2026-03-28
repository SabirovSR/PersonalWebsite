-- Run once on existing PostgreSQL databases after deploying new code.
-- Fresh installs get columns from SQLAlchemy create_all.

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS form_source VARCHAR(32);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tariff VARCHAR(32);
