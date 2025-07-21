import { Helmet } from "react-helmet-async";

interface SeoHeadProps {
  page?: string;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
  alternateUrls?: {
    'fr-FR': string;
    'en-US': string;
  };
}

export default function SeoHead({ 
  page = 'home',
  title = "MEMOPYK - Memory Film Service",
  description = "Transform your memories into professional memory films",
  canonicalUrl,
  ogImage,
  noIndex = false,
  alternateUrls
}: SeoHeadProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://memopyk.com';
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Language alternatives */}
      {alternateUrls && (
        <>
          <link rel="alternate" hrefLang="fr-FR" href={`${baseUrl}${alternateUrls['fr-FR']}`} />
          <link rel="alternate" hrefLang="en-US" href={`${baseUrl}${alternateUrls['en-US']}`} />
          <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${alternateUrls['en-US']}`} />
        </>
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={`${baseUrl}${ogImage}`} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}