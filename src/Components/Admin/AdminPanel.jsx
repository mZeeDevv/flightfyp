import React from 'react';
import SubscriptionsList from './SubscriptionsList';

const AdminPanel = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your application data</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <SubscriptionsList />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
