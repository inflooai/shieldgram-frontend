import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShieldGram Dashboard',
  description: 'Manage your ShieldGram protection settings and analytics.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
