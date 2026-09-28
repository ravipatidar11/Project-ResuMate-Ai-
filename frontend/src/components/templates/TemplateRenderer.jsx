import React from 'react';
import AtsTemplate from './AtsTemplate';
import ModernTemplate from './ModernTemplate';
import MinimalTemplate from './MinimalTemplate';

export default function TemplateRenderer({ templateName = 'ats_friendly', data }) {
  const norm = (templateName || '').toLowerCase();

  if (norm.includes('modern')) {
    return <ModernTemplate data={data} />;
  }
  if (norm.includes('minimal')) {
    return <MinimalTemplate data={data} />;
  }
  return <AtsTemplate data={data} />;
}
