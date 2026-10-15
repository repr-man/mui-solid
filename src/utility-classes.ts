/**
 * Utility classes based on MUI Material UI v9.5.0.
 * Global state slots use the shared Mui-* names from @mui/utils.
 */
import { unstable_ClassNameGenerator } from './class-name-generator';
export { unstable_ClassNameGenerator } from './class-name-generator';

export const globalStateClasses = {
  active: 'active', checked: 'checked', completed: 'completed', disabled: 'disabled',
  error: 'error', expanded: 'expanded', focused: 'focused', focusVisible: 'focusVisible',
  open: 'open', readOnly: 'readOnly', required: 'required', selected: 'selected',
} as const;
export type GlobalStateClassKey = keyof typeof globalStateClasses;

export function unstable_isGlobalState(slot: string): slot is GlobalStateClassKey {
  return Object.prototype.hasOwnProperty.call(globalStateClasses, slot);
}

export function generateUtilityClass(componentName: string, slot: string, globalStatePrefix = 'Mui'): string {
  const globalState = globalStateClasses[slot as GlobalStateClassKey];
  return globalState ? `${globalStatePrefix}-${globalState}` : `${unstable_ClassNameGenerator.generate(componentName)}-${slot}`;
}

export function generateUtilityClasses<const Slots extends readonly string[]>(componentName: string, slots: Slots): { [K in Slots[number]]: string } {
  const result = {} as { [K in Slots[number]]: string };
  for (const slot of slots) result[slot as Slots[number]] = generateUtilityClass(componentName, slot);
  return result;
}

export function unstable_composeClasses<Slots extends Record<string, readonly (string | false | null | undefined)[]>>(
  slots: Slots, getUtilityClass: (slot: string) => string, classes?: Partial<Record<string, string>>
): { [K in keyof Slots]: string } {
  const output = {} as { [K in keyof Slots]: string };
  for (const slotName in slots) {
    const composed: string[] = [];
    for (const slot of slots[slotName]) {
      if (!slot) continue;
      composed.push(getUtilityClass(slot));
      if (classes?.[slot]) composed.push(classes[slot]!);
    }
    output[slotName] = composed.join(' ');
  }
  return output;
}

export function getAccordionUtilityClass(slot: string): string { return generateUtilityClass('MuiAccordion', slot); }
export const accordionClasses = /* @__PURE__ */ generateUtilityClasses('MuiAccordion', ['root', 'heading', 'rounded', 'expanded', 'disabled', 'gutters', 'region'] as const);
export type AccordionClasses = typeof accordionClasses;
export type AccordionClassKey = keyof AccordionClasses;

export function getAccordionActionsUtilityClass(slot: string): string { return generateUtilityClass('MuiAccordionActions', slot); }
export const accordionActionsClasses = /* @__PURE__ */ generateUtilityClasses('MuiAccordionActions', ['root', 'spacing'] as const);
export type AccordionActionsClasses = typeof accordionActionsClasses;
export type AccordionActionsClassKey = keyof AccordionActionsClasses;

export function getAccordionDetailsUtilityClass(slot: string): string { return generateUtilityClass('MuiAccordionDetails', slot); }
export const accordionDetailsClasses = /* @__PURE__ */ generateUtilityClasses('MuiAccordionDetails', ['root'] as const);
export type AccordionDetailsClasses = typeof accordionDetailsClasses;
export type AccordionDetailsClassKey = keyof AccordionDetailsClasses;

export function getAccordionSummaryUtilityClass(slot: string): string { return generateUtilityClass('MuiAccordionSummary', slot); }
export const accordionSummaryClasses = /* @__PURE__ */ generateUtilityClasses('MuiAccordionSummary', ['root', 'expanded', 'focusVisible', 'disabled', 'gutters', 'content', 'expandIconWrapper'] as const);
export type AccordionSummaryClasses = typeof accordionSummaryClasses;
export type AccordionSummaryClassKey = keyof AccordionSummaryClasses;

export function getAlertUtilityClass(slot: string): string { return generateUtilityClass('MuiAlert', slot); }
export const alertClasses = /* @__PURE__ */ generateUtilityClasses('MuiAlert', ['root', 'action', 'icon', 'message', 'filled', 'colorSuccess', 'colorInfo', 'colorWarning', 'colorError', 'outlined', 'standard'] as const);
export type AlertClasses = typeof alertClasses;
export type AlertClassKey = keyof AlertClasses;

export function getAlertTitleUtilityClass(slot: string): string { return generateUtilityClass('MuiAlertTitle', slot); }
export const alertTitleClasses = /* @__PURE__ */ generateUtilityClasses('MuiAlertTitle', ['root'] as const);
export type AlertTitleClasses = typeof alertTitleClasses;
export type AlertTitleClassKey = keyof AlertTitleClasses;

export function getAppBarUtilityClass(slot: string): string { return generateUtilityClass('MuiAppBar', slot); }
export const appBarClasses = /* @__PURE__ */ generateUtilityClasses('MuiAppBar', ['root', 'positionFixed', 'positionAbsolute', 'positionSticky', 'positionStatic', 'positionRelative', 'colorDefault', 'colorPrimary', 'colorSecondary', 'colorInherit', 'colorTransparent', 'colorError', 'colorInfo', 'colorSuccess', 'colorWarning'] as const);
export type AppBarClasses = typeof appBarClasses;
export type AppBarClassKey = keyof AppBarClasses;

export function getAutocompleteUtilityClass(slot: string): string { return generateUtilityClass('MuiAutocomplete', slot); }
export const autocompleteClasses = /* @__PURE__ */ generateUtilityClasses('MuiAutocomplete', ['root', 'expanded', 'fullWidth', 'focused', 'focusVisible', 'tag', 'tagSizeSmall', 'tagSizeMedium', 'hasPopupIcon', 'hasClearIcon', 'inputRoot', 'input', 'inputFocused', 'endAdornment', 'clearIndicator', 'popupIndicator', 'popupIndicatorOpen', 'popper', 'popperDisablePortal', 'paper', 'listbox', 'loading', 'noOptions', 'status', 'option', 'groupLabel', 'groupUl'] as const);
export type AutocompleteClasses = typeof autocompleteClasses;
export type AutocompleteClassKey = keyof AutocompleteClasses;

export function getAvatarUtilityClass(slot: string): string { return generateUtilityClass('MuiAvatar', slot); }
export const avatarClasses = /* @__PURE__ */ generateUtilityClasses('MuiAvatar', ['root', 'colorDefault', 'circular', 'rounded', 'square', 'img', 'fallback'] as const);
export type AvatarClasses = typeof avatarClasses;
export type AvatarClassKey = keyof AvatarClasses;

export function getAvatarGroupUtilityClass(slot: string): string { return generateUtilityClass('MuiAvatarGroup', slot); }
export const avatarGroupClasses = /* @__PURE__ */ generateUtilityClasses('MuiAvatarGroup', ['root', 'avatar'] as const);
export type AvatarGroupClasses = typeof avatarGroupClasses;
export type AvatarGroupClassKey = keyof AvatarGroupClasses;

