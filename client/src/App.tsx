import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import HomeFr from "@/pages/home-fr";
import HomeEn from "@/pages/home-en";
import Admin from "@/pages/admin";
import LanguageSelectionPage from "@/pages/language-selection";
import LegalDocumentPage from "@/pages/legal-document";
import NotFound from "@/pages/not-found";
import GalleryVideoTest from "@/components/gallery-video-test";
import GalleryDebugPage from "@/pages/gallery-debug";

function Router() {
  return (
    <Switch>
      {/* Root URL - Default to French homepage */}
      <Route path="/" component={HomeFr} />
      
      {/* Language selection */}
      <Route path="/language" component={LanguageSelectionPage} />
      
      {/* Language-specific routes */}
      <Route path="/fr-FR" component={HomeFr} />
      <Route path="/en-US" component={HomeEn} />
      <Route path="/fr-FR/" component={HomeFr} />
      <Route path="/en-US/" component={HomeEn} />
      
      {/* French legal document routes */}
      <Route path="/fr-FR/mentions-legales" component={LegalDocumentPage} />
      <Route path="/fr-FR/politique-confidentialite" component={LegalDocumentPage} />
      <Route path="/fr-FR/politique-cookies" component={LegalDocumentPage} />
      <Route path="/fr-FR/conditions-generales-vente" component={LegalDocumentPage} />
      <Route path="/fr-FR/conditions-generales-utilisation" component={LegalDocumentPage} />
      
      {/* English legal document routes */}
      <Route path="/en-US/legal-notice" component={LegalDocumentPage} />
      <Route path="/en-US/privacy-policy" component={LegalDocumentPage} />
      <Route path="/en-US/cookie-policy" component={LegalDocumentPage} />
      <Route path="/en-US/terms-of-sale" component={LegalDocumentPage} />
      <Route path="/en-US/terms-of-use" component={LegalDocumentPage} />
      
      {/* Legacy legal document routes for backward compatibility */}
      <Route path="/legal/:type" component={LegalDocumentPage} />
      
      {/* Admin panel (no language prefix) */}
      <Route path="/admin" component={Admin} />
      
      {/* Gallery video test page */}
      <Route path="/test-gallery" component={GalleryVideoTest} />
      
      {/* Gallery debug page */}
      <Route path="/debug-gallery" component={GalleryDebugPage} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Toaster />
          <Router />
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;