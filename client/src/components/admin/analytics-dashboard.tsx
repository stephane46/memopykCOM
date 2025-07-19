import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Users, 
  Play, 
  Clock, 
  Globe, 
  Languages, 
  Download, 
  RefreshCw, 
  Trash2,
  Calendar,
  Eye,
  TrendingUp,
  Settings
} from 'lucide-react';

interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalWatchTime: number;
  averageSessionDuration: number;
  topCountries: { country: string; views: number; }[];
  languageBreakdown: { language: string; views: number; }[];
  videoPerformance: { videoId: string; title: string; views: number; completionRate: number; }[];
}

interface AnalyticsSettings {
  excludedIps: string[];
  completionThreshold: number;
  trackingEnabled: boolean;
  dataRetentionDays: number;
  lastResetDate?: string;
}

export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [resetType, setResetType] = useState<'all' | 'views' | 'sessions'>('views');

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      return apiRequest(`/api/analytics/dashboard?${params.toString()}`);
    }
  });

  // Fetch detailed views
  const { data: detailedViews, isLoading: isViewsLoading } = useQuery({
    queryKey: ['/api/analytics/views', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      return apiRequest(`/api/analytics/views?${params.toString()}`);
    }
  });

  // Fetch sessions
  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/analytics/sessions', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('excludeAdmin', 'true');
      return apiRequest(`/api/analytics/sessions?${params.toString()}`);
    }
  });

  // Reset analytics mutation
  const resetAnalyticsMutation = useMutation({
    mutationFn: async (type: 'all' | 'views' | 'sessions') => {
      return apiRequest('/api/analytics/reset', {
        method: 'POST',
        body: JSON.stringify({ resetType: type })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Analytics Reset",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset analytics data",
        variant: "destructive",
      });
    }
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async (format: 'json' | 'csv') => {
      const params = new URLSearchParams();
      params.append('format', format);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/analytics/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('memopyk_admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Analytics data has been downloaded",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  });

  const summary: AnalyticsSummary = dashboardData?.summary || {
    totalViews: 0,
    uniqueVisitors: 0,
    totalWatchTime: 0,
    averageSessionDuration: 0,
    topCountries: [],
    languageBreakdown: [],
    videoPerformance: []
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Analytics</h2>
          <p className="text-gray-600">Track video engagement and visitor behavior</p>
        </div>
        <div className="flex items-center space-x-2">
          <RefreshCw 
            className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/analytics'] })}
          />
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Video Performance</TabsTrigger>
          <TabsTrigger value="sessions">Visitor Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.uniqueVisitors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Watch Time</p>
                    <p className="text-2xl font-bold text-gray-900">{formatTime(summary.totalWatchTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Session</p>
                    <p className="text-2xl font-bold text-gray-900">{formatTime(summary.averageSessionDuration)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Geographic and Language Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Top Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.topCountries.length > 0 ? (
                    summary.topCountries.map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{country.country}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{country.views}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No country data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Languages className="mr-2 h-5 w-5" />
                  Language Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.languageBreakdown.length > 0 ? (
                    summary.languageBreakdown.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {lang.language === 'fr-FR' ? 'French' : 'English'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{lang.views}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No language data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Video Performance Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="mr-2 h-5 w-5" />
                Video Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.videoPerformance.length > 0 ? (
                <div className="space-y-4">
                  {summary.videoPerformance.map((video, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{video.title}</h4>
                        <p className="text-sm text-gray-600">ID: {video.videoId}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{video.views}</p>
                          <p className="text-xs text-gray-600">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{video.completionRate.toFixed(1)}%</p>
                          <p className="text-xs text-gray-600">Completion</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No video performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Visitor Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSessionsLoading ? (
                <p>Loading sessions...</p>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sessions.slice(0, 50).map((session: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">{session.country || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{session.language}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{new Date(session.createdAt).toLocaleDateString()}</p>
                        <Badge variant={session.isUniqueVisitor ? "default" : "secondary"}>
                          {session.isUniqueVisitor ? "New" : "Return"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {sessions.length > 50 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      Showing first 50 of {sessions.length} sessions
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No session data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Export Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export analytics data for the selected date range
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => exportDataMutation.mutate('json')}
                    disabled={exportDataMutation.isPending}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportDataMutation.mutate('csv')}
                    disabled={exportDataMutation.isPending}
                  >
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reset Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Reset Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Permanently delete analytics data. This action cannot be undone.
                </p>
                <div className="space-y-3">
                  <Select value={resetType} onValueChange={(value: any) => setResetType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="views">Video Views Only</SelectItem>
                      <SelectItem value="sessions">Sessions Only</SelectItem>
                      <SelectItem value="all">All Analytics Data</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    onClick={() => resetAnalyticsMutation.mutate(resetType)}
                    disabled={resetAnalyticsMutation.isPending}
                  >
                    {resetAnalyticsMutation.isPending ? 'Resetting...' : 'Reset Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}