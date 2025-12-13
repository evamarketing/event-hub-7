-- Create food_options table for admin to manage food choices
CREATE TABLE public.food_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_coupon_bookings table for storing bookings
CREATE TABLE public.food_coupon_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panchayath_id UUID NOT NULL REFERENCES public.panchayaths(id),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  food_option_id UUID NOT NULL REFERENCES public.food_options(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_coupon_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for food_options
CREATE POLICY "Allow public read food_options" ON public.food_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert food_options" ON public.food_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update food_options" ON public.food_options FOR UPDATE USING (true);
CREATE POLICY "Allow public delete food_options" ON public.food_options FOR DELETE USING (true);

-- RLS policies for food_coupon_bookings
CREATE POLICY "Allow public read food_coupon_bookings" ON public.food_coupon_bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert food_coupon_bookings" ON public.food_coupon_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update food_coupon_bookings" ON public.food_coupon_bookings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete food_coupon_bookings" ON public.food_coupon_bookings FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_food_options_updated_at
  BEFORE UPDATE ON public.food_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_coupon_bookings_updated_at
  BEFORE UPDATE ON public.food_coupon_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();