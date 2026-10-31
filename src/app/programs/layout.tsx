import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Degree Programs Directory',
  description: 'Search and filter 4,650 European university degree programs by country, level, and discipline.',
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
