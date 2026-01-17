import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { translateProblemToDB } from '@/lib/constants';

// Static problem items with direct image assignments
const PROBLEM_ITEMS = [
  { 
    id: 'acne', 
    label: 'Акне та висипання', 
    image: '/images/problems/problem-01.jpg', 
    dbValue: 'Прыщи'
  },
  { 
    id: 'dryness', 
    label: 'Сухість', 
    image: '/images/problems/problem-02.jpg', 
    dbValue: 'Сухость'
  },
  { 
    id: 'aging', 
    label: 'Вікові зміни', 
    image: '/images/problems/problem-03.jpg', 
    dbValue: 'Возрастные изменения'
  },
  { 
    id: 'pigmentation', 
    label: 'Пігментація', 
    image: '/images/problems/problem-04.jpg', 
    dbValue: 'Пигментация'
  },
  { 
    id: 'couperose', 
    label: 'Купероз', 
    image: '/images/problems/problem-05.jpg', 
    dbValue: 'Купероз'
  }
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

    const problemItem = PROBLEM_ITEMS.find(p => p.id === selectedProblem);
    if (!problemItem) return;

    // Navigate to catalog with the DB value
    navigate(`/catalog?problem=${encodeURIComponent(problemItem.dbValue)}`);
  };

  const selectedProblemData = selectedProblem 
    ? PROBLEM_ITEMS.find(p => p.id === selectedProblem)
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
        
        {/* Problems Grid - Static list of problems */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Problem 1: Acne */}
          <button
            onClick={() => handleProblemSelect('acne')}
            className={`group ${selectedProblem === 'acne' ? 'ring-2 ring-black' : ''}`}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src="/images/problems/problem-01.jpg"
                alt="Акне та висипання"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {selectedProblem === 'acne' && (
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
                Акне та висипання
              </h3>
            </div>
          </button>

          {/* Problem 2: Dryness */}
          <button
            onClick={() => handleProblemSelect('dryness')}
            className={`group ${selectedProblem === 'dryness' ? 'ring-2 ring-black' : ''}`}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src="/images/problems/problem-02.jpg"
                alt="Сухість"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {selectedProblem === 'dryness' && (
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
                Сухість
              </h3>
            </div>
          </button>

          {/* Problem 3: Aging */}
          <button
            onClick={() => handleProblemSelect('aging')}
            className={`group ${selectedProblem === 'aging' ? 'ring-2 ring-black' : ''}`}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src="/images/problems/problem-03.jpg"
                alt="Вікові зміни"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {selectedProblem === 'aging' && (
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
                Вікові зміни
              </h3>
            </div>
          </button>

          {/* Problem 4: Pigmentation */}
          <button
            onClick={() => handleProblemSelect('pigmentation')}
            className={`group ${selectedProblem === 'pigmentation' ? 'ring-2 ring-black' : ''}`}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src="/images/problems/problem-04.jpg"
                alt="Пігментація"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {selectedProblem === 'pigmentation' && (
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
                Пігментація
              </h3>
            </div>
          </button>

          {/* Problem 5: Couperose */}
          <button
            onClick={() => handleProblemSelect('couperose')}
            className={`group ${selectedProblem === 'couperose' ? 'ring-2 ring-black' : ''}`}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src="/images/problems/problem-05.jpg"
                alt="Купероз"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {selectedProblem === 'couperose' && (
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
                Купероз
              </h3>
            </div>
          </button>
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
            <option value="acne">Акне та висипання</option>
            <option value="dryness">Сухість</option>
            <option value="aging">Вікові зміни</option>
            <option value="pigmentation">Пігментація</option>
            <option value="couperose">Купероз</option>
          </select>
        </div>

        {/* Footer with centered Button */}
        <div className="flex justify-center">
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
