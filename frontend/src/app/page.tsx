export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-2">Aktywne zlecenia</h2>
          <p className="text-3xl font-bold text-blue-600">5</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-2">W kolejce</h2>
          <p className="text-3xl font-bold text-orange-600">3</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-2">Zakończone dziś</h2>
          <p className="text-3xl font-bold text-green-600">2</p>
        </div>
      </div>
    </div>
  );
}