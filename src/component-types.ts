/** Solid-native theme component types generated from MUI Material UI v9.5.0 declarations. */
import type { ComponentProps } from "@solidjs/web";
import type { CSSInterpolation, CSSObject } from "@emotion/serialize";
import type { ComponentConfig, Theme } from "./theme";
import type { AccordionProps } from "./Accordion";
import type { AccordionActionsProps } from "./AccordionActions";
import type { AccordionDetailsProps } from "./AccordionDetails";
import type { AccordionSummaryProps } from "./AccordionSummary";
import type { AlertProps } from "./Alert";
import type { default as AlertTitleComponent } from "./AlertTitle";
import type { AppBarProps } from "./AppBar";
import type { AutocompleteProps } from "./Autocomplete";
import type { AvatarProps } from "./Avatar";
import type { AvatarGroupProps } from "./AvatarGroup";
import type { BackdropProps } from "./Backdrop";
import type { BadgeProps } from "./Badge";
import type { BottomNavigationProps } from "./BottomNavigation";
import type { BottomNavigationActionProps } from "./BottomNavigationAction";
import type { BreadcrumbsProps } from "./Breadcrumbs";
import type { ButtonProps } from "./Button";
import type { ButtonBaseProps } from "./ButtonBase";
import type { ButtonGroupProps } from "./ButtonGroup";
import type { CardProps } from "./Card";
import type { CardActionAreaProps } from "./CardActionArea";
import type { CardActionsProps } from "./CardActions";
import type { default as CardContentComponent } from "./CardContent";
import type { CardHeaderProps } from "./CardHeader";
import type { CardMediaProps } from "./CardMedia";
import type { CheckboxProps } from "./Checkbox";
import type { ChipProps } from "./Chip";
import type { CircularProgressProps } from "./CircularProgress";
import type { CollapseProps } from "./Collapse";
import type { ContainerProps } from "./Container";
import type { CssBaselineProps } from "./CssBaseline";
import type { DialogProps } from "./Dialog";
import type { DialogActionsProps } from "./DialogActions";
import type { DialogContentProps } from "./DialogContent";
import type { DialogContentTextProps } from "./DialogContentText";
import type { DialogTitleProps } from "./DialogTitle";
import type { DividerProps } from "./Divider";
import type { DrawerProps } from "./Drawer";
import type { FabProps } from "./Fab";
import type { FilledInputProps } from "./FilledInput";
import type { FormControlProps } from "./FormControl";
import type { FormControlLabelProps } from "./FormControlLabel";
import type { FormGroupProps } from "./FormGroup";
import type { FormHelperTextProps } from "./FormHelperText";
import type { FormLabelProps } from "./FormLabel";
import type { GridProps } from "./Grid";
import type { IconProps } from "./Icon";
import type { IconButtonProps } from "./IconButton";
import type { ImageListProps } from "./ImageList";
import type { ImageListItemProps } from "./ImageListItem";
import type { ImageListItemBarProps } from "./ImageListItemBar";
import type { InputProps } from "./Input";
import type { InputAdornmentProps } from "./InputAdornment";
import type { InputBaseProps } from "./InputBase";
import type { InputLabelProps } from "./InputLabel";
import type { LinearProgressProps } from "./LinearProgress";
import type { LinkProps } from "./Link";
import type { ListProps } from "./List";
import type { ListItemProps } from "./ListItem";
import type { default as ListItemAvatarComponent } from "./ListItemAvatar";
import type { ListItemButtonProps } from "./ListItemButton";
import type { default as ListItemIconComponent } from "./ListItemIcon";
import type { default as ListItemSecondaryActionComponent } from "./ListItemSecondaryAction";
import type { ListItemTextProps } from "./ListItemText";
import type { ListSubheaderProps } from "./ListSubheader";
import type { MenuProps } from "./Menu";
import type { MenuItemProps } from "./MenuItem";
import type { MenuListProps } from "./MenuList";
import type { MobileStepperProps } from "./MobileStepper";
import type { ModalProps } from "./Modal";
import type { NativeSelectProps } from "./NativeSelect";
import type { OutlinedInputProps } from "./OutlinedInput";
import type { PaginationProps } from "./Pagination";
import type { PaginationItemProps } from "./PaginationItem";
import type { PaperProps } from "./Paper";
import type { PopoverProps } from "./Popover";
import type { PopperProps } from "./Popper";
import type { RadioProps } from "./Radio";
import type { RadioGroupProps } from "./RadioGroup";
import type { RatingProps } from "./Rating";
import type { ScopedCssBaselineProps } from "./ScopedCssBaseline";
import type { SelectProps } from "./Select";
import type { SkeletonProps } from "./Skeleton";
import type { SliderProps } from "./Slider";
import type { SnackbarProps } from "./Snackbar";
import type { SnackbarContentProps } from "./SnackbarContent";
import type { SpeedDialProps } from "./SpeedDial";
import type { SpeedDialActionProps } from "./SpeedDialAction";
import type { SpeedDialIconProps } from "./SpeedDialIcon";
import type { StackProps } from "./Stack";
import type { StepProps } from "./Step";
import type { StepButtonProps } from "./StepButton";
import type { StepConnectorProps } from "./StepConnector";
import type { StepContentProps } from "./StepContent";
import type { StepIconProps } from "./StepIcon";
import type { StepLabelProps } from "./StepLabel";
import type { StepperProps } from "./Stepper";
import type { SvgIconProps } from "./SvgIcon";
import type { SwipeableDrawerProps } from "./SwipeableDrawer";
import type { SwitchProps } from "./Switch";
import type { TabProps } from "./Tab";
import type { TabScrollButtonProps } from "./TabScrollButton";
import type { TableProps } from "./Table";
import type { default as TableBodyComponent } from "./TableBody";
import type { TableCellProps } from "./TableCell";
import type { default as TableContainerComponent } from "./TableContainer";
import type { default as TableFooterComponent } from "./TableFooter";
import type { default as TableHeadComponent } from "./TableHead";
import type { TablePaginationProps } from "./TablePagination";
import type { TablePaginationActionsProps } from "./TablePaginationActions";
import type { TableRowProps } from "./TableRow";
import type { TableSortLabelProps } from "./TableSortLabel";
import type { TabsProps } from "./Tabs";
import type { TextFieldProps } from "./TextField";
import type { ToggleButtonProps } from "./ToggleButton";
import type { ToggleButtonGroupProps } from "./ToggleButtonGroup";
import type { ToolbarProps } from "./Toolbar";
import type { TooltipProps } from "./Tooltip";
import type { TypographyProps } from "./Typography";
import type {
  AccordionActionsClassKey,
  AccordionClassKey,
  AccordionDetailsClassKey,
  AccordionSummaryClassKey,
  AlertClassKey,
  AlertTitleClassKey,
  AppBarClassKey,
  AutocompleteClassKey,
  AvatarClassKey,
  AvatarGroupClassKey,
  BackdropClassKey,
  BadgeClassKey,
  BottomNavigationActionClassKey,
  BottomNavigationClassKey,
  BreadcrumbsClassKey,
  ButtonBaseClassKey,
  ButtonClassKey,
  ButtonGroupClassKey,
  CardActionAreaClassKey,
  CardActionsClassKey,
  CardClassKey,
  CardContentClassKey,
  CardHeaderClassKey,
  CardMediaClassKey,
  CheckboxClassKey,
  ChipClassKey,
  CircularProgressClassKey,
  CollapseClassKey,
  ContainerClassKey,
  DialogActionsClassKey,
  DialogClassKey,
  DialogContentClassKey,
  DialogContentTextClassKey,
  DialogTitleClassKey,
  DividerClassKey,
  DrawerClassKey,
  FabClassKey,
  FilledInputClassKey,
  FormControlClassKey,
  FormControlLabelClassKey,
  FormGroupClassKey,
  FormHelperTextClassKey,
  FormLabelClassKey,
  GridClassKey,
  IconButtonClassKey,
  IconClassKey,
  ImageListClassKey,
  ImageListItemBarClassKey,
  ImageListItemClassKey,
  InputAdornmentClassKey,
  InputBaseClassKey,
  InputClassKey,
  InputLabelClassKey,
  LinearProgressClassKey,
  LinkClassKey,
  ListClassKey,
  ListItemAvatarClassKey,
  ListItemButtonClassKey,
  ListItemClassKey,
  ListItemIconClassKey,
  ListItemSecondaryActionClassKey,
  ListItemTextClassKey,
  ListSubheaderClassKey,
  MenuClassKey,
  MenuItemClassKey,
  MobileStepperClassKey,
  ModalClassKey,
  NativeSelectClassKey,
  OutlinedInputClassKey,
  PaginationClassKey,
  PaginationItemClassKey,
  PaperClassKey,
  PopoverClassKey,
  PopperClassKey,
  RadioClassKey,
  RadioGroupClassKey,
  RatingClassKey,
  ScopedCssBaselineClassKey,
  SelectClassKey,
  SkeletonClassKey,
  SliderClassKey,
  SnackbarClassKey,
  SnackbarContentClassKey,
  SpeedDialActionClassKey,
  SpeedDialClassKey,
  SpeedDialIconClassKey,
  StackClassKey,
  StepButtonClassKey,
  StepClassKey,
  StepConnectorClassKey,
  StepContentClassKey,
  StepIconClassKey,
  StepLabelClassKey,
  StepperClassKey,
  SvgIconClassKey,
  SwitchClassKey,
  TabClassKey,
  TabScrollButtonClassKey,
  TableBodyClassKey,
  TableCellClassKey,
  TableClassKey,
  TableContainerClassKey,
  TableFooterClassKey,
  TableHeadClassKey,
  TablePaginationActionsClassKey,
  TablePaginationClassKey,
  TableRowClassKey,
  TableSortLabelClassKey,
  TabsClassKey,
  TextFieldClassKey,
  ToggleButtonClassKey,
  ToggleButtonGroupClassKey,
  ToolbarClassKey,
  TooltipClassKey,
  TypographyClassKey,
} from "./utility-classes";

