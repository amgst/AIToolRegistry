import { useState } from 'react';
import { HeroSection } from '../HeroSection';

export default function HeroSectionExample() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <HeroSection 
      onSearch={(query) => {
        setSearchQuery(query);
        console.log('Search query:', query);
      }}
      searchQuery={searchQuery}
    />
  );
}
