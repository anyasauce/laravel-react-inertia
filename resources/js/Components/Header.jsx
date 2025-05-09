import { Link } from '@inertiajs/react';

export default function Header() {
    return (
        <header className="bg-white shadow-md w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-semibold text-gray-800">
                            Laravel React Inertia
                        </Link>
                    </div>

                    <nav className="flex space-x-4">
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                        >
                            Home
                        </Link>

                        <Link
                            href="/about"
                            className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                        >
                            About
                        </Link>
                        
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
