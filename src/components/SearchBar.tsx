import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  debounceTime?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, debounceTime = 300 }) => {
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query);

  // Set debouncedQuery after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceTime);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceTime]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Cari makanan atau minuman..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;