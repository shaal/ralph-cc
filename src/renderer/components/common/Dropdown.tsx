import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from './Input';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  searchable = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'px-4 py-2.5',
          'bg-[#12121A] border border-[#1E1E2E]',
          'text-sm text-left',
          'rounded-lg',
          'transition-all duration-200',
          'hover:border-[#1E1E2E]/80',
          'focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20',
          isOpen && 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
          <span className={cn('truncate', selectedOption ? 'text-[#F9FAFB]' : 'text-[#6B7280]')}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'flex-shrink-0 text-[#6B7280] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-2',
              'bg-[#12121A]/95 backdrop-blur-xl',
              'border border-[#1E1E2E]',
              'rounded-lg shadow-2xl',
              'overflow-hidden'
            )}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-[#1E1E2E]">
                <Input
                  variant="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'text-sm text-left',
                        'transition-colors duration-150',
                        'hover:bg-[#1A1A24]',
                        isSelected && 'bg-[#3B82F6]/10'
                      )}
                    >
                      {option.icon && (
                        <span className="flex-shrink-0 text-[#9CA3AF]">{option.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={cn('truncate', isSelected ? 'text-[#3B82F6]' : 'text-[#F9FAFB]')}>
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-[#6B7280] truncate mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={16} className="flex-shrink-0 text-[#3B82F6]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
