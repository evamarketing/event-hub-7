import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, CheckCircle, XCircle, Eye } from 'lucide-react';

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

interface ShareCount {
  ward_id: string;
  count: number;
  views: number;
}

export function SurveyResults() {
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>('');

  const { data: panchayaths } = useQuery({
    queryKey: ['panchayaths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Panchayath[];
    },
  });

  const { data: wards } = useQuery({
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
    enabled: !!selectedPanchayath,
  });

  const { data: shareCounts } = useQuery({
    queryKey: ['survey-shares', selectedPanchayath],
    queryFn: async () => {
      if (!selectedPanchayath) return [];
      const { data, error } = await supabase
        .from('survey_shares')
        .select('ward_id, view_count')
        .eq('panchayath_id', selectedPanchayath);
      if (error) throw error;
      
      // Count shares and views per ward
      const counts: Record<string, { count: number; views: number }> = {};
      data?.forEach((share) => {
        if (!counts[share.ward_id]) {
          counts[share.ward_id] = { count: 0, views: 0 };
        }
        counts[share.ward_id].count += 1;
        counts[share.ward_id].views += share.view_count || 0;
      });
      
      return Object.entries(counts).map(([ward_id, { count, views }]) => ({ ward_id, count, views })) as ShareCount[];
    },
    enabled: !!selectedPanchayath,
  });

  const getShareData = (wardId: string) => {
    const data = shareCounts?.find(sc => sc.ward_id === wardId);
    return { count: data?.count || 0, views: data?.views || 0 };
  };

  const totalShares = shareCounts?.reduce((acc, sc) => acc + sc.count, 0) || 0;
  const totalViews = shareCounts?.reduce((acc, sc) => acc + sc.views, 0) || 0;
  const wardsWithShares = shareCounts?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Survey Results
        </CardTitle>
        <CardDescription>View panchayath-wise sharing statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a panchayath" />
            </SelectTrigger>
            <SelectContent>
              {panchayaths?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPanchayath && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{totalShares}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Shares</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{totalViews}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">{wardsWithShares}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Wards with Shares</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-2xl font-bold">{(wards?.length || 0) - wardsWithShares}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Wards without Shares</p>
                </CardContent>
              </Card>
            </div>

            {/* Ward Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wards?.map((ward) => {
                const { count: shareCount, views: viewCount } = getShareData(ward.id);
                const hasShares = shareCount > 0;
                
                return (
                  <Card
                    key={ward.id}
                    className={`transition-all ${
                      hasShares 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-destructive bg-destructive/10'
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Ward {ward.ward_number}</p>
                          {ward.ward_name && (
                            <p className="text-xs text-muted-foreground">{ward.ward_name}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={hasShares ? 'default' : 'destructive'}
                            className={hasShares ? 'bg-green-500' : ''}
                          >
                            {shareCount} shares
                          </Badge>
                          {hasShares && (
                            <Badge variant="outline" className="text-blue-600 border-blue-500">
                              <Eye className="h-3 w-3 mr-1" />
                              {viewCount} views
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {hasShares ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-xs ${hasShares ? 'text-green-600' : 'text-destructive'}`}>
                          {hasShares ? 'Shared' : 'Not Shared'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {(!wards || wards.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No wards found for this panchayath. Add wards first.
              </div>
            )}
          </>
        )}

        {!selectedPanchayath && (
          <div className="text-center py-8 text-muted-foreground">
            Select a panchayath to view survey results.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
