import React from 'react';
import Link from "next/link";

const Header = () => {
    return (
        <nav className="fixed top-6 w-full container mx-auto flex justify-center md:justify-end items-start">
            <ul className="flex space-x-4 px-2">
                <li>
                    <Link href="/datasources" className="inline-flex justify-items-end px-3 py-2 border border-transparent text-base font-small rounded-lg hover transition-colors text-gray-900">
                        datasources
                    </Link>
                </li>
                <li>
                    <Link href="/hypothesis_overview" className="inline-flex justify-items-end px-3 py-2 border border-transparent text-base font-small rounded-lg hover transition-colors text-gray-900">
                        hypothesis
                    </Link>
                </li>
            </ul>
        </nav>
    )
}

export default Header;