export interface ComponentsPropsList {
  MuiAlert: AlertProps;
  MuiAlertTitle: ComponentProps<typeof AlertTitleComponent>;
  MuiAppBar: AppBarProps;
  MuiAutocomplete: AutocompleteProps<unknown>;
  MuiAvatar: AvatarProps;
  MuiAvatarGroup: AvatarGroupProps;
  MuiBackdrop: BackdropProps;
  MuiBadge: BadgeProps;
  MuiBottomNavigation: BottomNavigationProps;
  MuiBottomNavigationAction: BottomNavigationActionProps;
  MuiBreadcrumbs: BreadcrumbsProps;
  MuiButton: ButtonProps;
  MuiButtonBase: ButtonBaseProps;
  MuiButtonGroup: ButtonGroupProps;
  MuiCard: CardProps;
  MuiCardActionArea: CardActionAreaProps;
  MuiCardActions: CardActionsProps;
  MuiCardContent: ComponentProps<typeof CardContentComponent>;
  MuiCardHeader: CardHeaderProps;
  MuiCardMedia: CardMediaProps;
  MuiCheckbox: CheckboxProps;
  MuiChip: ChipProps;
  MuiCircularProgress: CircularProgressProps;
  MuiCollapse: CollapseProps;
  MuiContainer: ContainerProps;
  MuiCssBaseline: CssBaselineProps;
  MuiDialog: DialogProps;
  MuiDialogActions: DialogActionsProps;
  MuiDialogContent: DialogContentProps;
  MuiDialogContentText: DialogContentTextProps;
  MuiDialogTitle: DialogTitleProps;
  MuiDivider: DividerProps;
  MuiDrawer: DrawerProps;
  MuiAccordion: AccordionProps;
  MuiAccordionActions: AccordionActionsProps;
  MuiAccordionDetails: AccordionDetailsProps;
  MuiAccordionSummary: AccordionSummaryProps;
  MuiFab: FabProps;
  MuiFilledInput: FilledInputProps;
  MuiFormControl: FormControlProps;
  MuiFormControlLabel: FormControlLabelProps;
  MuiFormGroup: FormGroupProps;
  MuiFormHelperText: FormHelperTextProps;
  MuiFormLabel: FormLabelProps;
  MuiGrid: GridProps;
  MuiImageList: ImageListProps;
  MuiImageListItem: ImageListItemProps;
  MuiImageListItemBar: ImageListItemBarProps;
  MuiIcon: IconProps;
  MuiIconButton: IconButtonProps;
  MuiInput: InputProps;
  MuiInputAdornment: InputAdornmentProps;
  MuiInputBase: InputBaseProps;
  MuiInputLabel: InputLabelProps;
  MuiLinearProgress: LinearProgressProps;
  MuiLink: LinkProps;
  MuiList: ListProps;
  MuiListItem: ListItemProps;
  MuiListItemButton: ListItemButtonProps;
  MuiListItemAvatar: ComponentProps<typeof ListItemAvatarComponent>;
  MuiListItemIcon: ComponentProps<typeof ListItemIconComponent>;
  MuiListItemSecondaryAction: ComponentProps<
    typeof ListItemSecondaryActionComponent
  >;
  MuiListItemText: ListItemTextProps;
  MuiListSubheader: ListSubheaderProps;
  MuiMenu: MenuProps;
  MuiMenuItem: MenuItemProps;
  MuiMenuList: MenuListProps;
  MuiMobileStepper: MobileStepperProps;
  MuiModal: ModalProps;
  MuiNativeSelect: NativeSelectProps;
  MuiOutlinedInput: OutlinedInputProps;
  MuiPagination: PaginationProps;
  MuiPaginationItem: PaginationItemProps;
  MuiPaper: PaperProps;
  MuiPopper: PopperProps;
  MuiPopover: PopoverProps;
  MuiRadio: RadioProps;
  MuiRadioGroup: RadioGroupProps;
  MuiRating: RatingProps;
  MuiScopedCssBaseline: ScopedCssBaselineProps;
  MuiSelect: SelectProps;
  MuiSkeleton: SkeletonProps;
  MuiSlider: SliderProps;
  MuiSnackbar: SnackbarProps;
  MuiSnackbarContent: SnackbarContentProps;
  MuiSpeedDial: SpeedDialProps;
  MuiSpeedDialAction: SpeedDialActionProps;
  MuiSpeedDialIcon: SpeedDialIconProps;
  MuiStack: StackProps;
  MuiStep: StepProps;
  MuiStepButton: StepButtonProps;
  MuiStepConnector: StepConnectorProps;
  MuiStepContent: StepContentProps;
  MuiStepIcon: StepIconProps;
  MuiStepLabel: StepLabelProps;
  MuiStepper: StepperProps;
  MuiSvgIcon: SvgIconProps;
  MuiSwipeableDrawer: SwipeableDrawerProps;
  MuiSwitch: SwitchProps;
  MuiTab: TabProps;
  MuiTable: TableProps;
  MuiTableBody: ComponentProps<typeof TableBodyComponent>;
  MuiTableCell: TableCellProps;
  MuiTableContainer: ComponentProps<typeof TableContainerComponent>;
  MuiTableFooter: ComponentProps<typeof TableFooterComponent>;
  MuiTableHead: ComponentProps<typeof TableHeadComponent>;
  MuiTablePagination: TablePaginationProps;
  MuiTablePaginationActions: TablePaginationActionsProps;
  MuiTableRow: TableRowProps;
  MuiTableSortLabel: TableSortLabelProps;
  MuiTabs: TabsProps;
  MuiTabScrollButton: TabScrollButtonProps;
  MuiTextField: TextFieldProps;
  MuiToggleButton: ToggleButtonProps;
  MuiToggleButtonGroup: ToggleButtonGroupProps;
  MuiToolbar: ToolbarProps;
  MuiTooltip: TooltipProps;
  MuiTypography: TypographyProps;
  MuiUseMediaQuery: NonNullable<
    Parameters<typeof import("./theme").useMediaQuery>[1]
  >;
}

