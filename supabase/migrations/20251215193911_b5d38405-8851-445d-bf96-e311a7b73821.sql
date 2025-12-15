-- Add counter_number column to stalls table
ALTER TABLE public.stalls ADD COLUMN counter_number text;

-- Create unique index on counter_number to prevent duplicates (only for non-null values)
CREATE UNIQUE INDEX idx_stalls_counter_number ON public.stalls (counter_number) WHERE counter_number IS NOT NULL AND counter_number != '';