export function getBackdropUtilityClass(slot: string): string { return generateUtilityClass('MuiBackdrop', slot); }
export const backdropClasses = /* @__PURE__ */ generateUtilityClasses('MuiBackdrop', ['root', 'invisible'] as const);
export type BackdropClasses = typeof backdropClasses;
export type BackdropClassKey = keyof BackdropClasses;

export function getBadgeUtilityClass(slot: string): string { return generateUtilityClass('MuiBadge', slot); }
export const badgeClasses = /* @__PURE__ */ generateUtilityClasses('MuiBadge', ['root', 'badge', 'dot', 'standard', 'anchorOriginTopRight', 'anchorOriginBottomRight', 'anchorOriginTopLeft', 'anchorOriginBottomLeft', 'invisible', 'colorError', 'colorInfo', 'colorPrimary', 'colorSecondary', 'colorSuccess', 'colorWarning', 'overlapRectangular', 'overlapCircular', 'anchorOriginTopLeftCircular', 'anchorOriginTopLeftRectangular', 'anchorOriginTopRightCircular', 'anchorOriginTopRightRectangular', 'anchorOriginBottomLeftCircular', 'anchorOriginBottomLeftRectangular', 'anchorOriginBottomRightCircular', 'anchorOriginBottomRightRectangular'] as const);
export type BadgeClasses = typeof badgeClasses;
export type BadgeClassKey = keyof BadgeClasses;

export function getBottomNavigationUtilityClass(slot: string): string { return generateUtilityClass('MuiBottomNavigation', slot); }
export const bottomNavigationClasses = /* @__PURE__ */ generateUtilityClasses('MuiBottomNavigation', ['root'] as const);
export type BottomNavigationClasses = typeof bottomNavigationClasses;
export type BottomNavigationClassKey = keyof BottomNavigationClasses;

export function getBottomNavigationActionUtilityClass(slot: string): string { return generateUtilityClass('MuiBottomNavigationAction', slot); }
export const bottomNavigationActionClasses = /* @__PURE__ */ generateUtilityClasses('MuiBottomNavigationAction', ['root', 'iconOnly', 'selected', 'label'] as const);
export type BottomNavigationActionClasses = typeof bottomNavigationActionClasses;
export type BottomNavigationActionClassKey = keyof BottomNavigationActionClasses;

export const boxClasses = /* @__PURE__ */ generateUtilityClasses('MuiBox', ['root'] as const);
export type BoxClasses = typeof boxClasses;
export type BoxClassKey = keyof BoxClasses;

export function getBreadcrumbsUtilityClass(slot: string): string { return generateUtilityClass('MuiBreadcrumbs', slot); }
export const breadcrumbsClasses = /* @__PURE__ */ generateUtilityClasses('MuiBreadcrumbs', ['root', 'ol', 'li', 'separator'] as const);
export type BreadcrumbsClasses = typeof breadcrumbsClasses;
export type BreadcrumbsClassKey = keyof BreadcrumbsClasses;

export function getButtonUtilityClass(slot: string): string { return generateUtilityClass('MuiButton', slot); }
export const buttonClasses = /* @__PURE__ */ generateUtilityClasses('MuiButton', ['root', 'text', 'outlined', 'contained', 'disableElevation', 'focusVisible', 'disabled', 'colorInherit', 'colorPrimary', 'colorSecondary', 'colorSuccess', 'colorError', 'colorInfo', 'colorWarning', 'sizeMedium', 'sizeSmall', 'sizeLarge', 'fullWidth', 'startIcon', 'endIcon', 'icon', 'loading', 'loadingWrapper', 'loadingIconPlaceholder', 'loadingIndicator', 'loadingPositionCenter', 'loadingPositionStart', 'loadingPositionEnd'] as const);
export type ButtonClasses = typeof buttonClasses;
export type ButtonClassKey = keyof ButtonClasses;

export function getButtonBaseUtilityClass(slot: string): string { return generateUtilityClass('MuiButtonBase', slot); }
export const buttonBaseClasses = /* @__PURE__ */ generateUtilityClasses('MuiButtonBase', ['root', 'disabled', 'focusVisible'] as const);
export type ButtonBaseClasses = typeof buttonBaseClasses;
export type ButtonBaseClassKey = keyof ButtonBaseClasses;

export function getTouchRippleUtilityClass(slot: string): string { return generateUtilityClass('MuiTouchRipple', slot); }
export const touchRippleClasses = /* @__PURE__ */ generateUtilityClasses('MuiTouchRipple', ['root', 'ripple', 'rippleVisible', 'ripplePulsate', 'child', 'childLeaving', 'childPulsate'] as const);
export type TouchRippleClasses = typeof touchRippleClasses;
export type TouchRippleClassKey = keyof TouchRippleClasses;

export function getButtonGroupUtilityClass(slot: string): string { return generateUtilityClass('MuiButtonGroup', slot); }
export const buttonGroupClasses = /* @__PURE__ */ generateUtilityClasses('MuiButtonGroup', ['root', 'contained', 'outlined', 'text', 'disableElevation', 'disabled', 'firstButton', 'fullWidth', 'horizontal', 'vertical', 'colorPrimary', 'colorSecondary', 'grouped', 'lastButton', 'middleButton'] as const);
export type ButtonGroupClasses = typeof buttonGroupClasses;
export type ButtonGroupClassKey = keyof ButtonGroupClasses;

export function getCardUtilityClass(slot: string): string { return generateUtilityClass('MuiCard', slot); }
export const cardClasses = /* @__PURE__ */ generateUtilityClasses('MuiCard', ['root'] as const);
export type CardClasses = typeof cardClasses;
export type CardClassKey = keyof CardClasses;

export function getCardActionAreaUtilityClass(slot: string): string { return generateUtilityClass('MuiCardActionArea', slot); }
export const cardActionAreaClasses = /* @__PURE__ */ generateUtilityClasses('MuiCardActionArea', ['root', 'focusVisible', 'focusHighlight'] as const);
export type CardActionAreaClasses = typeof cardActionAreaClasses;
export type CardActionAreaClassKey = keyof CardActionAreaClasses;

export function getCardActionsUtilityClass(slot: string): string { return generateUtilityClass('MuiCardActions', slot); }
export const cardActionsClasses = /* @__PURE__ */ generateUtilityClasses('MuiCardActions', ['root', 'spacing'] as const);
export type CardActionsClasses = typeof cardActionsClasses;
export type CardActionsClassKey = keyof CardActionsClasses;

export function getCardContentUtilityClass(slot: string): string { return generateUtilityClass('MuiCardContent', slot); }
export const cardContentClasses = /* @__PURE__ */ generateUtilityClasses('MuiCardContent', ['root'] as const);
export type CardContentClasses = typeof cardContentClasses;
export type CardContentClassKey = keyof CardContentClasses;

export function getCardHeaderUtilityClass(slot: string): string { return generateUtilityClass('MuiCardHeader', slot); }
export const cardHeaderClasses = /* @__PURE__ */ generateUtilityClasses('MuiCardHeader', ['root', 'avatar', 'action', 'content', 'title', 'subheader'] as const);
export type CardHeaderClasses = typeof cardHeaderClasses;
export type CardHeaderClassKey = keyof CardHeaderClasses;

