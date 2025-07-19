import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Clock, GitBranch, Rocket, Shield } from "lucide-react";

interface DeploymentLog {
  message: string;
  status: 'info' | 'success' | 'error';
  timestamp: string;
}

export function DeploymentButtons() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [stagingLogs, setStagingLogs] = useState<DeploymentLog[]>([]);
  const [productionLogs, setProductionLogs] = useState<DeploymentLog[]>([]);
  const stagingScrollRef = useRef<HTMLDivElement>(null);
  const productionScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (stagingScrollRef.current) {
      stagingScrollRef.current.scrollTop = stagingScrollRef.current.scrollHeight;
    }
  }, [stagingLogs]);

  useEffect(() => {
    if (productionScrollRef.current) {
      productionScrollRef.current.scrollTop = productionScrollRef.current.scrollHeight;
    }
  }, [productionLogs]);

  const stagingMutation = useMutation({
    mutationFn: async () => {
      setStagingLogs([]);
      const token = localStorage.getItem('memopyk-admin-token');
      const response = await fetch('/api/deploy/staging', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Staging deployment failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const logEntry: DeploymentLog = JSON.parse(line);
              setStagingLogs(prev => [...prev, logEntry]);
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    },
    onSuccess: () => {
      toast({
        title: t("Staging deployment complete", { fr: "Déploiement staging terminé", en: "Staging deployment complete" }),
        description: t("Check the logs for details", { fr: "Vérifiez les logs pour plus de détails", en: "Check the logs for details" }),
      });
    },
    onError: (error) => {
      toast({
        title: t("Staging deployment failed", { fr: "Échec du déploiement staging", en: "Staging deployment failed" }),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const productionMutation = useMutation({
    mutationFn: async () => {
      setProductionLogs([]);
      const token = localStorage.getItem('memopyk-admin-token');
      const response = await fetch('/api/deploy/production', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Production deployment failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const logEntry: DeploymentLog = JSON.parse(line);
              setProductionLogs(prev => [...prev, logEntry]);
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    },
    onSuccess: () => {
      toast({
        title: t("Production deployment complete", { fr: "Déploiement production terminé", en: "Production deployment complete" }),
        description: t("Check the logs for details", { fr: "Vérifiez les logs pour plus de détails", en: "Check the logs for details" }),
      });
    },
    onError: (error) => {
      toast({
        title: t("Production deployment failed", { fr: "Échec du déploiement production", en: "Production deployment failed" }),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">
          {t("Success", { fr: "Succès", en: "Success" })}
        </Badge>;
      case 'error':
        return <Badge variant="destructive">
          {t("Error", { fr: "Erreur", en: "Error" })}
        </Badge>;
      default:
        return <Badge variant="secondary">
          {t("Info", { fr: "Info", en: "Info" })}
        </Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-memopyk-navy to-memopyk-blue text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-8 h-8 text-memopyk-highlight" />
          <h1 className="font-playfair text-3xl font-bold">
            {t("One-Click Deployment", { fr: "Déploiement en un clic", en: "One-Click Deployment" })}
          </h1>
        </div>
        <p className="text-memopyk-cream text-lg">
          {t("Deploy your MEMOPYK platform with enterprise-grade safety", { fr: "Déployez votre plateforme MEMOPYK avec une sécurité de niveau entreprise", en: "Deploy your MEMOPYK platform with enterprise-grade safety" })}
        </p>
      </div>

      {/* Safety Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Shield className="w-5 h-5" />
            {t("Safety Net Active", { fr: "Filet de sécurité actif", en: "Safety Net Active" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <GitBranch className="w-4 h-4" />
              <span>
                {t("Backup", { fr: "Sauvegarde", en: "Backup" })}: <code className="bg-green-200 px-2 py-1 rounded">before-staging-deploy</code>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>{t("Auto-rollback enabled", { fr: "Rollback automatique activé", en: "Auto-rollback enabled" })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Environments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staging Environment */}
        <Card className="border-blue-200 hover:border-blue-300 transition-colors">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">
                  {t("Staging Environment", { fr: "Environnement de Test", en: "Staging Environment" })}
                </h3>
                <p className="text-sm text-blue-600 font-normal">
                  {t("Test your changes safely", { fr: "Testez vos modifications en sécurité", en: "Test your changes safely" })}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                {t("What happens:", { fr: "Ce qui se passe :", en: "What happens:" })}
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {t("Pull latest code", { fr: "Récupérer le dernier code", en: "Pull latest code" })}</li>
                <li>• {t("Restart staging container", { fr: "Redémarrer le conteneur de test", en: "Restart staging container" })}</li>
                <li>• {t("Run health checks", { fr: "Exécuter les vérifications", en: "Run health checks" })}</li>
                <li>• {t("Auto-rollback on failure", { fr: "Rollback automatique en cas d'échec", en: "Auto-rollback on failure" })}</li>
              </ul>
            </div>
            <Button
              onClick={() => stagingMutation.mutate()}
              disabled={stagingMutation.isPending}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              size="lg"
            >
              {stagingMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {t("Deploying...", { fr: "Déploiement...", en: "Deploying..." })}
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  {t("Deploy to Staging", { fr: "Déployer en Test", en: "Deploy to Staging" })}
                </>
              )}
            </Button>
            
            {stagingLogs.length > 0 && (
              <>
                <Separator />
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t("Deployment Logs", { fr: "Logs de déploiement", en: "Deployment Logs" })}
                  </h4>
                  <ScrollArea ref={stagingScrollRef} className="h-64 w-full border rounded bg-black text-green-400 p-4 font-mono text-sm">
                    <div className="space-y-1">
                      {stagingLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-gray-500 text-xs min-w-[80px]">
                            {new Date(log.timestamp).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                          <span className={`${
                            log.status === 'success' ? 'text-green-400' :
                            log.status === 'error' ? 'text-red-400' : 
                            'text-blue-400'
                          }`}>
                            {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '🔄'}
                          </span>
                          <span className="flex-1 break-words">{log.message}</span>
                        </div>
                      ))}
                      {stagingMutation.isPending && (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <span className="text-gray-500 text-xs min-w-[80px]">
                            {new Date().toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                          <span className="animate-pulse">⏳</span>
                          <span className="animate-pulse">
                            {t("Deployment in progress...", { fr: "Déploiement en cours...", en: "Deployment in progress..." })}
                          </span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Production Environment */}
        <Card className="border-red-200 hover:border-red-300 transition-colors">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900">
                  {t("Production Environment", { fr: "Environnement de Production", en: "Production Environment" })}
                </h3>
                <p className="text-sm text-red-600 font-normal">
                  {t("Deploy to live website", { fr: "Déployer sur le site en direct", en: "Deploy to live website" })}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">
                {t("What happens:", { fr: "Ce qui se passe :", en: "What happens:" })}
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• {t("Pull latest code", { fr: "Récupérer le dernier code", en: "Pull latest code" })}</li>
                <li>• {t("Restart production container", { fr: "Redémarrer le conteneur de production", en: "Restart production container" })}</li>
                <li>• {t("Verify new.memopyk.com access", { fr: "Vérifier l'accès new.memopyk.com", en: "Verify new.memopyk.com access" })}</li>
                <li>• {t("Auto-rollback on failure", { fr: "Rollback automatique en cas d'échec", en: "Auto-rollback on failure" })}</li>
              </ul>
            </div>
            <Button
              onClick={() => productionMutation.mutate()}
              disabled={productionMutation.isPending}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
              size="lg"
            >
              {productionMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {t("Deploying...", { fr: "Déploiement...", en: "Deploying..." })}
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  {t("Deploy to Production", { fr: "Déployer en Production", en: "Deploy to Production" })}
                </>
              )}
            </Button>
            
            {productionLogs.length > 0 && (
              <>
                <Separator />
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t("Deployment Logs", { fr: "Logs de déploiement", en: "Deployment Logs" })}
                  </h4>
                  <ScrollArea ref={productionScrollRef} className="h-64 w-full border rounded bg-black text-green-400 p-4 font-mono text-sm">
                    <div className="space-y-1">
                      {productionLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-gray-500 text-xs min-w-[80px]">
                            {new Date(log.timestamp).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                          <span className={`${
                            log.status === 'success' ? 'text-green-400' :
                            log.status === 'error' ? 'text-red-400' : 
                            'text-blue-400'
                          }`}>
                            {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '🔄'}
                          </span>
                          <span className="flex-1 break-words">{log.message}</span>
                        </div>
                      ))}
                      {productionMutation.isPending && (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <span className="text-gray-500 text-xs min-w-[80px]">
                            {new Date().toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                          <span className="animate-pulse">⏳</span>
                          <span className="animate-pulse">
                            {t("Deployment in progress...", { fr: "Déploiement en cours...", en: "Deployment in progress..." })}
                          </span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technical Information */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-memopyk-navy" />
            {t("Technical Information", { fr: "Informations techniques", en: "Technical Information" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-memopyk-navy mb-3">
                {t("Deployment Steps", { fr: "Étapes de déploiement", en: "Deployment Steps" })}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span>{t("Pull latest code from GitHub", { fr: "Récupérer le code depuis GitHub", en: "Pull latest code from GitHub" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span>{t("Restart Docker container", { fr: "Redémarrer le conteneur Docker", en: "Restart Docker container" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span>{t("Verify health endpoints", { fr: "Vérifier les endpoints de santé", en: "Verify health endpoints" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                  <span>{t("Auto-rollback if needed", { fr: "Rollback automatique si nécessaire", en: "Auto-rollback if needed" })}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-memopyk-navy mb-3">
                {t("Safety Features", { fr: "Fonctionnalités de sécurité", en: "Safety Features" })}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>{t("Git backup tag protection", { fr: "Protection par tag de sauvegarde Git", en: "Git backup tag protection" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{t("Health check verification", { fr: "Vérification des contrôles de santé", en: "Health check verification" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>{t("Automatic failure detection", { fr: "Détection automatique des échecs", en: "Automatic failure detection" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{t("Real-time deployment logs", { fr: "Logs de déploiement en temps réel", en: "Real-time deployment logs" })}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}