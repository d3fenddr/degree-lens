import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from '../components/workspace';
import { Header } from '../components/header';
import { Footer } from '../components/footer';

export const metadata: Metadata = {
  title: "DegreeLens — Understand your academic eligibility",
  description: "Compare your coursework with source-backed German master’s program requirements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth"><body><WorkspaceProvider><Header/><main>{children}</main><Footer/></WorkspaceProvider></body></html>
  );
}
