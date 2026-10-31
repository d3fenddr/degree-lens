import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coursework Evaluation & Comparison',
  description: 'Review your verified ECTS coursework allocation against university admission criteria.',
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