export function getCardMediaUtilityClass(slot: string): string { return generateUtilityClass('MuiCardMedia', slot); }
export const cardMediaClasses = /* @__PURE__ */ generateUtilityClasses('MuiCardMedia', ['root', 'media', 'img'] as const);
export type CardMediaClasses = typeof cardMediaClasses;
export type CardMediaClassKey = keyof CardMediaClasses;

export function getCheckboxUtilityClass(slot: string): string { return generateUtilityClass('MuiCheckbox', slot); }
export const checkboxClasses = /* @__PURE__ */ generateUtilityClasses('MuiCheckbox', ['root', 'checked', 'disabled', 'indeterminate', 'colorPrimary', 'colorSecondary', 'sizeSmall', 'sizeMedium'] as const);
export type CheckboxClasses = typeof checkboxClasses;
export type CheckboxClassKey = keyof CheckboxClasses;

export function getChipUtilityClass(slot: string): string { return generateUtilityClass('MuiChip', slot); }
export const chipClasses = /* @__PURE__ */ generateUtilityClasses('MuiChip', ['root', 'sizeSmall', 'sizeMedium', 'colorDefault', 'colorError', 'colorInfo', 'colorPrimary', 'colorSecondary', 'colorSuccess', 'colorWarning', 'disabled', 'clickable', 'deletable', 'outlined', 'filled', 'avatar', 'icon', 'label', 'deleteIcon', 'focusVisible'] as const);
export type ChipClasses = typeof chipClasses;
export type ChipClassKey = keyof ChipClasses;

export function getCircularProgressUtilityClass(slot: string): string { return generateUtilityClass('MuiCircularProgress', slot); }
export const circularProgressClasses = /* @__PURE__ */ generateUtilityClasses('MuiCircularProgress', ['root', 'determinate', 'indeterminate', 'colorPrimary', 'colorSecondary', 'svg', 'track', 'circle', 'circleDisableShrink'] as const);
export type CircularProgressClasses = typeof circularProgressClasses;
export type CircularProgressClassKey = keyof CircularProgressClasses;

export function getCollapseUtilityClass(slot: string): string { return generateUtilityClass('MuiCollapse', slot); }
export const collapseClasses = /* @__PURE__ */ generateUtilityClasses('MuiCollapse', ['root', 'horizontal', 'vertical', 'entered', 'hidden', 'wrapper', 'wrapperInner'] as const);
export type CollapseClasses = typeof collapseClasses;
export type CollapseClassKey = keyof CollapseClasses;

export function getContainerUtilityClass(slot: string): string { return generateUtilityClass('MuiContainer', slot); }
export const containerClasses = /* @__PURE__ */ generateUtilityClasses('MuiContainer', ['root', 'disableGutters', 'fixed', 'maxWidthXs', 'maxWidthSm', 'maxWidthMd', 'maxWidthLg', 'maxWidthXl'] as const);
export type ContainerClasses = typeof containerClasses;
export type ContainerClassKey = keyof ContainerClasses;

export function getDialogUtilityClass(slot: string): string { return generateUtilityClass('MuiDialog', slot); }
export const dialogClasses = /* @__PURE__ */ generateUtilityClasses('MuiDialog', ['root', 'backdrop', 'scrollPaper', 'scrollBody', 'container', 'paper', 'paperWidthFalse', 'paperWidthXs', 'paperWidthSm', 'paperWidthMd', 'paperWidthLg', 'paperWidthXl', 'paperFullWidth', 'paperFullScreen'] as const);
export type DialogClasses = typeof dialogClasses;
export type DialogClassKey = keyof DialogClasses;

export function getDialogActionsUtilityClass(slot: string): string { return generateUtilityClass('MuiDialogActions', slot); }
export const dialogActionsClasses = /* @__PURE__ */ generateUtilityClasses('MuiDialogActions', ['root', 'spacing'] as const);
export type DialogActionsClasses = typeof dialogActionsClasses;
export type DialogActionsClassKey = keyof DialogActionsClasses;

export function getDialogContentUtilityClass(slot: string): string { return generateUtilityClass('MuiDialogContent', slot); }
export const dialogContentClasses = /* @__PURE__ */ generateUtilityClasses('MuiDialogContent', ['root', 'dividers'] as const);
export type DialogContentClasses = typeof dialogContentClasses;
export type DialogContentClassKey = keyof DialogContentClasses;

export function getDialogContentTextUtilityClass(slot: string): string { return generateUtilityClass('MuiDialogContentText', slot); }
export const dialogContentTextClasses = /* @__PURE__ */ generateUtilityClasses('MuiDialogContentText', ['root'] as const);
export type DialogContentTextClasses = typeof dialogContentTextClasses;
export type DialogContentTextClassKey = keyof DialogContentTextClasses;

export function getDialogTitleUtilityClass(slot: string): string { return generateUtilityClass('MuiDialogTitle', slot); }
export const dialogTitleClasses = /* @__PURE__ */ generateUtilityClasses('MuiDialogTitle', ['root'] as const);
export type DialogTitleClasses = typeof dialogTitleClasses;
export type DialogTitleClassKey = keyof DialogTitleClasses;

export function getDividerUtilityClass(slot: string): string { return generateUtilityClass('MuiDivider', slot); }
export const dividerClasses = /* @__PURE__ */ generateUtilityClasses('MuiDivider', ['root', 'absolute', 'fullWidth', 'inset', 'middle', 'flexItem', 'vertical', 'withChildren', 'textAlignRight', 'textAlignLeft', 'wrapper', 'wrapperVertical'] as const);
export type DividerClasses = typeof dividerClasses;
export type DividerClassKey = keyof DividerClasses;

export function getDrawerUtilityClass(slot: string): string { return generateUtilityClass('MuiDrawer', slot); }
export const drawerClasses = /* @__PURE__ */ generateUtilityClasses('MuiDrawer', ['root', 'docked', 'paper', 'anchorLeft', 'anchorRight', 'anchorTop', 'anchorBottom', 'modal'] as const);
export type DrawerClasses = typeof drawerClasses;
export type DrawerClassKey = keyof DrawerClasses;

export function getFabUtilityClass(slot: string): string { return generateUtilityClass('MuiFab', slot); }
export const fabClasses = /* @__PURE__ */ generateUtilityClasses('MuiFab', ['root', 'primary', 'secondary', 'extended', 'circular', 'focusVisible', 'disabled', 'colorInherit', 'sizeSmall', 'sizeMedium', 'sizeLarge', 'info', 'error', 'warning', 'success'] as const);
export type FabClasses = typeof fabClasses;
export type FabClassKey = keyof FabClasses;

export function getInputBaseUtilityClass(slot: string): string { return generateUtilityClass('MuiInputBase', slot); }
export const inputBaseClasses = /* @__PURE__ */ generateUtilityClasses('MuiInputBase', ['root', 'formControl', 'focused', 'disabled', 'adornedStart', 'adornedEnd', 'error', 'sizeSmall', 'multiline', 'colorSecondary', 'fullWidth', 'hiddenLabel', 'readOnly', 'input', 'inputTypeSearch'] as const);
export type InputBaseClasses = typeof inputBaseClasses;
export type InputBaseClassKey = keyof InputBaseClasses;

