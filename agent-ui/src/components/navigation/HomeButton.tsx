'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function HomeButton() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  return (
    <Link
      href="/"
      className="fixed top-4 left-4 px-4 py-2 bg-white rounded-md shadow-sm hover:bg-gray-50 border border-gray-200 transition-colors"
    >
      ← Home
    </Link>
  );
}
