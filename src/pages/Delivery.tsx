export default function Delivery() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Delivery & Payment</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-xl mb-4">Delivery</h3>
          <p className="text-gray-600 mb-2">
            We deliver across Ukraine via Nova Poshta courier service.
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Delivery time: 1-3 business days</li>
            <li>Free delivery on orders over 1000 UAH</li>
            <li>Track your order online</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-xl mb-4">Payment</h3>
          <p className="text-gray-600 mb-2">
            We accept the following payment methods:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Cash on delivery</li>
            <li>Card payment (Visa, MasterCard)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
