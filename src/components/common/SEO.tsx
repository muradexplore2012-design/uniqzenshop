import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Uniqzen Shop — Authentic Gadgets & Electronics Bangladesh',
  description = 'Shop latest smartphones, smartwatches, wireless earbuds, chargers, and tech accessories at Uniqzen Shop Bangladesh. Cash on delivery nationwide.',
  canonical,
  ogImage = '/logo.png',
}) => {
  useEffect(() => {
    document.title = title.includes('Uniqzen') ? title : `${title} | Uniqzen Shop`;

    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (name.startsWith('og:')) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:image', ogImage);
    setMeta('og:type', 'website');

    if (canonical) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [title, description, canonical, ogImage]);

  return null;
};
