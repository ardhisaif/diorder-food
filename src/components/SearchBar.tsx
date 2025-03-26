import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  debounceTime?: number;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  debounceTime = 300,
  placeholder = "Cari...",
}) => {
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  // Set debouncedQuery after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [query, debounceTime]);

  // Optimize onSearch with useCallback
  const handleSearch = useCallback(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    handleSearch();
  }, [debouncedQuery, handleSearch]);

  // Trigger search immediately when query is cleared
  useEffect(() => {
    if (query === "") {
      onSearch("");
    }
  }, [query, onSearch]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
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
