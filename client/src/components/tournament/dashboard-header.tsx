export const DashboardHeader = () => {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold text-gray-900">Tournament Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage your baseball tournaments with real-time updates</p>
          </div>
        </div>
      </div>
    </div>
  );
};
