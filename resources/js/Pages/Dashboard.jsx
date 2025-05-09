import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

export default function Dashboard({ user }) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleLogout = () => {
        Inertia.post('/logout');
    };

    const handleUpdate = (e) => {
        e.preventDefault();

        Inertia.post('/user/update', { name, email }, {
            onSuccess: () => {
                setIsUpdating(false);
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            Inertia.post('/user/delete');
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white shadow-lg p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
                <div>
                    <p className="text-lg text-gray-700">Welcome to your dashboard. You can manage your data here.</p>
                    <p className="text-lg text-gray-700 mt-4">Logged in as: <strong>{user.name}</strong></p>
                    
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold">Update Your Information</h3>
                        <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                            />
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                            >
                                {isUpdating ? 'Updating...' : 'Update Information'}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-xl font-semibold text-red-500">Delete Account</h3>
                        <p className="text-gray-700">Once deleted, you cannot recover your account.</p>
                        <button
                            onClick={handleDelete}
                            className="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
