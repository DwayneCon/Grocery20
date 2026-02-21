/* client/src/components/recipes/RecipeFilters.tsx */
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { Search, Sort } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../common/GlassCard';

export interface RecipeFiltersState {
  search: string;
  cuisines: string[];
  times: string[];
  difficulties: string[];
  dietary: string[];
  sort: string;
}

interface RecipeFiltersProps {
  filters: RecipeFiltersState;
  onFiltersChange: (filters: RecipeFiltersState) => void;
}

const CUISINE_OPTIONS = ['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean'];
const TIME_OPTIONS = ['Under 30 min', '30-60 min', '1+ hour'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'quickest', label: 'Quickest' },
  { value: 'cheapest', label: 'Cheapest' },
];

interface FilterGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  color: string;
}

const FilterGroup = ({ label, options, selected, onToggle, color }: FilterGroupProps) => {
  const { mode } = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          fontWeight: 'bold',
          letterSpacing: 1,
          textTransform: 'uppercase',
          mb: 1,
          display: 'block',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <AnimatePresence>
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <motion.div
                key={option}
                whileTap={{ scale: 0.9 }}
                layout
              >
                <Chip
                  label={option}
                  onClick={() => onToggle(option)}
                  component={motion.div}
                  animate={{
                    scale: isSelected ? 1.05 : 1,
                    backgroundColor: isSelected
                      ? color
                      : mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  sx={{
                    color: isSelected
                      ? '#fff'
                      : mode === 'dark'
                      ? 'rgba(255,255,255,0.8)'
                      : 'rgba(0,0,0,0.7)',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    border: isSelected
                      ? `1px solid ${color}`
                      : mode === 'dark'
                      ? '1px solid rgba(255,255,255,0.12)'
                      : '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

const RecipeFilters = ({ filters, onFiltersChange }: RecipeFiltersProps) => {
  const { mode } = useTheme();
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleFilter = useCallback(
    (category: keyof Pick<RecipeFiltersState, 'cuisines' | 'times' | 'difficulties' | 'dietary'>, value: string) => {
      const current = filters[category];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFiltersChange({ ...filters, [category]: updated });
    },
    [filters, onFiltersChange]
  );

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    onFiltersChange({ ...filters, sort: event.target.value });
  };

  const activeFilterCount =
    filters.cuisines.length +
    filters.times.length +
    filters.difficulties.length +
    filters.dietary.length +
    (filters.search ? 1 : 0);

  return (
    <GlassCard
      intensity="light"
      hover={false}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Search and Sort Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <TextField
          placeholder="Search recipes..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 'var(--radius-md)',
              color: mode === 'dark' ? 'white' : '#000',
              '& fieldset': {
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--chef-orange)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--chef-orange)',
              },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel
            sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
              '&.Mui-focused': { color: 'var(--chef-orange)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Sort fontSize="small" /> Sort
            </Box>
          </InputLabel>
          <Select
            value={filters.sort}
            onChange={handleSortChange}
            label="Sort"
            sx={{
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 'var(--radius-md)',
              color: mode === 'dark' ? 'white' : '#000',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--chef-orange)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--chef-orange)',
              },
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Filter Chips */}
      <FilterGroup
        label="Cuisine"
        options={CUISINE_OPTIONS}
        selected={filters.cuisines}
        onToggle={(v) => toggleFilter('cuisines', v)}
        color="var(--chef-orange)"
      />
      <FilterGroup
        label="Cook Time"
        options={TIME_OPTIONS}
        selected={filters.times}
        onToggle={(v) => toggleFilter('times', v)}
        color="var(--basil-green)"
      />
      <FilterGroup
        label="Difficulty"
        options={DIFFICULTY_OPTIONS}
        selected={filters.difficulties}
        onToggle={(v) => toggleFilter('difficulties', v)}
        color="var(--plum-wine)"
      />
      <FilterGroup
        label="Dietary"
        options={DIETARY_OPTIONS}
        selected={filters.dietary}
        onToggle={(v) => toggleFilter('dietary', v)}
        color="var(--honey-gold)"
      />

      {/* Active filter count */}
      {activeFilterCount > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Chip
            label={`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
            size="small"
            onDelete={() =>
              onFiltersChange({
                search: '',
                cuisines: [],
                times: [],
                difficulties: [],
                dietary: [],
                sort: 'popular',
              })
            }
            sx={{
              bgcolor: 'rgba(255, 107, 53, 0.15)',
              color: 'var(--chef-orange)',
              fontWeight: 'bold',
              '& .MuiChip-deleteIcon': {
                color: 'var(--chef-orange)',
                '&:hover': { color: 'var(--error)' },
              },
            }}
          />
        </Box>
      )}
    </GlassCard>
  );
};

export default RecipeFilters;
