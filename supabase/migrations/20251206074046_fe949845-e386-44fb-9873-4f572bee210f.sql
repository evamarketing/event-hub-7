-- Add customer info and serial number columns to billing_transactions
ALTER TABLE public.billing_transactions 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_mobile TEXT,
ADD COLUMN serial_number INTEGER;

-- Create a sequence for bill serial numbers
CREATE SEQUENCE IF NOT EXISTS bill_serial_seq START 1;

-- Create a function to auto-generate serial number
CREATE OR REPLACE FUNCTION public.set_bill_serial_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.serial_number = nextval('bill_serial_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-set serial number on insert
CREATE TRIGGER set_billing_serial
BEFORE INSERT ON public.billing_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_bill_serial_number();