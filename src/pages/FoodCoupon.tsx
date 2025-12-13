import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Utensils, Minus, Plus, Loader2 } from "lucide-react";

interface FoodOption {
  id: string;
  name: string;
  price: number;
}

interface Panchayath {
  id: string;
  name: string;
}

export default function FoodCoupon() {
  const queryClient = useQueryClient();
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedFoodOption, setSelectedFoodOption] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: panchayaths = [], isLoading: panchayathsLoading } = useQuery({
    queryKey: ["panchayaths"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("panchayaths")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Panchayath[];
    },
  });

  const { data: foodOptions = [], isLoading: foodOptionsLoading } = useQuery({
    queryKey: ["food-options-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_options")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FoodOption[];
    },
  });

  const selectedFood = foodOptions.find((f) => f.id === selectedFoodOption);
  const totalAmount = selectedFood ? selectedFood.price * quantity : 0;

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("food_coupon_bookings").insert({
        panchayath_id: selectedPanchayath,
        name: name.trim(),
        mobile: mobile.trim(),
        food_option_id: selectedFoodOption,
        quantity,
        total_amount: totalAmount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ബുക്കിംഗ് വിജയകരമായി!", {
        description: "നിങ്ങളുടെ ഫുഡ് കൂപ്പൺ ബുക്ക് ചെയ്തു.",
      });
      setSelectedPanchayath("");
      setName("");
      setMobile("");
      setSelectedFoodOption("");
      setQuantity(1);
      queryClient.invalidateQueries({ queryKey: ["food-coupon-bookings"] });
    },
    onError: (error: Error) => {
      toast.error("ബുക്കിംഗ് പരാജയപ്പെട്ടു", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPanchayath || !name.trim() || !mobile.trim() || !selectedFoodOption) {
      toast.error("എല്ലാ ഫീൽഡുകളും പൂരിപ്പിക്കുക");
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      toast.error("സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക");
      return;
    }
    bookingMutation.mutate();
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  return (
    <PageLayout>
      <section className="container py-8 md:py-12">
        <div className="mx-auto max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Utensils className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">ഫുഡ് കൂപ്പൺ ബുക്കിംഗ്</h1>
            <p className="mt-2 text-muted-foreground">ഉച്ചഭക്ഷണത്തിന് മുൻകൂട്ടി ബുക്ക് ചെയ്യുക</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ബുക്കിംഗ് ഫോം</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Panchayath Selection */}
                <div className="space-y-2">
                  <Label>പഞ്ചായത്ത് *</Label>
                  <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                    <SelectTrigger>
                      <SelectValue placeholder={panchayathsLoading ? "ലോഡ് ചെയ്യുന്നു..." : "പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക"} />
                    </SelectTrigger>
                    <SelectContent>
                      {panchayaths.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>പേര് *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="നിങ്ങളുടെ പേര്"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <Label>മൊബൈൽ നമ്പർ *</Label>
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
                    maxLength={10}
                  />
                </div>

                {/* Food Option Selection */}
                <div className="space-y-2">
                  <Label>ഫുഡ് ഓപ്ഷൻ *</Label>
                  <Select value={selectedFoodOption} onValueChange={setSelectedFoodOption}>
                    <SelectTrigger>
                      <SelectValue placeholder={foodOptionsLoading ? "ലോഡ് ചെയ്യുന്നു..." : "ഫുഡ് തിരഞ്ഞെടുക്കുക"} />
                    </SelectTrigger>
                    <SelectContent>
                      {foodOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name} - ₹{option.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label>എണ്ണം</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <Button type="button" variant="outline" size="icon" onClick={incrementQuantity}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Total */}
                {selectedFood && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">ആകെ തുക:</span>
                      <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={bookingMutation.isPending}>
                  {bookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ബുക്ക് ചെയ്യുക
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
}