export function getFilledInputUtilityClass(slot: string): string { return generateUtilityClass('MuiFilledInput', slot); }
export const filledInputClasses = { ...inputBaseClasses, .../* @__PURE__ */ generateUtilityClasses('MuiFilledInput', ['root', 'underline', 'input', 'adornedStart', 'adornedEnd', 'sizeSmall', 'multiline', 'hiddenLabel'] as const) };
export type FilledInputClasses = typeof filledInputClasses;
export type FilledInputClassKey = keyof FilledInputClasses;

export function getFormControlUtilityClasses(slot: string): string { return generateUtilityClass('MuiFormControl', slot); }
export const formControlClasses = /* @__PURE__ */ generateUtilityClasses('MuiFormControl', ['root', 'marginNone', 'marginNormal', 'marginDense', 'fullWidth', 'disabled'] as const);
export type FormControlClasses = typeof formControlClasses;
export type FormControlClassKey = keyof FormControlClasses;

export function getFormControlLabelUtilityClasses(slot: string): string { return generateUtilityClass('MuiFormControlLabel', slot); }
export const formControlLabelClasses = /* @__PURE__ */ generateUtilityClasses('MuiFormControlLabel', ['root', 'labelPlacementStart', 'labelPlacementEnd', 'labelPlacementTop', 'labelPlacementBottom', 'disabled', 'label', 'error', 'required', 'asterisk'] as const);
export type FormControlLabelClasses = typeof formControlLabelClasses;
export type FormControlLabelClassKey = keyof FormControlLabelClasses;

export function getFormGroupUtilityClass(slot: string): string { return generateUtilityClass('MuiFormGroup', slot); }
export const formGroupClasses = /* @__PURE__ */ generateUtilityClasses('MuiFormGroup', ['root', 'row', 'error'] as const);
export type FormGroupClasses = typeof formGroupClasses;
export type FormGroupClassKey = keyof FormGroupClasses;

export function getFormHelperTextUtilityClasses(slot: string): string { return generateUtilityClass('MuiFormHelperText', slot); }
export const formHelperTextClasses = /* @__PURE__ */ generateUtilityClasses('MuiFormHelperText', ['root', 'error', 'disabled', 'sizeSmall', 'sizeMedium', 'contained', 'focused', 'filled', 'required'] as const);
export type FormHelperTextClasses = typeof formHelperTextClasses;
export type FormHelperTextClassKey = keyof FormHelperTextClasses;

export function getFormLabelUtilityClasses(slot: string): string { return generateUtilityClass('MuiFormLabel', slot); }
export const formLabelClasses = /* @__PURE__ */ generateUtilityClasses('MuiFormLabel', ['root', 'colorSecondary', 'focused', 'disabled', 'error', 'filled', 'required', 'asterisk'] as const);
export type FormLabelClasses = typeof formLabelClasses;
export type FormLabelClassKey = keyof FormLabelClasses;

export function getGridUtilityClass(slot: string): string { return generateUtilityClass('MuiGrid', slot); }
export const gridClasses = /* @__PURE__ */ generateUtilityClasses('MuiGrid', ['root', 'container'] as const);
export type GridClasses = typeof gridClasses;
export type GridClassKey = keyof GridClasses;

export function getIconUtilityClass(slot: string): string { return generateUtilityClass('MuiIcon', slot); }
export const iconClasses = /* @__PURE__ */ generateUtilityClasses('MuiIcon', ['root', 'colorPrimary', 'colorSecondary', 'colorAction', 'colorError', 'colorDisabled', 'fontSizeInherit', 'fontSizeSmall', 'fontSizeMedium', 'fontSizeLarge'] as const);
export type IconClasses = typeof iconClasses;
export type IconClassKey = keyof IconClasses;

export function getIconButtonUtilityClass(slot: string): string { return generateUtilityClass('MuiIconButton', slot); }
export const iconButtonClasses = /* @__PURE__ */ generateUtilityClasses('MuiIconButton', ['root', 'disabled', 'colorInherit', 'colorPrimary', 'colorSecondary', 'colorError', 'colorInfo', 'colorSuccess', 'colorWarning', 'edgeStart', 'edgeEnd', 'sizeSmall', 'sizeMedium', 'sizeLarge', 'loading', 'loadingIndicator', 'loadingWrapper'] as const);
export type IconButtonClasses = typeof iconButtonClasses;
export type IconButtonClassKey = keyof IconButtonClasses;

export function getImageListUtilityClass(slot: string): string { return generateUtilityClass('MuiImageList', slot); }
export const imageListClasses = /* @__PURE__ */ generateUtilityClasses('MuiImageList', ['root', 'masonry', 'quilted', 'standard', 'woven'] as const);
export type ImageListClasses = typeof imageListClasses;
export type ImageListClassKey = keyof ImageListClasses;

export function getImageListItemUtilityClass(slot: string): string { return generateUtilityClass('MuiImageListItem', slot); }
export const imageListItemClasses = /* @__PURE__ */ generateUtilityClasses('MuiImageListItem', ['root', 'img', 'standard', 'woven', 'masonry', 'quilted'] as const);
export type ImageListItemClasses = typeof imageListItemClasses;
export type ImageListItemClassKey = keyof ImageListItemClasses;

export function getImageListItemBarUtilityClass(slot: string): string { return generateUtilityClass('MuiImageListItemBar', slot); }
export const imageListItemBarClasses = /* @__PURE__ */ generateUtilityClasses('MuiImageListItemBar', ['root', 'positionBottom', 'positionTop', 'positionBelow', 'actionPositionLeft', 'actionPositionRight', 'titleWrap', 'title', 'subtitle', 'actionIcon'] as const);
export type ImageListItemBarClasses = typeof imageListItemBarClasses;
export type ImageListItemBarClassKey = keyof ImageListItemBarClasses;

export function getInputUtilityClass(slot: string): string { return generateUtilityClass('MuiInput', slot); }
export const inputClasses = { ...inputBaseClasses, .../* @__PURE__ */ generateUtilityClasses('MuiInput', ['root', 'underline', 'input'] as const) };
export type InputClasses = typeof inputClasses;
export type InputClassKey = keyof InputClasses;

export function getInputAdornmentUtilityClass(slot: string): string { return generateUtilityClass('MuiInputAdornment', slot); }
export const inputAdornmentClasses = /* @__PURE__ */ generateUtilityClasses('MuiInputAdornment', ['root', 'filled', 'standard', 'outlined', 'positionStart', 'positionEnd', 'disablePointerEvents', 'hiddenLabel', 'sizeSmall'] as const);
export type InputAdornmentClasses = typeof inputAdornmentClasses;
export type InputAdornmentClassKey = keyof InputAdornmentClasses;

export function getInputLabelUtilityClasses(slot: string): string { return generateUtilityClass('MuiInputLabel', slot); }
export const inputLabelClasses = /* @__PURE__ */ generateUtilityClasses('MuiInputLabel', ['root', 'focused', 'disabled', 'error', 'required', 'asterisk', 'formControl', 'sizeSmall', 'shrink', 'animated', 'standard', 'filled', 'outlined'] as const);
export type InputLabelClasses = typeof inputLabelClasses;
export type InputLabelClassKey = keyof InputLabelClasses;

