import { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import {
  Block,
  CheckCircle,
  Delete,
  FileDownload,
  MoreVert,
  SelectAll,
  Deselect,
  Edit,
} from '@mui/icons-material';
import { BulkAction } from '../../types/table.types';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  bulkActions?: BulkAction[];
  selectedIds: string[];
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  bulkActions = [],
  selectedIds,
}: BulkActionsToolbarProps) {
  const [moreActionsAnchor, setMoreActionsAnchor] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action?: BulkAction;
    message?: string;
  }>({ open: false });

  const handleCheckboxChange = () => {
    if (isAllSelected || selectedCount > 0) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleActionClick = async (action: BulkAction) => {
    setMoreActionsAnchor(null);

    if (action.requiresConfirmation) {
      setConfirmDialog({
        open: true,
        action,
        message:
          action.confirmMessage ||
          `Вы уверены, что хотите выполнить это действие для ${selectedCount} элементов?`,
      });
    } else {
      await action.onClick(selectedIds);
    }
  };

  const handleConfirm = async () => {
    if (confirmDialog.action) {
      await confirmDialog.action.onClick(selectedIds);
    }
    setConfirmDialog({ open: false });
  };

  const isCheckboxIndeterminate = selectedCount > 0 && !isAllSelected;

  if (selectedCount === 0) {
    return null;
  }

  // Primary actions (first 3)
  const primaryActions = bulkActions.slice(0, 3);
  // More actions (rest)
  const moreActions = bulkActions.slice(3);

  return (
    <>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
          color: 'white',
        }}
      >
        <Checkbox
          color="default"
          indeterminate={isCheckboxIndeterminate}
          checked={isAllSelected}
          onChange={handleCheckboxChange}
          sx={{ color: 'white' }}
        />

        <Typography sx={{ flex: '1 1 100%' }} variant="subtitle1" component="div">
          Выбрано: <strong>{selectedCount}</strong> из {totalCount}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {primaryActions.map((action) => (
            <Tooltip key={action.id} title={action.label}>
              <span>
                <IconButton
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled?.(selectedIds)}
                  sx={{ color: 'white' }}
                >
                  {action.icon}
                </IconButton>
              </span>
            </Tooltip>
          ))}

          {moreActions.length > 0 && (
            <Tooltip title="Больше действий">
              <IconButton
                onClick={(e) => setMoreActionsAnchor(e.currentTarget)}
                sx={{ color: 'white' }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Снять выделение">
            <IconButton onClick={onDeselectAll} sx={{ color: 'white' }}>
              <Deselect />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

      {/* More Actions Menu */}
      <Menu
        anchorEl={moreActionsAnchor}
        open={Boolean(moreActionsAnchor)}
        onClose={() => setMoreActionsAnchor(null)}
      >
        {moreActions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled?.(selectedIds)}
          >
            {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Подтверждение действия</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
          <Chip
            label={`Будет обработано: ${selectedCount} элементов`}
            color="primary"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })}>Отмена</Button>
          <Button onClick={handleConfirm} variant="contained" autoFocus>
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Predefined bulk actions for marks
export const defaultMarksBulkActions: BulkAction[] = [
  {
    id: 'block',
    label: 'Заблокировать',
    icon: <Block />,
    onClick: async (ids) => {
      console.log('Blocking marks:', ids);
      // API call here
    },
    requiresConfirmation: true,
    confirmMessage: 'Вы уверены, что хотите заблокировать выбранные марки?',
  },
  {
    id: 'activate',
    label: 'Активировать',
    icon: <CheckCircle />,
    onClick: async (ids) => {
      console.log('Activating marks:', ids);
      // API call here
    },
    requiresConfirmation: true,
  },
  {
    id: 'export',
    label: 'Экспортировать',
    icon: <FileDownload />,
    onClick: async (ids) => {
      console.log('Exporting marks:', ids);
      // Export logic here
    },
  },
  {
    id: 'edit',
    label: 'Редактировать',
    icon: <Edit />,
    onClick: async (ids) => {
      console.log('Editing marks:', ids);
    },
    disabled: (ids) => ids.length !== 1, // Only allow for single selection
  },
  {
    id: 'delete',
    label: 'Удалить',
    icon: <Delete />,
    onClick: async (ids) => {
      console.log('Deleting marks:', ids);
      // API call here
    },
    requiresConfirmation: true,
    confirmMessage: 'Внимание! Это действие необратимо. Удалить выбранные марки?',
  },
];
