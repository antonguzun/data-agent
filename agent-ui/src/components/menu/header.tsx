'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';

const Header = () => {
    const pathname = usePathname();
    return (
        <nav className="fixed top-6 w-full container mx-auto flex justify-between items-start px-6">
            {pathname !== '/' && (
                <Link href="/" className="inline-flex px-3 py-2 border border-transparent text-base font-small rounded-lg hover:bg-gray-100 transition-colors text-gray-900">
                    ← Home
                </Link>
            )}
            <ul className="flex space-x-4 px-2 ml-auto">
                <li>
                    <Link href="/datasources" className="inline-flex justify-items-end px-3 py-2 border border-transparent text-base font-small rounded-lg hover transition-colors text-gray-900">
                        datasources
                    </Link>
                </li>
                <li>
                    <Link href="/results" className="inline-flex justify-items-end px-3 py-2 border border-transparent text-base font-small rounded-lg hover transition-colors text-gray-900">
                        results
                    </Link>
                </li>
            </ul>
        </nav>
    )
}

export default Header;