export function getLinearProgressUtilityClass(slot: string): string { return generateUtilityClass('MuiLinearProgress', slot); }
export const linearProgressClasses = /* @__PURE__ */ generateUtilityClasses('MuiLinearProgress', ['root', 'colorPrimary', 'colorSecondary', 'determinate', 'indeterminate', 'buffer', 'query', 'dashed', 'bar', 'bar1', 'bar2'] as const);
export type LinearProgressClasses = typeof linearProgressClasses;
export type LinearProgressClassKey = keyof LinearProgressClasses;

export function getLinkUtilityClass(slot: string): string { return generateUtilityClass('MuiLink', slot); }
export const linkClasses = /* @__PURE__ */ generateUtilityClasses('MuiLink', ['root', 'underlineNone', 'underlineHover', 'underlineAlways', 'button', 'focusVisible'] as const);
export type LinkClasses = typeof linkClasses;
export type LinkClassKey = keyof LinkClasses;

export function getListUtilityClass(slot: string): string { return generateUtilityClass('MuiList', slot); }
export const listClasses = /* @__PURE__ */ generateUtilityClasses('MuiList', ['root', 'padding', 'dense', 'subheader'] as const);
export type ListClasses = typeof listClasses;
export type ListClassKey = keyof ListClasses;

export function getListItemUtilityClass(slot: string): string { return generateUtilityClass('MuiListItem', slot); }
export const listItemClasses = /* @__PURE__ */ generateUtilityClasses('MuiListItem', ['root', 'dense', 'alignItemsFlexStart', 'divider', 'gutters', 'padding', 'secondaryAction'] as const);
export type ListItemClasses = typeof listItemClasses;
export type ListItemClassKey = keyof ListItemClasses;

export function getListItemAvatarUtilityClass(slot: string): string { return generateUtilityClass('MuiListItemAvatar', slot); }
export const listItemAvatarClasses = /* @__PURE__ */ generateUtilityClasses('MuiListItemAvatar', ['root', 'alignItemsFlexStart'] as const);
export type ListItemAvatarClasses = typeof listItemAvatarClasses;
export type ListItemAvatarClassKey = keyof ListItemAvatarClasses;

export function getListItemButtonUtilityClass(slot: string): string { return generateUtilityClass('MuiListItemButton', slot); }
export const listItemButtonClasses = /* @__PURE__ */ generateUtilityClasses('MuiListItemButton', ['root', 'focusVisible', 'dense', 'alignItemsFlexStart', 'disabled', 'divider', 'gutters', 'selected'] as const);
export type ListItemButtonClasses = typeof listItemButtonClasses;
export type ListItemButtonClassKey = keyof ListItemButtonClasses;

export function getListItemIconUtilityClass(slot: string): string { return generateUtilityClass('MuiListItemIcon', slot); }
export const listItemIconClasses = /* @__PURE__ */ generateUtilityClasses('MuiListItemIcon', ['root', 'alignItemsFlexStart'] as const);
export type ListItemIconClasses = typeof listItemIconClasses;
export type ListItemIconClassKey = keyof ListItemIconClasses;

export function getListItemSecondaryActionClassesUtilityClass(slot: string): string { return generateUtilityClass('MuiListItemSecondaryAction', slot); }
export const listItemSecondaryActionClasses = /* @__PURE__ */ generateUtilityClasses('MuiListItemSecondaryAction', ['root', 'disableGutters'] as const);
export type ListItemSecondaryActionClasses = typeof listItemSecondaryActionClasses;
export type ListItemSecondaryActionClassKey = keyof ListItemSecondaryActionClasses;

export function getListItemTextUtilityClass(slot: string): string { return generateUtilityClass('MuiListItemText', slot); }
export const listItemTextClasses = /* @__PURE__ */ generateUtilityClasses('MuiListItemText', ['root', 'multiline', 'dense', 'inset', 'primary', 'secondary'] as const);
export type ListItemTextClasses = typeof listItemTextClasses;
export type ListItemTextClassKey = keyof ListItemTextClasses;

export function getListSubheaderUtilityClass(slot: string): string { return generateUtilityClass('MuiListSubheader', slot); }
export const listSubheaderClasses = /* @__PURE__ */ generateUtilityClasses('MuiListSubheader', ['root', 'colorPrimary', 'colorInherit', 'gutters', 'inset', 'sticky'] as const);
export type ListSubheaderClasses = typeof listSubheaderClasses;
export type ListSubheaderClassKey = keyof ListSubheaderClasses;

export function getMenuUtilityClass(slot: string): string { return generateUtilityClass('MuiMenu', slot); }
export const menuClasses = /* @__PURE__ */ generateUtilityClasses('MuiMenu', ['root', 'paper', 'list'] as const);
export type MenuClasses = typeof menuClasses;
export type MenuClassKey = keyof MenuClasses;

export function getMenuItemUtilityClass(slot: string): string { return generateUtilityClass('MuiMenuItem', slot); }
export const menuItemClasses = /* @__PURE__ */ generateUtilityClasses('MuiMenuItem', ['root', 'focusVisible', 'dense', 'disabled', 'divider', 'gutters', 'selected'] as const);
export type MenuItemClasses = typeof menuItemClasses;
export type MenuItemClassKey = keyof MenuItemClasses;

export function getMobileStepperUtilityClass(slot: string): string { return generateUtilityClass('MuiMobileStepper', slot); }
export const mobileStepperClasses = /* @__PURE__ */ generateUtilityClasses('MuiMobileStepper', ['root', 'positionBottom', 'positionTop', 'positionStatic', 'dots', 'dot', 'dotActive', 'progress'] as const);
export type MobileStepperClasses = typeof mobileStepperClasses;
export type MobileStepperClassKey = keyof MobileStepperClasses;

export function getModalUtilityClass(slot: string): string { return generateUtilityClass('MuiModal', slot); }
export const modalClasses = /* @__PURE__ */ generateUtilityClasses('MuiModal', ['root', 'hidden', 'backdrop'] as const);
export type ModalClasses = typeof modalClasses;
export type ModalClassKey = keyof ModalClasses;

export function getNativeSelectUtilityClasses(slot: string): string { return generateUtilityClass('MuiNativeSelect', slot); }
export const nativeSelectClasses = /* @__PURE__ */ generateUtilityClasses('MuiNativeSelect', ['root', 'select', 'multiple', 'filled', 'outlined', 'standard', 'disabled', 'icon', 'iconOpen', 'iconFilled', 'iconOutlined', 'iconStandard', 'nativeInput', 'error'] as const);
export type NativeSelectClasses = typeof nativeSelectClasses;
export type NativeSelectClassKey = keyof NativeSelectClasses;

export function getOutlinedInputUtilityClass(slot: string): string { return generateUtilityClass('MuiOutlinedInput', slot); }
export const outlinedInputClasses = { ...inputBaseClasses, .../* @__PURE__ */ generateUtilityClasses('MuiOutlinedInput', ['root', 'notchedOutline', 'input'] as const) };
export type OutlinedInputClasses = typeof outlinedInputClasses;
export type OutlinedInputClassKey = keyof OutlinedInputClasses;

