import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';

// Проблеми шкіри, які ми вирішуємо
const skinProblems = [
  {
    id: 'wrinkles',
    name: 'Зморшки',
    image: '/images/problems/problem-03.jpg',
    problem: 'зморшки'
  },
  {
    id: 'dryness',
    name: 'Засоби для сухої шкіри обличчя',
    image: '/images/problems/problem-02.jpg',
    problem: 'сухість'
  },
  {
    id: 'acne',
    name: 'Висипи',
    image: '/images/problems/problem-01.jpg',
    problem: 'акне'
  },
  {
    id: 'pigmentation',
    name: 'Пігментація',
    image: '/images/problems/problem-04.jpg',
    problem: 'пігментація'
  },
  {
    id: 'couperose',
    name: 'Купероз',
    image: '/images/problems/problem-05.jpg',
    problem: 'купероз'
  },
  {
    id: 'pores',
    name: 'Розширені пори',
    image: '/images/problems/problem-01.jpg',
    problem: 'пори'
  }
];

// Типи продуктів (опціонально)
const productTypes = [
  { value: '', label: 'Всі типи' },
  { value: 'serum', label: 'Сирівки' },
  { value: 'cream', label: 'Креми' },
  { value: 'mask', label: 'Маски' },
  { value: 'cleanser', label: 'Очищення' },
  { value: 'toner', label: 'Тонери' },
  { value: 'sunscreen', label: 'Сонцезахисні' }
];

export default function ProblemSolver() {
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleProblemSelect = (problemId: string) => {
    setSelectedProblem(selectedProblem === problemId ? null : problemId);
  };

  const handleApplyFilters = () => {
    if (!selectedProblem) return;

    const problem = skinProblems.find(p => p.id === selectedProblem);
    if (!problem) return;

    const params = new URLSearchParams();
    params.set('problem', problem.problem);
    if (selectedProductType) {
      params.set('category', selectedProductType);
    }

    navigate(`/catalog?${params.toString()}`);
  };

  const selectedProblemData = selectedProblem 
    ? skinProblems.find(p => p.id === selectedProblem)
    : null;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        {/* Header with Dropdown */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-xl md:text-2xl lg:text-3xl font-medium uppercase tracking-[0.2em]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {selectedProblemData?.name || 'Вирішуємо проблеми шкіри'}
            </h2>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors hidden md:flex"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span className="text-sm uppercase tracking-[1px]">Виберіть проблему</span>
            </button>
          </div>
        </div>
        
        {/* Problems Grid - Responsive for desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
          {skinProblems.map((problem) => {
            const isSelected = selectedProblem === problem.id;
            return (
              <button
                key={problem.id}
                onClick={() => handleProblemSelect(problem.id)}
                className="bg-white rounded-none border border-black overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                  <img
                    src={problem.image}
                    alt={problem.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 mix-blend-multiply object-position-center"
                    loading="lazy"
                    style={{ objectPosition: 'center', minWidth: '100%', minHeight: '100%' }}
                  />
                  {isSelected && (
                    <div className="absolute bottom-2 left-2 w-6 h-6 bg-black flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-3 md:p-4 text-center">
                  <h3 
                    className="text-xs md:text-sm font-medium uppercase tracking-wide line-clamp-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {problem.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden mb-6">
          <select
            value={selectedProblem || ''}
            onChange={(e) => setSelectedProblem(e.target.value || null)}
            className="w-full border border-black bg-white py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <option value="">Виберіть проблему</option>
            {skinProblems.map((problem) => (
              <option key={problem.id} value={problem.id}>
                {problem.name}
              </option>
            ))}
          </select>
        </div>

        {/* Footer with Product Type Dropdown and Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative border-b border-gray-300">
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-full bg-transparent py-2 md:py-3 px-0 pr-8 focus:outline-none focus:border-b-2 focus:border-black appearance-none cursor-pointer text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {productTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
          <button
            onClick={handleApplyFilters}
            disabled={!selectedProblem}
            className="px-6 md:px-8 py-3 md:py-4 bg-black text-white font-bold uppercase tracking-[2px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-sm md:text-base"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ВИБЕРІТЬ ОПЦІЇ
          </button>
        </div>
      </div>
    </section>
  );
}