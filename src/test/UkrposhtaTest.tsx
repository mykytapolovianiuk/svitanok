import { useState } from 'react';
import { searchCities, getWarehouses, createTTN } from '@/services/ukrPoshta';

export default function UkrposhtaTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Search cities
      const startTime = Date.now();
      const cities = await searchCities('київ');
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        test: 'Search Cities',
        status: 'success',
        data: cities,
        time: endTime - startTime
      }]);

      // Test 2: Get warehouses (if we have a city)
      if (cities.length > 0) {
        const warehouseStartTime = Date.now();
        const warehouses = await getWarehouses(cities[0].ref!);
        const warehouseEndTime = Date.now();
        
        setTestResults(prev => [...prev, {
          test: 'Get Warehouses',
          status: 'success',
          data: warehouses,
          time: warehouseEndTime - warehouseStartTime
        }]);
      }

      // Test 3: Create TTN (mock data)
      const ttnStartTime = Date.now();
      const ttnData = await createTTN({
        customer_name: 'Тестовий Користувач',
        customer_phone: '380961234567',
        customer_email: 'test@example.com',
        delivery_info: {
          city: 'Київ',
          warehouse: 'Відділення №1'
        },
        items: [{ product_name: 'Тестовий товар', quantity: 1 }],
        total_price: 1000
      });
      const ttnEndTime = Date.now();
      
      setTestResults(prev => [...prev, {
        test: 'Create TTN',
        status: 'success',
        data: ttnData,
        time: ttnEndTime - ttnStartTime
      }]);

    } catch (error: any) {
      setTestResults(prev => [...prev, {
        test: 'Error',
        status: 'error',
        data: error.message,
        time: 0
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ukrposhta Integration Test</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-4 rounded ${
              result.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{result.test}</h3>
              <span className="text-sm text-gray-500">
                {result.time > 0 ? `${result.time}ms` : ''}
              </span>
            </div>
            
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}