-- Migration: Add library_loan and unit_registration support to uams_academic_records
-- Author: Antigravity Pairing
-- Date: 2026-10-26

ALTER TABLE public.uams_academic_records
  DROP CONSTRAINT IF EXISTS uams_academic_records_kind_check,
  DROP CONSTRAINT IF EXISTS uams_academic_records_check;

ALTER TABLE public.uams_academic_records
  ADD CONSTRAINT uams_academic_records_kind_check 
    CHECK (kind IN ('grade', 'event', 'date', 'fee_statement', 'payment_record', 'exam_schedule', 'exam_clearance', 'library_loan', 'unit_registration')),
  ADD CONSTRAINT uams_academic_records_check 
    CHECK ((kind IN ('grade', 'fee_statement', 'payment_record', 'exam_schedule', 'exam_clearance', 'library_loan', 'unit_registration')) = (student_id IS NOT NULL));
