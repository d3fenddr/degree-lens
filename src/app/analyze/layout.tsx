import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Step-by-step academic coursework review and personalized European program matching.',
};

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
