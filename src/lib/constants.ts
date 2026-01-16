// Mappings for translating UI labels to database values
export const ATTRIBUTE_MAPPINGS = {
  problems: {
    // UI slug/label : DB Russian value
    'acne': 'Прыщи',
    'dryness': 'Сухость',
    'wrinkles': 'Морщины',
    'pigmentation': 'Пигментация',
    'couperose': 'Купероз',
    'pores': 'Расширенные поры',
    'sensitivity': 'Чувствительность',
    'aging': 'Возрастные изменения'
  },
  skinTypes: {
    // UI value : DB value (verify these)
    'Жирна': 'Жирна',
    'Комбінована': 'Комбінована',
    'Суха': 'Суха',
    'Нормальна': 'Нормальна',
    'Чутлива': 'Чутлива'
  }
};

// Problem Solver items with proper mappings
export const PROBLEM_SOLVER_ITEMS = [
  { 
    id: 'acne', 
    label: 'Акне та висипання', 
    image: '/images/problems/problem-01.jpg', 
    dbValue: 'Прыщи',
    problem: 'Акне'
  },
  { 
    id: 'aging', 
    label: 'Вікові зміни', 
    image: '/images/problems/problem-03.jpg', 
    dbValue: 'Возрастные изменения',
    problem: 'Глубокие морщины'
  },
  { 
    id: 'dryness', 
    label: 'Сухість та зневоднення', 
    image: '/images/problems/problem-02.jpg', 
    dbValue: 'Сухость',
    problem: 'Сухость'
  },
  { 
    id: 'pigmentation', 
    label: 'Пігментація', 
    image: '/images/problems/problem-04.jpg', 
    dbValue: 'Пигментация',
    problem: 'Пигментация'
  },
  { 
    id: 'couperose', 
    label: 'Купероз', 
    image: '/images/problems/problem-05.jpg', 
    dbValue: 'Купероз',
    problem: 'Купероз'
  },
  { 
    id: 'pores', 
    label: 'Розширені пори', 
    image: '/images/problems/problem-01.jpg', 
    dbValue: 'Расширенные поры',
    problem: 'Расширенные поры'
  }
];

// Helper function to translate UI values to DB values
export const translateProblemToDB = (uiValue: string): string => {
  const item = PROBLEM_SOLVER_ITEMS.find(item => item.id === uiValue);
  return item ? item.dbValue : uiValue;
};

// Helper function to format DB values for display
export const formatAttributeValue = (key: string, value: string): string => {
  // For skin problems - translate Russian DB values to Ukrainian display
  if (key === 'Проблема шкіри') {
    const mapping = Object.entries(ATTRIBUTE_MAPPINGS.problems).find(
      ([_, dbValue]) => dbValue === value
    );
    if (mapping) {
      // Return Ukrainian label based on the mapping key
      switch (mapping[0]) {
        case 'acne': return 'Акне';
        case 'dryness': return 'Сухість';
        case 'wrinkles': return 'Зморшки';
        case 'pigmentation': return 'Пігментація';
        case 'couperose': return 'Купероз';
        case 'pores': return 'Розширені пори';
        case 'sensitivity': return 'Чутливість';
        case 'aging': return 'Вікові зміни';
        default: return value;
      }
    }
  }
  
  // For skin types - translate to proper Ukrainian if needed
  if (key === 'Тип шкіри') {
    // Assuming DB values are already in Ukrainian, return as-is
    // If they're in Russian, add translation logic here
    return value;
  }
  
  // Return original value for unmapped attributes
  return value;
};