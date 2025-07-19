import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle, Copy, Clock, History, AlertCircle, ExternalLink, RefreshCw, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DeploymentEnvironment {
  name: string;
  domain: string;
  description: string;
  isProduction: boolean;
}

const DEPLOYMENT_ENVIRONMENTS: DeploymentEnvironment[] = [
  {
    name: 'staging',
    domain: 'new.memopyk.com',
    description: 'Test environment for development and testing',
    isProduction: false
  },
  {
    name: 'production',
    domain: 'memopyk.com',
    description: 'Live production environment for customers',
    isProduction: true
  }
];

export function DeploymentManagement() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('staging');
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [isDeploymentInProgress, setIsDeploymentInProgress] = useState(false);
  const [deploymentStartTime, setDeploymentStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  
  const { toast } = useToast();
  const { t } = useLanguage();

  // Update elapsed time every second during deployment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDeploymentInProgress && deploymentStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - deploymentStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isDeploymentInProgress, deploymentStartTime]);

  // Check deployment status on component mount
  const statusQuery = useQuery({
    queryKey: ['/api/deploy/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deploy/status');
      return response.json();
    },
    onSuccess: (data) => {
      setIsDeploymentInProgress(data.inProgress);
    }
  });

  // Get deployment history
  const historyQuery = useQuery({
    queryKey: ['/api/deployment-history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deployment-history');
      return response.json();
    }
  });

  const resetDeploymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/deploy/reset');
      return response.json();
    },
    onSuccess: () => {
      setIsDeploymentInProgress(false);
      setDeploymentProgress(0);
      setDeploymentLogs([]);
      toast({
        title: "État de déploiement réinitialisé",
        description: "Vous pouvez maintenant commencer un nouveau déploiement",
      });
    }
  });

  const nginxSetupMutation = useMutation({
    mutationFn: async (nginxConfig: { host: string; username: string; domain: string }) => {
      setDeploymentLogs([]);
      setDeploymentProgress(0);
      
      const response = await fetch('/api/deploy/setup-nginx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nginxConfig),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Nginx setup failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const logData = JSON.parse(line);
              if (logData.type === 'progress') {
                setDeploymentProgress(logData.percentage || 0);
                setDeploymentLogs(prev => [...prev, `PROGRESS: ${logData.message} (${logData.percentage}%)`]);
              } else if (logData.type === 'log') {
                setDeploymentLogs(prev => [...prev, logData.message]);
              } else if (logData.type === 'error') {
                setDeploymentLogs(prev => [...prev, `ERROR: ${logData.message}`]);
                throw new Error(logData.message);
              } else if (logData.type === 'success') {
                setDeploymentLogs(prev => [...prev, `SUCCESS: ${logData.message}`]);
                setDeploymentProgress(100);
              } else if (logData.type === 'warning') {
                setDeploymentLogs(prev => [...prev, `WARNING: ${logData.message}`]);
              }
            } catch (e) {
              setDeploymentLogs(prev => [...prev, line]);
            }
          }
        }
      }
      
      return { success: true };
    },
    onSuccess: () => {
      setIsDeploymentInProgress(false);
      setDeploymentProgress(100);
      
      toast({
        title: "Configuration nginx réussie",
        description: "Le serveur web et SSL ont été configurés avec succès",
      });
      
      statusQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de configuration nginx",
        description: error.message || "La configuration nginx a échoué. Vérifiez les logs pour plus de détails.",
        variant: "destructive",
      });
      setDeploymentProgress(0);
      setIsDeploymentInProgress(false);
    }
  });

  const deployMutation = useMutation({
    mutationFn: async (environment: string) => {
      const env = DEPLOYMENT_ENVIRONMENTS.find(e => e.name === environment);
      if (!env) throw new Error('Invalid environment');

      setDeploymentLogs([
        t('Starting deployment to {domain}', { fr: `Démarrage du déploiement vers ${env.domain}`, en: `Starting deployment to ${env.domain}` }),
        t('Build command: npm ci --include=dev && npm run build', { fr: 'Commande de build: npm ci --include=dev && npm run build', en: 'Build command: npm ci --include=dev && npm run build' })
      ]);
      setDeploymentProgress(10);
      
      // Use the established Coolify API deployment process
      const response = await apiRequest('POST', '/api/deploy/coolify', { environment: environment });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Deployment failed');
      }
      
      setDeploymentLogs(prev => [...prev, t('Deployment triggered successfully', { fr: 'Déploiement déclenché avec succès', en: 'Deployment triggered successfully' })]);
      setDeploymentProgress(25);
      
      // Monitor deployment progress
      setDeploymentLogs(prev => [...prev, t('Building application from GitHub repository...', { fr: 'Construction de l\'application depuis le dépôt GitHub...', en: 'Building application from GitHub repository...' })]);
      setDeploymentProgress(50);
      
      // Monitor deployment status
      const monitorDeployment = async () => {
        let attempts = 0;
        const maxAttempts = 24; // 12 minutes max
        
        while (attempts < maxAttempts) {
          attempts++;
          setDeploymentProgress(50 + (attempts / maxAttempts) * 45);
          
          try {
            // Check if site is responding
            const siteCheck = await fetch(`https://${env.domain}/api/health`, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            
            if (siteCheck.ok) {
              setDeploymentLogs(prev => [...prev, t('Site is responding - deployment complete', { fr: 'Site répond - déploiement terminé', en: 'Site is responding - deployment complete' })]);
              setDeploymentProgress(100);
              return true;
            }
          } catch (error) {
            // Site not ready yet, continue monitoring
          }
          
          if (attempts % 4 === 0) {
            setDeploymentLogs(prev => [...prev, t('Still building... ({time}s elapsed)', { fr: `Toujours en construction... (${attempts * 30}s écoulées)`, en: `Still building... (${attempts * 30}s elapsed)` })]);
          }
          
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        }
        
        setDeploymentLogs(prev => [...prev, t('Deployment taking longer than expected - check Coolify dashboard', { fr: 'Déploiement plus long que prévu - vérifiez le tableau de bord Coolify', en: 'Deployment taking longer than expected - check Coolify dashboard' })]);
        return false;
      };
      
      const success = await monitorDeployment();
      
      if (success) {
        setDeploymentLogs(prev => [...prev, 
          t('MEMOPYK platform deployed successfully!', { fr: 'Plateforme MEMOPYK déployée avec succès!', en: 'MEMOPYK platform deployed successfully!' }),
          t('Access: {domain}', { fr: `Accès: ${env.domain}`, en: `Access: ${env.domain}` }),
          t('Admin: {domain}/admin', { fr: `Admin: ${env.domain}/admin`, en: `Admin: ${env.domain}/admin` })
        ]);
      }
      
      return { success };
    },
    onSuccess: () => {
      // Reset deployment state
      setIsDeploymentInProgress(false);
      setDeploymentProgress(100);
      
      toast({
        title: t("Deployment successful", { fr: "Déploiement réussi", en: "Deployment successful" }),
        description: t("Application deployed successfully", { fr: "L'application a été déployée avec succès", en: "Application deployed successfully" }),
      });
      
      // Refresh deployment status from server
      statusQuery.refetch();
      historyQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: t("Deployment error", { fr: "Erreur de déploiement", en: "Deployment error" }),
        description: error.message || t("Deployment failed. Check logs for details.", { fr: "Le déploiement a échoué. Vérifiez les logs pour plus de détails.", en: "Deployment failed. Check logs for details." }),
        variant: "destructive",
      });
      setDeploymentProgress(0);
    }
  });

  const getCurrentEnvironment = () => {
    return DEPLOYMENT_ENVIRONMENTS.find(env => env.name === selectedEnvironment);
  };

  const handleDeploy = (environment: string) => {
    setDeploymentStartTime(new Date());
    setIsDeploymentInProgress(true);
    deployMutation.mutate(environment);
  };

  const copyLogsToClipboard = () => {
    const logsText = deploymentLogs.join('\n');
    navigator.clipboard.writeText(logsText).then(() => {
      toast({
        title: "Logs copiés",
        description: "Les logs ont été copiés dans le presse-papiers",
      });
    }).catch(() => {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier les logs",
        variant: "destructive",
      });
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const handleNginxSetup = () => {
    if (!config.host || !config.username || !config.domain) {
      toast({
        title: "Configuration incomplète", 
        description: "Veuillez remplir tous les champs requis pour la configuration nginx",
        variant: "destructive",
      });
      return;
    }
    
    nginxSetupMutation.mutate({
      host: config.host,
      username: config.username,
      domain: config.domain
    });
  };

  const handleTestConnection = () => {
    if (!config.host || !config.username) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez remplir l'adresse IP et le nom d'utilisateur",
        variant: "destructive",
      });
      return;
    }
    
    testConnectionMutation.mutate(config);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-memopyk-navy">
          {t("VPS Deployment", { fr: "Déploiement VPS", en: "VPS Deployment" })}
        </h2>
        <Button
          onClick={() => setShowBuildInfo(!showBuildInfo)}
          variant="outline"
          className="border-memopyk-navy text-memopyk-navy"
        >
          <Settings className="h-4 w-4 mr-2" />
          {showBuildInfo ? 
            t("Hide Build Info", { fr: "Masquer les infos", en: "Hide Build Info" }) : 
            t("Build Info", { fr: "Infos de build", en: "Build Info" })
          }
        </Button>
      </div>

      {/* Environment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {t("Deployment Environment", { fr: "Environnement de déploiement", en: "Deployment Environment" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <TabsList className="grid w-full grid-cols-2">
              {DEPLOYMENT_ENVIRONMENTS.map((env) => (
                <TabsTrigger key={env.name} value={env.name} className="flex items-center gap-2">
                  <Badge variant={env.isProduction ? "destructive" : "secondary"}>
                    {env.isProduction ? "PROD" : "TEST"}
                  </Badge>
                  {env.domain}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {DEPLOYMENT_ENVIRONMENTS.map((env) => (
              <TabsContent key={env.name} value={env.name} className="mt-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{env.domain}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${env.domain}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t("Visit Site", { fr: "Voir le site", en: "Visit Site" })}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{env.description}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Build Information */}
      {showBuildInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("Build Configuration", { fr: "Configuration de build", en: "Build Configuration" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    {t("Current Build Status: Working", { fr: "Statut de build actuel: Fonctionnel", en: "Current Build Status: Working" })}
                  </span>
                </div>
                <div className="text-sm space-y-1 text-green-700 dark:text-green-300">
                  <p><strong>{t("Build Command", { fr: "Commande de build", en: "Build Command" })}:</strong> npm ci --include=dev && npm run build</p>
                  <p><strong>{t("Environment Variable", { fr: "Variable d'environnement", en: "Environment Variable" })}:</strong> NPM_CONFIG_PRODUCTION=false</p>
                  <p><strong>{t("Build Tools", { fr: "Outils de build", en: "Build Tools" })}:</strong> vite, esbuild, @vitejs/plugin-react</p>
                  <p><strong>{t("Last Fixed", { fr: "Dernière correction", en: "Last Fixed" })}:</strong> {t("July 9, 2025", { fr: "9 juillet 2025", en: "July 9, 2025" })}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                {t("Deployment Process", { fr: "Processus de déploiement", en: "Deployment Process" })}
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>{t("GitHub repository synchronization", { fr: "Synchronisation du dépôt GitHub", en: "GitHub repository synchronization" })}</li>
                <li>{t("Install dependencies with devDependencies", { fr: "Installation des dépendances avec devDependencies", en: "Install dependencies with devDependencies" })}</li>
                <li>{t("Frontend build with Vite", { fr: "Build frontend avec Vite", en: "Frontend build with Vite" })}</li>
                <li>{t("Backend bundle with esbuild", { fr: "Bundle backend avec esbuild", en: "Backend bundle with esbuild" })}</li>
                <li>{t("Container deployment and health checks", { fr: "Déploiement du container et vérifications", en: "Container deployment and health checks" })}</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("Quick Deployment", { fr: "Déploiement rapide", en: "Quick Deployment" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  {t("Automatic deployment to {domain}", { 
                    fr: `Déploiement automatique vers ${getCurrentEnvironment()?.domain || 'new.memopyk.com'}`, 
                    en: `Automatic deployment to ${getCurrentEnvironment()?.domain || 'new.memopyk.com'}` 
                  })}
                </p>
                <p className="text-blue-600 dark:text-blue-300">
                  {t("This action will build the application via Coolify and deploy to your VPS with automatic health checks.", {
                    fr: "Cette action va construire l'application via Coolify et la déployer sur votre VPS avec vérifications automatiques.",
                    en: "This action will build the application via Coolify and deploy to your VPS with automatic health checks."
                  })}
                </p>
              </div>
            </div>
          </div>

          {deploymentProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression du déploiement</span>
                <span>{deploymentProgress}%</span>
              </div>
              <Progress value={deploymentProgress} className="w-full" />
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => handleDeploy(selectedEnvironment)}
              disabled={isDeploymentInProgress || deployMutation.isPending}
              className={`w-full ${getCurrentEnvironment()?.isProduction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {deployMutation.isPending || isDeploymentInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t("Deployment in progress...", { fr: "Déploiement en cours...", en: "Deployment in progress..." })}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t("Deploy to {environment}", { 
                    fr: `Déployer vers ${getCurrentEnvironment()?.domain}`, 
                    en: `Deploy to ${getCurrentEnvironment()?.domain}` 
                  })}
                  {getCurrentEnvironment()?.isProduction && (
                    <Badge variant="destructive" className="ml-2">PROD</Badge>
                  )}
                </>
              )}
            </Button>
            
            {isDeploymentInProgress && (
              <Button
                onClick={() => resetDeploymentMutation.mutate()}
                disabled={resetDeploymentMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t("Reset Deployment", { fr: "Réinitialiser le déploiement", en: "Reset Deployment" })}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {deploymentLogs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Logs de déploiement</CardTitle>
              {isDeploymentInProgress && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(elapsedTime)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyLogsToClipboard}
                disabled={deploymentLogs.length === 0}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeploymentLogs([])}
                disabled={deployMutation.isPending}
              >
                Effacer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto"
              style={{ scrollBehavior: 'smooth' }}
              ref={(el) => {
                if (el) {
                  el.scrollTop = el.scrollHeight;
                }
              }}
            >
              {deploymentLogs.map((log, index) => (
                <div key={index} className="mb-1 flex">
                  <span className="text-gray-500 mr-2 flex-shrink-0">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span className={`
                    ${log.startsWith('ERROR:') ? 'text-red-400' : ''}
                    ${log.startsWith('SUCCESS:') ? 'text-green-400' : ''}
                    ${log.startsWith('WARNING:') ? 'text-yellow-400' : ''}
                  `}>
                    {log}
                  </span>
                </div>
              ))}
              {deployMutation.isPending && (
                <div className="mb-1 flex">
                  <span className="text-gray-500 mr-2">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span className="text-blue-400 animate-pulse">
                    En cours...
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des déploiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement de l'historique...
            </div>
          ) : historyQuery.data?.length > 0 ? (
            <div className="space-y-3">
              {historyQuery.data.slice(0, 5).map((deployment: any) => (
                <div key={deployment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      deployment.status === 'success' ? 'bg-green-500' :
                      deployment.status === 'failed' ? 'bg-red-500' : 
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <div className="font-medium capitalize">
                        {deployment.type === 'deployment' ? 'Déploiement' : 'Configuration Nginx'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(deployment.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium capitalize ${
                      deployment.status === 'success' ? 'text-green-600' :
                      deployment.status === 'failed' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {deployment.status === 'success' ? 'Réussi' :
                       deployment.status === 'failed' ? 'Échoué' : 'En cours'}
                    </div>
                    {deployment.duration && (
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(deployment.duration)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Aucun déploiement dans l'historique
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}