export default function Home() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
            Aktywne zlecenia
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-blue-600">5</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
            W kolejce
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">3</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
            Zakończone dziś
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-green-600">2</p>
        </div>
      </div>
    </div>
  );
}
