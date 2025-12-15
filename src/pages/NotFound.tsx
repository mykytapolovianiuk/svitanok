import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Сторінку не знайдено</h2>
      <p className="text-gray-600 mb-8">
        Сторінка, яку ви шукаєте, не існує або була переміщена.
      </p>
      <Link
        to="/"
        className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700"
      >
        На головну
      </Link>
    </div>
  );
}