export function getPaginationUtilityClass(slot: string): string { return generateUtilityClass('MuiPagination', slot); }
export const paginationClasses = /* @__PURE__ */ generateUtilityClasses('MuiPagination', ['root', 'ul', 'outlined', 'text'] as const);
export type PaginationClasses = typeof paginationClasses;
export type PaginationClassKey = keyof PaginationClasses;

export function getPaginationItemUtilityClass(slot: string): string { return generateUtilityClass('MuiPaginationItem', slot); }
export const paginationItemClasses = /* @__PURE__ */ generateUtilityClasses('MuiPaginationItem', ['root', 'page', 'sizeSmall', 'sizeLarge', 'text', 'outlined', 'rounded', 'ellipsis', 'firstLast', 'previousNext', 'focusVisible', 'disabled', 'selected', 'icon', 'colorPrimary', 'colorSecondary'] as const);
export type PaginationItemClasses = typeof paginationItemClasses;
export type PaginationItemClassKey = keyof PaginationItemClasses;

export function getPaperUtilityClass(slot: string): string { return generateUtilityClass('MuiPaper', slot); }
export const paperClasses = /* @__PURE__ */ generateUtilityClasses('MuiPaper', ['root', 'rounded', 'outlined', 'elevation', 'elevation0', 'elevation1', 'elevation2', 'elevation3', 'elevation4', 'elevation5', 'elevation6', 'elevation7', 'elevation8', 'elevation9', 'elevation10', 'elevation11', 'elevation12', 'elevation13', 'elevation14', 'elevation15', 'elevation16', 'elevation17', 'elevation18', 'elevation19', 'elevation20', 'elevation21', 'elevation22', 'elevation23', 'elevation24'] as const);
export type PaperClasses = typeof paperClasses;
export type PaperClassKey = keyof PaperClasses;

export function getPopoverUtilityClass(slot: string): string { return generateUtilityClass('MuiPopover', slot); }
export const popoverClasses = /* @__PURE__ */ generateUtilityClasses('MuiPopover', ['root', 'paper'] as const);
export type PopoverClasses = typeof popoverClasses;
export type PopoverClassKey = keyof PopoverClasses;

export function getPopperUtilityClass(slot: string): string { return generateUtilityClass('MuiPopper', slot); }
export const popperClasses = /* @__PURE__ */ generateUtilityClasses('MuiPopper', ['root'] as const);
export type PopperClasses = typeof popperClasses;
export type PopperClassKey = keyof PopperClasses;

export function getRadioUtilityClass(slot: string): string { return generateUtilityClass('MuiRadio', slot); }
export const radioClasses = /* @__PURE__ */ generateUtilityClasses('MuiRadio', ['root', 'checked', 'disabled', 'colorPrimary', 'colorSecondary', 'sizeSmall'] as const);
export type RadioClasses = typeof radioClasses;
export type RadioClassKey = keyof RadioClasses;

export function getRadioGroupUtilityClass(slot: string): string { return generateUtilityClass('MuiRadioGroup', slot); }
export const radioGroupClasses = /* @__PURE__ */ generateUtilityClasses('MuiRadioGroup', ['root', 'row', 'error'] as const);
export type RadioGroupClasses = typeof radioGroupClasses;
export type RadioGroupClassKey = keyof RadioGroupClasses;

export function getRatingUtilityClass(slot: string): string { return generateUtilityClass('MuiRating', slot); }
export const ratingClasses = /* @__PURE__ */ generateUtilityClasses('MuiRating', ['root', 'sizeSmall', 'sizeMedium', 'sizeLarge', 'readOnly', 'disabled', 'focusVisible', 'visuallyHidden', 'pristine', 'label', 'labelEmptyValueActive', 'icon', 'iconEmpty', 'iconFilled', 'iconHover', 'iconFocus', 'iconActive', 'decimal'] as const);
export type RatingClasses = typeof ratingClasses;
export type RatingClassKey = keyof RatingClasses;

export function getScopedCssBaselineUtilityClass(slot: string): string { return generateUtilityClass('MuiScopedCssBaseline', slot); }
export const scopedCssBaselineClasses = /* @__PURE__ */ generateUtilityClasses('MuiScopedCssBaseline', ['root'] as const);
export type ScopedCssBaselineClasses = typeof scopedCssBaselineClasses;
export type ScopedCssBaselineClassKey = keyof ScopedCssBaselineClasses;

export function getSelectUtilityClasses(slot: string): string { return generateUtilityClass('MuiSelect', slot); }
export const selectClasses = /* @__PURE__ */ generateUtilityClasses('MuiSelect', ['root', 'select', 'multiple', 'filled', 'outlined', 'standard', 'disabled', 'focused', 'icon', 'iconOpen', 'nativeInput', 'error'] as const);
export type SelectClasses = typeof selectClasses;
export type SelectClassKey = keyof SelectClasses;

export function getSkeletonUtilityClass(slot: string): string { return generateUtilityClass('MuiSkeleton', slot); }
export const skeletonClasses = /* @__PURE__ */ generateUtilityClasses('MuiSkeleton', ['root', 'text', 'rectangular', 'rounded', 'circular', 'pulse', 'wave', 'withChildren', 'fitContent', 'heightAuto'] as const);
export type SkeletonClasses = typeof skeletonClasses;
export type SkeletonClassKey = keyof SkeletonClasses;

export function getSliderUtilityClass(slot: string): string { return generateUtilityClass('MuiSlider', slot); }
export const sliderClasses = /* @__PURE__ */ generateUtilityClasses('MuiSlider', ['root', 'active', 'colorPrimary', 'colorSecondary', 'colorError', 'colorInfo', 'colorSuccess', 'colorWarning', 'disabled', 'dragging', 'focusVisible', 'mark', 'markActive', 'marked', 'markLabel', 'markLabelActive', 'rail', 'sizeSmall', 'thumb', 'track', 'trackInverted', 'trackFalse', 'valueLabel', 'valueLabelOpen', 'valueLabelCircle', 'valueLabelLabel', 'vertical'] as const);
export type SliderClasses = typeof sliderClasses;
export type SliderClassKey = keyof SliderClasses;

export function getSnackbarUtilityClass(slot: string): string { return generateUtilityClass('MuiSnackbar', slot); }
export const snackbarClasses = /* @__PURE__ */ generateUtilityClasses('MuiSnackbar', ['root', 'anchorOriginTopCenter', 'anchorOriginBottomCenter', 'anchorOriginTopRight', 'anchorOriginBottomRight', 'anchorOriginTopLeft', 'anchorOriginBottomLeft'] as const);
export type SnackbarClasses = typeof snackbarClasses;
export type SnackbarClassKey = keyof SnackbarClasses;

export function getSnackbarContentUtilityClass(slot: string): string { return generateUtilityClass('MuiSnackbarContent', slot); }
export const snackbarContentClasses = /* @__PURE__ */ generateUtilityClasses('MuiSnackbarContent', ['root', 'message', 'action'] as const);
export type SnackbarContentClasses = typeof snackbarContentClasses;
export type SnackbarContentClassKey = keyof SnackbarContentClasses;

