import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from '../components/workspace';
import { Header } from '../components/header';
import { Footer } from '../components/footer';

export const metadata: Metadata = {
  title: {
    default: "DegreeLens | Explore European Higher Education",
    template: "%s | DegreeLens",
  },
  description: "Explore European universities, compare your academic coursework with documented admission requirements, and evaluate ECTS eligibility.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth"><body><WorkspaceProvider><Header/><main>{children}</main><Footer/></WorkspaceProvider></body></html>
  );
}