export type ComponentsProps = {
  [Name in keyof ComponentsPropsList]?: Partial<ComponentsPropsList[Name]>;
};

export interface ComponentNameToClassKey {
  MuiAccordion: AccordionClassKey;
  MuiAccordionActions: AccordionActionsClassKey;
  MuiAccordionDetails: AccordionDetailsClassKey;
  MuiAccordionSummary: AccordionSummaryClassKey;
  MuiAlert: AlertClassKey;
  MuiAlertTitle: AlertTitleClassKey;
  MuiAppBar: AppBarClassKey;
  MuiAutocomplete: AutocompleteClassKey;
  MuiAvatar: AvatarClassKey;
  MuiAvatarGroup: AvatarGroupClassKey;
  MuiBackdrop: BackdropClassKey;
  MuiBadge: BadgeClassKey;
  MuiBottomNavigation: BottomNavigationClassKey;
  MuiBottomNavigationAction: BottomNavigationActionClassKey;
  MuiBreadcrumbs: BreadcrumbsClassKey;
  MuiButton: ButtonClassKey;
  MuiButtonBase: ButtonBaseClassKey;
  MuiButtonGroup: ButtonGroupClassKey;
  MuiCard: CardClassKey;
  MuiCardActionArea: CardActionAreaClassKey;
  MuiCardActions: CardActionsClassKey;
  MuiCardContent: CardContentClassKey;
  MuiCardHeader: CardHeaderClassKey;
  MuiCardMedia: CardMediaClassKey;
  MuiCheckbox: CheckboxClassKey;
  MuiChip: ChipClassKey;
  MuiCircularProgress: CircularProgressClassKey;
  MuiCollapse: CollapseClassKey;
  MuiContainer: ContainerClassKey;
  MuiDialog: DialogClassKey;
  MuiDialogActions: DialogActionsClassKey;
  MuiDialogContent: DialogContentClassKey;
  MuiDialogContentText: DialogContentTextClassKey;
  MuiDialogTitle: DialogTitleClassKey;
  MuiDivider: DividerClassKey;
  MuiDrawer: DrawerClassKey;
  MuiFab: FabClassKey;
  MuiFilledInput: FilledInputClassKey;
  MuiFormControl: FormControlClassKey;
  MuiFormControlLabel: FormControlLabelClassKey;
  MuiFormGroup: FormGroupClassKey;
  MuiFormHelperText: FormHelperTextClassKey;
  MuiFormLabel: FormLabelClassKey;
  MuiGrid: GridClassKey;
  MuiIcon: IconClassKey;
  MuiIconButton: IconButtonClassKey;
  MuiImageList: ImageListClassKey;
  MuiImageListItem: ImageListItemClassKey;
  MuiImageListItemBar: ImageListItemBarClassKey;
  MuiInput: InputClassKey;
  MuiInputAdornment: InputAdornmentClassKey;
  MuiInputBase: InputBaseClassKey;
  MuiInputLabel: InputLabelClassKey;
  MuiLinearProgress: LinearProgressClassKey;
  MuiLink: LinkClassKey;
  MuiList: ListClassKey;
  MuiListItem: ListItemClassKey;
  MuiListItemAvatar: ListItemAvatarClassKey;
  MuiListItemButton: ListItemButtonClassKey;
  MuiListItemIcon: ListItemIconClassKey;
  MuiListItemSecondaryAction: ListItemSecondaryActionClassKey;
  MuiListItemText: ListItemTextClassKey;
  MuiListSubheader: ListSubheaderClassKey;
  MuiMenu: MenuClassKey;
  MuiMenuItem: MenuItemClassKey;
  MuiMobileStepper: MobileStepperClassKey;
  MuiModal: ModalClassKey;
  MuiNativeSelect: NativeSelectClassKey;
  MuiOutlinedInput: OutlinedInputClassKey;
  MuiPagination: PaginationClassKey;
  MuiPaginationItem: PaginationItemClassKey;
  MuiPaper: PaperClassKey;
  MuiPopover: PopoverClassKey;
  MuiPopper: PopperClassKey;
  MuiRadio: RadioClassKey;
  MuiRadioGroup: RadioGroupClassKey;
  MuiRating: RatingClassKey;
  MuiScopedCssBaseline: ScopedCssBaselineClassKey;
  MuiSelect: SelectClassKey;
  MuiSkeleton: SkeletonClassKey;
  MuiSlider: SliderClassKey;
  MuiSnackbar: SnackbarClassKey;
  MuiSnackbarContent: SnackbarContentClassKey;
  MuiSpeedDial: SpeedDialClassKey;
  MuiSpeedDialAction: SpeedDialActionClassKey;
  MuiSpeedDialIcon: SpeedDialIconClassKey;
  MuiStack: StackClassKey;
  MuiStep: StepClassKey;
  MuiStepButton: StepButtonClassKey;
  MuiStepConnector: StepConnectorClassKey;
  MuiStepContent: StepContentClassKey;
  MuiStepIcon: StepIconClassKey;
  MuiStepLabel: StepLabelClassKey;
  MuiStepper: StepperClassKey;
  MuiSvgIcon: SvgIconClassKey;
  MuiSwitch: SwitchClassKey;
  MuiTab: TabClassKey;
  MuiTabScrollButton: TabScrollButtonClassKey;
  MuiTable: TableClassKey;
  MuiTableBody: TableBodyClassKey;
  MuiTableCell: TableCellClassKey;
  MuiTableContainer: TableContainerClassKey;
  MuiTableFooter: TableFooterClassKey;
  MuiTableHead: TableHeadClassKey;
  MuiTablePagination: TablePaginationClassKey;
  MuiTablePaginationActions: TablePaginationActionsClassKey;
  MuiTableRow: TableRowClassKey;
  MuiTableSortLabel: TableSortLabelClassKey;
  MuiTabs: TabsClassKey;
  MuiTextField: TextFieldClassKey;
  MuiToggleButton: ToggleButtonClassKey;
  MuiToggleButtonGroup: ToggleButtonGroupClassKey;
  MuiToolbar: ToolbarClassKey;
  MuiTooltip: TooltipClassKey;
  MuiTypography: TypographyClassKey;
}

type CssBaselineStyleOverrides<TTheme> =
  CSSObject | string | ((theme: TTheme) => CSSInterpolation);
type ComponentConfigFor<
  Name extends keyof ComponentsPropsList,
  TTheme,
> = Name extends "MuiCssBaseline"
  ? Omit<
      ComponentConfig<ComponentsPropsList[Name], TTheme>,
      "styleOverrides"
    > & { styleOverrides?: CssBaselineStyleOverrides<TTheme> }
  : ComponentConfig<
      ComponentsPropsList[Name],
      TTheme,
      Name extends keyof ComponentNameToClassKey
        ? ComponentNameToClassKey[Name]
        : string
    >;
export type ComponentsOverrides<TTheme = Theme> = {
  [Name in keyof ComponentsPropsList]?: ComponentConfigFor<
    Name,
    TTheme
  >["styleOverrides"];
};
export type ComponentsVariants<TTheme = Theme> = {
  [Name in keyof ComponentsPropsList]?: ComponentConfigFor<
    Name,
    TTheme
  >["variants"];
};
export type Components<TTheme = Theme> = {
  [Name in keyof ComponentsPropsList]?: ComponentConfigFor<Name, TTheme>;
} & Record<string, unknown>;
