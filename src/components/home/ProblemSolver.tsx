import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { PROBLEM_SOLVER_ITEMS, translateProblemToDB } from '@/lib/constants';

// Update the first item to use acne image
const UPDATED_PROBLEM_SOLVER_ITEMS = PROBLEM_SOLVER_ITEMS.map((item, index) => 
  index === 0 
    ? { ...item, image: '/images/problems/problem-01.jpg' } // Acne image for first item
    : item
);

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

    const problemItem = UPDATED_PROBLEM_SOLVER_ITEMS.find(p => p.id === selectedProblem);
    if (!problemItem) return;

    // Navigate to catalog with the translated DB value using query parameter
    const dbValue = translateProblemToDB(selectedProblem);
    navigate(`/catalog?problem=${encodeURIComponent(dbValue)}`);
  };

  const selectedProblemData = selectedProblem 
    ? UPDATED_PROBLEM_SOLVER_ITEMS.find(p => p.id === selectedProblem)
    : null;

  return (
    <section className="py-12 md:py-16 bg-white flex justify-center">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        {/* Header with Dropdown */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-xl md:text-2xl lg:text-3xl font-medium uppercase tracking-[0.2em]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {selectedProblemData?.label || 'Вирішуємо проблеми шкіри'}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          {UPDATED_PROBLEM_SOLVER_ITEMS.map((problem) => {
            const isSelected = selectedProblem === problem.id;
            return (
              <button
                key={problem.id}
                onClick={() => handleProblemSelect(problem.id)}
        
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={problem.image}
                    alt={problem.label}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
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
                    {problem.label}
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
            {UPDATED_PROBLEM_SOLVER_ITEMS.map((problem) => (
              <option key={problem.id} value={problem.id}>
                {problem.label}
              </option>
            ))}
          </select>
        </div>

        {/* Footer with Product Type Dropdown and Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
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
