import { useDataSources } from '@/hooks/useDataSources';
import { useRef, useEffect } from 'react';

interface DataSourceSelectorProps {
  selectedDatasources: string[];
  onChange: (selectedIds: string[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function DataSourceSelector({ selectedDatasources, onChange, isOpen, setIsOpen }: DataSourceSelectorProps) {
  const { dataSources } = useDataSources();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className="relative max-w-xs" ref={dropdownRef}>
      <div 
        className="flex flex-wrap gap-2 p-2 border rounded-lg cursor-pointer min-h-[40px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDatasources.length > 0 ? (
          dataSources
            .filter(ds => selectedDatasources.includes(ds._id))
            .map(ds => (
              <div key={ds._id} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full mr-2 bg-gray-400"></div>
                {ds.name}
              </div>
            ))
        ) : (
          <div className="text-gray-400">Select datasources...</div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full max-w-xs bottom-[100%] mb-1 bg-white border rounded-lg shadow-lg">
          {dataSources.map(ds => (
            <div
              key={ds._id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                const isSelected = selectedDatasources.includes(ds._id);
                onChange(
                  isSelected
                    ? selectedDatasources.filter(id => id !== ds._id)
                    : [...selectedDatasources, ds._id]
                );
              }}
            >
              <input
                type="checkbox"
                checked={selectedDatasources.includes(ds._id)}
                onChange={() => {}}
                className="form-checkbox h-4 w-4 text-gray-600"
              />
              <span className="text-gray-600">{ds.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
