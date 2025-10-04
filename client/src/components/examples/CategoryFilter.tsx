import { useState } from 'react';
import { CategoryFilter } from '../CategoryFilter';

export default function CategoryFilterExample() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="p-6">
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={(category) => {
          setSelectedCategory(category);
          console.log('Selected category:', category);
        }}
      />
    </div>
  );
}