export function getSpeedDialUtilityClass(slot: string): string { return generateUtilityClass('MuiSpeedDial', slot); }
export const speedDialClasses = /* @__PURE__ */ generateUtilityClasses('MuiSpeedDial', ['root', 'fab', 'directionUp', 'directionDown', 'directionLeft', 'directionRight', 'actions', 'actionsClosed'] as const);
export type SpeedDialClasses = typeof speedDialClasses;
export type SpeedDialClassKey = keyof SpeedDialClasses;

export function getSpeedDialActionUtilityClass(slot: string): string { return generateUtilityClass('MuiSpeedDialAction', slot); }
export const speedDialActionClasses = /* @__PURE__ */ generateUtilityClasses('MuiSpeedDialAction', ['fab', 'fabClosed', 'staticTooltip', 'staticTooltipClosed', 'staticTooltipLabel', 'tooltipPlacementLeft', 'tooltipPlacementRight', 'tooltipPlacementTop', 'tooltipPlacementBottom'] as const);
export type SpeedDialActionClasses = typeof speedDialActionClasses;
export type SpeedDialActionClassKey = keyof SpeedDialActionClasses;

export function getSpeedDialIconUtilityClass(slot: string): string { return generateUtilityClass('MuiSpeedDialIcon', slot); }
export const speedDialIconClasses = /* @__PURE__ */ generateUtilityClasses('MuiSpeedDialIcon', ['root', 'icon', 'iconOpen', 'iconWithOpenIconOpen', 'openIcon', 'openIconOpen'] as const);
export type SpeedDialIconClasses = typeof speedDialIconClasses;
export type SpeedDialIconClassKey = keyof SpeedDialIconClasses;

export function getStackUtilityClass(slot: string): string { return generateUtilityClass('MuiStack', slot); }
export const stackClasses = /* @__PURE__ */ generateUtilityClasses('MuiStack', ['root'] as const);
export type StackClasses = typeof stackClasses;
export type StackClassKey = keyof StackClasses;

export function getStepUtilityClass(slot: string): string { return generateUtilityClass('MuiStep', slot); }
export const stepClasses = /* @__PURE__ */ generateUtilityClasses('MuiStep', ['root', 'horizontal', 'vertical', 'alternativeLabel', 'completed'] as const);
export type StepClasses = typeof stepClasses;
export type StepClassKey = keyof StepClasses;

export function getStepButtonUtilityClass(slot: string): string { return generateUtilityClass('MuiStepButton', slot); }
export const stepButtonClasses = /* @__PURE__ */ generateUtilityClasses('MuiStepButton', ['root', 'horizontal', 'vertical', 'touchRipple'] as const);
export type StepButtonClasses = typeof stepButtonClasses;
export type StepButtonClassKey = keyof StepButtonClasses;

export function getStepConnectorUtilityClass(slot: string): string { return generateUtilityClass('MuiStepConnector', slot); }
export const stepConnectorClasses = /* @__PURE__ */ generateUtilityClasses('MuiStepConnector', ['root', 'horizontal', 'vertical', 'alternativeLabel', 'active', 'completed', 'disabled', 'line'] as const);
export type StepConnectorClasses = typeof stepConnectorClasses;
export type StepConnectorClassKey = keyof StepConnectorClasses;

export function getStepContentUtilityClass(slot: string): string { return generateUtilityClass('MuiStepContent', slot); }
export const stepContentClasses = /* @__PURE__ */ generateUtilityClasses('MuiStepContent', ['root', 'last', 'transition'] as const);
export type StepContentClasses = typeof stepContentClasses;
export type StepContentClassKey = keyof StepContentClasses;

export function getStepIconUtilityClass(slot: string): string { return generateUtilityClass('MuiStepIcon', slot); }
export const stepIconClasses = /* @__PURE__ */ generateUtilityClasses('MuiStepIcon', ['root', 'active', 'completed', 'error', 'text'] as const);
export type StepIconClasses = typeof stepIconClasses;
export type StepIconClassKey = keyof StepIconClasses;

export function getStepLabelUtilityClass(slot: string): string { return generateUtilityClass('MuiStepLabel', slot); }
export const stepLabelClasses = /* @__PURE__ */ generateUtilityClasses('MuiStepLabel', ['root', 'horizontal', 'vertical', 'label', 'active', 'completed', 'error', 'disabled', 'iconContainer', 'alternativeLabel', 'labelContainer'] as const);
export type StepLabelClasses = typeof stepLabelClasses;
export type StepLabelClassKey = keyof StepLabelClasses;

export function getStepperUtilityClass(slot: string): string { return generateUtilityClass('MuiStepper', slot); }
export const stepperClasses = /* @__PURE__ */ generateUtilityClasses('MuiStepper', ['root', 'horizontal', 'vertical', 'nonLinear', 'alternativeLabel'] as const);
export type StepperClasses = typeof stepperClasses;
export type StepperClassKey = keyof StepperClasses;

export function getSvgIconUtilityClass(slot: string): string { return generateUtilityClass('MuiSvgIcon', slot); }
export const svgIconClasses = /* @__PURE__ */ generateUtilityClasses('MuiSvgIcon', ['root', 'colorPrimary', 'colorSecondary', 'colorAction', 'colorError', 'colorDisabled', 'fontSizeInherit', 'fontSizeSmall', 'fontSizeMedium', 'fontSizeLarge'] as const);
export type SvgIconClasses = typeof svgIconClasses;
export type SvgIconClassKey = keyof SvgIconClasses;

export function getSwitchUtilityClass(slot: string): string { return generateUtilityClass('MuiSwitch', slot); }
export const switchClasses = /* @__PURE__ */ generateUtilityClasses('MuiSwitch', ['root', 'edgeStart', 'edgeEnd', 'switchBase', 'colorPrimary', 'colorSecondary', 'sizeSmall', 'sizeMedium', 'checked', 'disabled', 'input', 'thumb', 'track'] as const);
export type SwitchClasses = typeof switchClasses;
export type SwitchClassKey = keyof SwitchClasses;

export function getTabUtilityClass(slot: string): string { return generateUtilityClass('MuiTab', slot); }
export const tabClasses = /* @__PURE__ */ generateUtilityClasses('MuiTab', ['root', 'labelIcon', 'textColorInherit', 'textColorPrimary', 'textColorSecondary', 'selected', 'disabled', 'fullWidth', 'wrapped', 'icon'] as const);
export type TabClasses = typeof tabClasses;
export type TabClassKey = keyof TabClasses;

export function getTabScrollButtonUtilityClass(slot: string): string { return generateUtilityClass('MuiTabScrollButton', slot); }
export const tabScrollButtonClasses = /* @__PURE__ */ generateUtilityClasses('MuiTabScrollButton', ['root', 'vertical', 'horizontal', 'disabled'] as const);
export type TabScrollButtonClasses = typeof tabScrollButtonClasses;
export type TabScrollButtonClassKey = keyof TabScrollButtonClasses;

export function getTableUtilityClass(slot: string): string { return generateUtilityClass('MuiTable', slot); }
export const tableClasses = /* @__PURE__ */ generateUtilityClasses('MuiTable', ['root', 'stickyHeader'] as const);
export type TableClasses = typeof tableClasses;
export type TableClassKey = keyof TableClasses;

export function getTableBodyUtilityClass(slot: string): string { return generateUtilityClass('MuiTableBody', slot); }
export const tableBodyClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableBody', ['root'] as const);
export type TableBodyClasses = typeof tableBodyClasses;
export type TableBodyClassKey = keyof TableBodyClasses;

