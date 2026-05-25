// Actions
export { Button, ButtonLink } from './components/Button.js';
export type { ButtonProps, ButtonLinkProps } from './components/Button.js';

// Icons (Dashicons — WordPress's built-in icon font)
export { Dashicon } from './components/Dashicon.js';
export type { DashiconProps } from './components/Dashicon.js';

// Icons (SVG — modern WordPress direction per make.wordpress.org/design)
export { Icon } from './components/Icon.js';
export type { IconProps, IconName } from './components/Icon.js';

// Notice
export { Notice } from './components/Notice.js';
export type { NoticeProps, NoticeVariant } from './components/Notice.js';

// Forms
export {
  Input,
  Textarea,
  Select,
  FormTable,
  FormRow,
  Description,
  HelpTip,
  Toggle,
  Submit,
  ColorPicker,
  DatePicker
} from './components/Forms.js';
export type {
  InputProps,
  TextareaProps,
  SelectProps,
  FormTableProps,
  FormRowProps,
  DescriptionProps,
  HelpTipProps,
  ToggleProps,
  SubmitProps,
  ColorPickerProps,
  DatePickerProps
} from './components/Forms.js';

// Overlays
export { Modal, ConfirmDialog } from './components/Modal.js';
export type { ModalProps, ConfirmDialogProps, ModalSize } from './components/Modal.js';

export { DropdownMenu } from './components/DropdownMenu.js';
export type { DropdownMenuProps, DropdownMenuItem } from './components/DropdownMenu.js';

export { Tooltip } from './components/Tooltip.js';
export type { TooltipProps } from './components/Tooltip.js';

// Tabs (with panels — extends the NavTabs strip primitive)
export { Tabs } from './components/Tabs.js';
export type { TabsProps, TabItem } from './components/Tabs.js';

// Security
export { NonceField, CapabilityGate } from './components/Security.js';
export type {
  NonceFieldProps,
  CapabilityGateProps
} from './components/Security.js';

// Media
export { MediaButton } from './components/Media.js';
export type { MediaButtonProps, MediaAttachment } from './components/Media.js';

// Navigation
export { NavTabs, NavTab, Subsubsub } from './components/Navigation.js';
export type {
  NavTabsProps,
  NavTabProps,
  SubsubsubProps,
  SubsubsubItem
} from './components/Navigation.js';

// Layout
export {
  Wrap,
  PageHeader,
  TwoColumn,
  ScreenOptions,
  HelpTabs
} from './components/Layout.js';
export type {
  WrapProps,
  PageHeaderProps,
  TwoColumnProps,
  ScreenOptionsProps,
  HelpTabsProps,
  HelpTab
} from './components/Layout.js';

// Cards / Data display
export {
  Postbox,
  WelcomePanel,
  StatCard,
  ActivityItem
} from './components/Cards.js';
export type {
  PostboxProps,
  WelcomePanelProps,
  StatCardProps,
  ActivityItemProps
} from './components/Cards.js';

// Tables
export {
  ListTable,
  RowActions,
  BulkActions,
  SearchBox,
  Pagination,
  EmptyState
} from './components/Tables.js';
export type {
  ListTableProps,
  RowAction,
  RowActionsProps,
  BulkAction,
  BulkActionsProps,
  SearchBoxProps,
  PaginationProps,
  EmptyStateProps
} from './components/Tables.js';

// Feedback
export {
  StatusBadge,
  Spinner,
  Pointer,
  Skeleton
} from './components/Feedback.js';
export type {
  StatusVariant,
  StatusBadgeProps,
  SpinnerProps,
  PointerProps,
  SkeletonProps
} from './components/Feedback.js';
