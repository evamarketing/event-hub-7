import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Send, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface EnquiryField {
  id: string;
  field_label: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
  show_conditional_on: string | null;
  conditional_value: string | null;
}

interface Panchayath {
  id: string;
  name: string;
}

interface Ward {
  id: string;
  ward_number: string;
  ward_name: string | null;
  panchayath_id: string;
}

interface Product {
  product_name: string;
  cost_price: string;
  selling_price: string;
  selling_unit: string;
}

// Product field IDs from database
const PRODUCT_FIELD_IDS = [
  '7467629e-6c4b-4f43-9652-cf5eb54322ab', // കൊണ്ടുവരാൻ ഉദ്ദേശിക്കുന്ന ഉൽപ്പന്നം
  '0654a8be-ecb4-4df3-8edf-13753b0e262f', // വിൽക്കുമ്പോൾ നിങ്ങൾക്ക് ലഭിക്കേണ്ട തുക (Cost Price)
  'bc136f0b-c9ed-471d-baf9-f06b2f991ff6', // ഉപഭോക്താവിന് വിൽക്കുന്ന വില (Selling Price / MRP)
  '3f6e4af5-5123-4788-b075-3ef363b7c613', // ഉൽപ്പന്നം വിൽക്കുന്നത്
];

export default function StallEnquiry() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedPanchayath, setSelectedPanchayath] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    { product_name: '', cost_price: '', selling_price: '', selling_unit: '' }
  ]);

  // Fetch form fields
  const { data: fields = [] } = useQuery({
    queryKey: ['stall-enquiry-fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stall_enquiry_fields')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as EnquiryField[];
    }
  });

  // Fetch panchayaths
  const { data: panchayaths = [] } = useQuery({
    queryKey: ['panchayaths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Panchayath[];
    }
  });

  // Fetch wards for selected panchayath
  const { data: wards = [] } = useQuery({
    queryKey: ['wards', selectedPanchayath],
    queryFn: async () => {
      if (!selectedPanchayath) return [];
      const { data, error } = await supabase
        .from('wards')
        .select('*')
        .eq('panchayath_id', selectedPanchayath)
        .order('ward_number');
      if (error) throw error;
      return data as Ward[];
    },
    enabled: !!selectedPanchayath
  });

  // Reset ward when panchayath changes
  useEffect(() => {
    setSelectedWard('');
  }, [selectedPanchayath]);

  // Filter out product fields from dynamic fields
  const nonProductFields = fields.filter(f => !PRODUCT_FIELD_IDS.includes(f.id));

  const addProduct = () => {
    setProducts([...products, { product_name: '', cost_price: '', selling_price: '', selling_unit: '' }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Check for duplicate mobile number
      const { data: existing, error: checkError } = await supabase
        .from('stall_enquiries')
        .select('id')
        .eq('mobile', mobile.trim())
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existing) {
        throw new Error('ഈ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് ഇതിനകം ഒരു അപേക്ഷ സമർപ്പിച്ചിട്ടുണ്ട്.');
      }

      // Combine responses with products data
      const allResponses: Record<string, unknown> = {
        ...responses,
        products: products.map(p => ({
          product_name: p.product_name,
          cost_price: p.cost_price,
          selling_price: p.selling_price,
          selling_unit: p.selling_unit
        }))
      };

      const { error } = await supabase
        .from('stall_enquiries')
        .insert([{
          name,
          mobile: mobile.trim(),
          panchayath_id: selectedPanchayath || null,
          ward_id: selectedWard || null,
          responses: allResponses as any
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({ title: 'അപേക്ഷ സമർപ്പിച്ചു!', description: 'നിങ്ങളുടെ അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleResponseChange = (fieldId: string, value: string) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const shouldShowField = (field: EnquiryField) => {
    if (!field.show_conditional_on) return true;
    return responses[field.show_conditional_on] === field.conditional_value;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: 'പേര് നൽകുക', variant: 'destructive' });
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      toast({ title: 'സാധുവായ മൊബൈൽ നമ്പർ നൽകുക', variant: 'destructive' });
      return;
    }
    if (!selectedPanchayath) {
      toast({ title: 'പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക', variant: 'destructive' });
      return;
    }
    if (!selectedWard) {
      toast({ title: 'വാർഡ് തിരഞ്ഞെടുക്കുക', variant: 'destructive' });
      return;
    }

    // Validate products
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.product_name.trim()) {
        toast({ title: `ഉൽപ്പന്നം ${i + 1}: ഉൽപ്പന്നത്തിന്റെ പേര് നൽകുക`, variant: 'destructive' });
        return;
      }
      if (!p.cost_price.trim()) {
        toast({ title: `ഉൽപ്പന്നം ${i + 1}: Cost Price നൽകുക`, variant: 'destructive' });
        return;
      }
      if (!p.selling_price.trim()) {
        toast({ title: `ഉൽപ്പന്നം ${i + 1}: Selling Price നൽകുക`, variant: 'destructive' });
        return;
      }
      if (!p.selling_unit) {
        toast({ title: `ഉൽപ്പന്നം ${i + 1}: വിൽക്കുന്ന രീതി തിരഞ്ഞെടുക്കുക`, variant: 'destructive' });
        return;
      }
    }

    // Check required fields (non-product fields)
    for (const field of nonProductFields) {
      if (field.is_required && shouldShowField(field) && !responses[field.id]) {
        toast({ title: `${field.field_label} നൽകുക`, variant: 'destructive' });
        return;
      }
    }

    submitMutation.mutate();
  };

  if (isSubmitted) {
    return (
      <PageLayout>
        <div className="container py-8 max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">അപേക്ഷ സമർപ്പിച്ചു!</h2>
              <p className="text-muted-foreground mb-6">
                നിങ്ങളുടെ സ്റ്റാൾ അന്വേഷണം വിജയകരമായി സമർപ്പിച്ചു. ഞങ്ങൾ ഉടൻ നിങ്ങളെ ബന്ധപ്പെടും.
              </p>
              <Button onClick={() => window.location.reload()}>
                പുതിയ അപേക്ഷ സമർപ്പിക്കുക
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              സ്റ്റാൾ അന്വേഷണ ഫോം
            </CardTitle>
            <CardDescription>
              സംരംഭക മേളയിൽ സ്റ്റാൾ അന്വേഷണത്തിനായി താഴെയുള്ള ഫോം പൂരിപ്പിക്കുക
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fixed fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">പേര് *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="നിങ്ങളുടെ പേര്"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mobile">മൊബൈൽ നമ്പർ *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="നിങ്ങളുടെ മൊബൈൽ നമ്പർ"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="panchayath">പഞ്ചായത്ത് *</Label>
                  <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                    <SelectTrigger>
                      <SelectValue placeholder="പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക" />
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

                <div>
                  <Label htmlFor="ward">വാർഡ് *</Label>
                  <Select value={selectedWard} onValueChange={setSelectedWard} disabled={!selectedPanchayath}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPanchayath ? "വാർഡ് തിരഞ്ഞെടുക്കുക" : "ആദ്യം പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക"} />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          വാർഡ് {w.ward_number} {w.ward_name ? `- ${w.ward_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product fields - repeatable section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">ഉൽപ്പന്ന വിവരങ്ങൾ</Label>
                </div>
                
                {products.map((product, index) => (
                  <Card key={index} className="p-4 bg-muted/30">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          ഉൽപ്പന്നം {index + 1}
                        </span>
                        {products.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label>കൊണ്ടുവരാൻ ഉദ്ദേശിക്കുന്ന ഉൽപ്പന്നം *</Label>
                        <Input
                          value={product.product_name}
                          onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                          placeholder="ഉൽപ്പന്നത്തിന്റെ പേര്"
                        />
                      </div>

                      <div>
                        <Label>വിൽക്കുമ്പോൾ നിങ്ങൾക്ക് ലഭിക്കേണ്ട തുക (Cost Price) *</Label>
                        <Input
                          type="number"
                          value={product.cost_price}
                          onChange={(e) => updateProduct(index, 'cost_price', e.target.value)}
                          placeholder="Cost Price"
                        />
                      </div>

                      <div>
                        <Label>ഉപഭോക്താവിന് വിൽക്കുന്ന വില (Selling Price / MRP) *</Label>
                        <Input
                          type="number"
                          value={product.selling_price}
                          onChange={(e) => updateProduct(index, 'selling_price', e.target.value)}
                          placeholder="Selling Price / MRP"
                        />
                      </div>

                      <div>
                        <Label>ഉൽപ്പന്നം വിൽക്കുന്നത് *</Label>
                        <RadioGroup
                          value={product.selling_unit}
                          onValueChange={(value) => updateProduct(index, 'selling_unit', value)}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="തൂക്കത്തിൽ" id={`unit-weight-${index}`} />
                            <Label htmlFor={`unit-weight-${index}`} className="font-normal cursor-pointer">
                              തൂക്കത്തിൽ
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="എണ്ണത്തിൽ" id={`unit-count-${index}`} />
                            <Label htmlFor={`unit-count-${index}`} className="font-normal cursor-pointer">
                              എണ്ണത്തിൽ
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addProduct}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  പുതിയ ഉൽപ്പന്നം ചേർക്കുക
                </Button>
              </div>

              {/* Dynamic fields from database (excluding product fields) */}
              <div className="space-y-4 pt-4 border-t">
                {nonProductFields.map((field) => {
                  if (!shouldShowField(field)) return null;

                  return (
                    <div key={field.id}>
                      <Label>
                        {field.field_label} {field.is_required && '*'}
                      </Label>
                      
                      {field.field_type === 'text' && (
                        <Input
                          value={responses[field.id] || ''}
                          onChange={(e) => handleResponseChange(field.id, e.target.value)}
                          placeholder={field.field_label}
                        />
                      )}

                      {field.field_type === 'textarea' && (
                        <Textarea
                          value={responses[field.id] || ''}
                          onChange={(e) => handleResponseChange(field.id, e.target.value)}
                          placeholder={field.field_label}
                        />
                      )}

                      {field.field_type === 'radio' && field.options && (
                        <RadioGroup
                          value={responses[field.id] || ''}
                          onValueChange={(value) => handleResponseChange(field.id, value)}
                          className="mt-2"
                        >
                          {(field.options as string[]).map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                              <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {field.field_type === 'select' && field.options && (
                        <Select
                          value={responses[field.id] || ''}
                          onValueChange={(value) => handleResponseChange(field.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="തിരഞ്ഞെടുക്കുക" />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options as string[]).map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {submitMutation.isPending ? 'സമർപ്പിക്കുന്നു...' : 'സമർപ്പിക്കുക'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