export function getTableCellUtilityClass(slot: string): string { return generateUtilityClass('MuiTableCell', slot); }
export const tableCellClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableCell', ['root', 'head', 'body', 'footer', 'sizeSmall', 'sizeMedium', 'paddingCheckbox', 'paddingNone', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'stickyHeader'] as const);
export type TableCellClasses = typeof tableCellClasses;
export type TableCellClassKey = keyof TableCellClasses;

export function getTableContainerUtilityClass(slot: string): string { return generateUtilityClass('MuiTableContainer', slot); }
export const tableContainerClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableContainer', ['root'] as const);
export type TableContainerClasses = typeof tableContainerClasses;
export type TableContainerClassKey = keyof TableContainerClasses;

export function getTableFooterUtilityClass(slot: string): string { return generateUtilityClass('MuiTableFooter', slot); }
export const tableFooterClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableFooter', ['root'] as const);
export type TableFooterClasses = typeof tableFooterClasses;
export type TableFooterClassKey = keyof TableFooterClasses;

export function getTableHeadUtilityClass(slot: string): string { return generateUtilityClass('MuiTableHead', slot); }
export const tableHeadClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableHead', ['root'] as const);
export type TableHeadClasses = typeof tableHeadClasses;
export type TableHeadClassKey = keyof TableHeadClasses;

export function getTablePaginationUtilityClass(slot: string): string { return generateUtilityClass('MuiTablePagination', slot); }
export const tablePaginationClasses = /* @__PURE__ */ generateUtilityClasses('MuiTablePagination', ['root', 'toolbar', 'spacer', 'selectLabel', 'selectRoot', 'select', 'selectIcon', 'input', 'menuItem', 'displayedRows', 'actions'] as const);
export type TablePaginationClasses = typeof tablePaginationClasses;
export type TablePaginationClassKey = keyof TablePaginationClasses;

export function getTablePaginationActionsUtilityClass(slot: string): string { return generateUtilityClass('MuiTablePaginationActions', slot); }
export const tablePaginationActionsClasses = /* @__PURE__ */ generateUtilityClasses('MuiTablePaginationActions', ['root'] as const);
export type TablePaginationActionsClasses = typeof tablePaginationActionsClasses;
export type TablePaginationActionsClassKey = keyof TablePaginationActionsClasses;

export function getTableRowUtilityClass(slot: string): string { return generateUtilityClass('MuiTableRow', slot); }
export const tableRowClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableRow', ['root', 'selected', 'hover', 'head', 'footer'] as const);
export type TableRowClasses = typeof tableRowClasses;
export type TableRowClassKey = keyof TableRowClasses;

export function getTableSortLabelUtilityClass(slot: string): string { return generateUtilityClass('MuiTableSortLabel', slot); }
export const tableSortLabelClasses = /* @__PURE__ */ generateUtilityClasses('MuiTableSortLabel', ['root', 'active', 'icon', 'directionDesc', 'directionAsc'] as const);
export type TableSortLabelClasses = typeof tableSortLabelClasses;
export type TableSortLabelClassKey = keyof TableSortLabelClasses;

export function getTabsUtilityClass(slot: string): string { return generateUtilityClass('MuiTabs', slot); }
export const tabsClasses = /* @__PURE__ */ generateUtilityClasses('MuiTabs', ['root', 'vertical', 'list', 'centered', 'scroller', 'fixed', 'scrollableX', 'scrollableY', 'hideScrollbar', 'scrollButtons', 'scrollButtonsHideMobile', 'indicator'] as const);
export type TabsClasses = typeof tabsClasses;
export type TabsClassKey = keyof TabsClasses;

export function getTextFieldUtilityClass(slot: string): string { return generateUtilityClass('MuiTextField', slot); }
export const textFieldClasses = /* @__PURE__ */ generateUtilityClasses('MuiTextField', ['root'] as const);
export type TextFieldClasses = typeof textFieldClasses;
export type TextFieldClassKey = keyof TextFieldClasses;

export function getToggleButtonUtilityClass(slot: string): string { return generateUtilityClass('MuiToggleButton', slot); }
export const toggleButtonClasses = /* @__PURE__ */ generateUtilityClasses('MuiToggleButton', ['root', 'disabled', 'selected', 'standard', 'primary', 'secondary', 'sizeSmall', 'sizeMedium', 'sizeLarge', 'fullWidth'] as const);
export type ToggleButtonClasses = typeof toggleButtonClasses;
export type ToggleButtonClassKey = keyof ToggleButtonClasses;

export function getToggleButtonGroupUtilityClass(slot: string): string { return generateUtilityClass('MuiToggleButtonGroup', slot); }
export const toggleButtonGroupClasses = /* @__PURE__ */ generateUtilityClasses('MuiToggleButtonGroup', ['root', 'selected', 'horizontal', 'vertical', 'disabled', 'grouped', 'fullWidth', 'firstButton', 'lastButton', 'middleButton'] as const);
export type ToggleButtonGroupClasses = typeof toggleButtonGroupClasses;
export type ToggleButtonGroupClassKey = keyof ToggleButtonGroupClasses;

export function getToolbarUtilityClass(slot: string): string { return generateUtilityClass('MuiToolbar', slot); }
export const toolbarClasses = /* @__PURE__ */ generateUtilityClasses('MuiToolbar', ['root', 'gutters', 'regular', 'dense'] as const);
export type ToolbarClasses = typeof toolbarClasses;
export type ToolbarClassKey = keyof ToolbarClasses;

export function getTooltipUtilityClass(slot: string): string { return generateUtilityClass('MuiTooltip', slot); }
export const tooltipClasses = /* @__PURE__ */ generateUtilityClasses('MuiTooltip', ['popper', 'popperInteractive', 'popperArrow', 'popperClose', 'tooltip', 'tooltipArrow', 'touch', 'tooltipPlacementLeft', 'tooltipPlacementRight', 'tooltipPlacementTop', 'tooltipPlacementBottom', 'arrow'] as const);
export type TooltipClasses = typeof tooltipClasses;
export type TooltipClassKey = keyof TooltipClasses;

export function getTypographyUtilityClass(slot: string): string { return generateUtilityClass('MuiTypography', slot); }
export const typographyClasses = /* @__PURE__ */ generateUtilityClasses('MuiTypography', ['root', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'inherit', 'button', 'caption', 'overline', 'alignLeft', 'alignRight', 'alignCenter', 'alignJustify', 'noWrap', 'gutterBottom'] as const);
export type TypographyClasses = typeof typographyClasses;
export type TypographyClassKey = keyof TypographyClasses;

export function getSwitchBaseUtilityClass(slot: string): string { return generateUtilityClass('PrivateSwitchBase', slot); }
export const switchBaseClasses = /* @__PURE__ */ generateUtilityClasses('PrivateSwitchBase', ['root', 'checked', 'disabled', 'input', 'edgeStart', 'edgeEnd'] as const);
export type SwitchBaseClasses = typeof switchBaseClasses;
export type SwitchBaseClassKey = keyof SwitchBaseClasses;
