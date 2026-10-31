import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'European Universities Directory',
  description: 'Explore 1,128 higher education institutions across Europe.',
};

export default function UniversitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
