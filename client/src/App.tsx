import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/language-provider";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import LegalDocument from "@/pages/legal-document";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/legal-notice" component={() => <LegalDocument type="legal_notice" />} />
      <Route path="/privacy-policy" component={() => <LegalDocument type="privacy_policy" />} />
      <Route path="/cookie-policy" component={() => <LegalDocument type="cookie_policy" />} />
      <Route path="/terms-of-sale" component={() => <LegalDocument type="terms_of_sale" />} />
      <Route path="/terms-of-use" component={() => <LegalDocument type="terms_of_use" />} />
      <Route path="/faq" component={() => <LegalDocument type="faq" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
