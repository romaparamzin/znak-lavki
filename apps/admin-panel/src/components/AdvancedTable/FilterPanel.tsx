import { useState } from 'react';
import { FilterConfig, FilterPreset } from '../../types/table.types';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  Collapse,
} from '@mui/material';
import {
  FilterList,
  Clear,
  Save,
  ExpandMore,
  ExpandLess,
  BookmarkBorder,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

interface FilterPanelProps {
  filters: FilterConfig[];
  onFilterChange: (filters: FilterConfig[]) => void;
  onClearFilters: () => void;
  filterPresets?: FilterPreset[];
  onSavePreset?: (name: string, filters: FilterConfig[]) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  filterPresets = [],
  onSavePreset,
  onLoadPreset,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [presetMenuAnchor, setPresetMenuAnchor] = useState<null | HTMLElement>(null);
  const [savePresetName, setSavePresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Filter fields
  const [markCodeFilter, setMarkCodeFilter] = useState('');
  const [gtinFilter, setGtinFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFromFilter, setDateFromFilter] = useState<Date | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Date | null>(null);

  const statusOptions = [
    { value: 'active', label: 'Активна' },
    { value: 'blocked', label: 'Заблокирована' },
    { value: 'used', label: 'Использована' },
    { value: 'expired', label: 'Просрочена' },
  ];

  const handleApplyFilters = () => {
    const newFilters: FilterConfig[] = [];

    if (markCodeFilter) {
      newFilters.push({
        field: 'markCode',
        operator: 'contains',
        value: markCodeFilter,
      });
    }

    if (gtinFilter) {
      newFilters.push({
        field: 'gtin',
        operator: 'eq',
        value: gtinFilter,
      });
    }

    if (statusFilter.length > 0) {
      newFilters.push({
        field: 'status',
        operator: 'in',
        value: statusFilter,
      });
    }

    if (dateFromFilter || dateToFilter) {
      newFilters.push({
        field: 'createdAt',
        operator: 'between',
        value: [dateFromFilter, dateToFilter],
      });
    }

    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    setMarkCodeFilter('');
    setGtinFilter('');
    setStatusFilter([]);
    setDateFromFilter(null);
    setDateToFilter(null);
    onClearFilters();
  };

  const handleSavePreset = () => {
    if (savePresetName && onSavePreset) {
      onSavePreset(savePresetName, filters);
      setSavePresetName('');
      setShowSavePreset(false);
    }
  };

  const activeFiltersCount = filters.length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Paper
        sx={{
          p: 2,
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterList />
            <Box sx={{ fontWeight: 600 }}>Фильтры</Box>
            {activeFiltersCount > 0 && (
              <Chip label={`${activeFiltersCount} активных`} size="small" color="primary" />
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            {filterPresets.length > 0 && (
              <Tooltip title="Сохранённые фильтры">
                <IconButton size="small" onClick={(e) => setPresetMenuAnchor(e.currentTarget)}>
                  <BookmarkBorder />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={expanded ? 'Свернуть' : 'Развернуть'}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={2} mt={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <TextField
                label="Код маркировки"
                value={markCodeFilter}
                onChange={(e) => setMarkCodeFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                placeholder="Поиск по коду..."
              />

              <TextField
                label="GTIN"
                value={gtinFilter}
                onChange={(e) => setGtinFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                placeholder="04600..."
              />

              <Autocomplete
                multiple
                options={statusOptions}
                getOptionLabel={(option) => option.label}
                value={statusOptions.filter((opt) => statusFilter.includes(opt.value))}
                onChange={(_, newValue) => setStatusFilter(newValue.map((v) => v.value))}
                renderInput={(params) => <TextField {...params} label="Статус" size="small" />}
                sx={{ minWidth: 250 }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                      key={option.value}
                    />
                  ))
                }
              />

              <DatePicker
                label="Дата от"
                value={dateFromFilter}
                onChange={setDateFromFilter}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />

              <DatePicker
                label="Дата до"
                value={dateToFilter}
                onChange={setDateToFilter}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterList />}>
                Применить
              </Button>

              <Button variant="outlined" onClick={handleClearAll} startIcon={<Clear />}>
                Очистить всё
              </Button>

              {onSavePreset && (
                <Button
                  variant="outlined"
                  onClick={() => setShowSavePreset(!showSavePreset)}
                  startIcon={<Save />}
                  disabled={filters.length === 0}
                >
                  Сохранить пресет
                </Button>
              )}
            </Stack>

            {showSavePreset && (
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Название пресета"
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  size="small"
                  sx={{ width: 300 }}
                  autoFocus
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSavePreset}
                  disabled={!savePresetName}
                >
                  Сохранить
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setShowSavePreset(false);
                    setSavePresetName('');
                  }}
                >
                  Отмена
                </Button>
              </Stack>
            )}
          </Stack>
        </Collapse>

        {/* Presets Menu */}
        <Menu
          anchorEl={presetMenuAnchor}
          open={Boolean(presetMenuAnchor)}
          onClose={() => setPresetMenuAnchor(null)}
        >
          {filterPresets.map((preset) => (
            <MenuItem
              key={preset.id}
              onClick={() => {
                onLoadPreset?.(preset);
                setPresetMenuAnchor(null);
              }}
            >
              {preset.name}
              {preset.isDefault && <Chip label="По умолчанию" size="small" sx={{ ml: 1 }} />}
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </LocalizationProvider>
  );
}
