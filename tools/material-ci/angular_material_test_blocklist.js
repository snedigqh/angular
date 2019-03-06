/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Blocklist of unit tests from angular/material2 with ivy that are skipped when running on
 * angular/angular. As bugs are resolved, items should be removed from this blocklist.
 *
 * The `notes` section should be used to keep track of specific issues associated with the failures.
 */

// clang-format off
// tslint:disable

window.testBlocklist = {
  "Portals DomPortalOutlet should attach and detach a component portal without a ViewContainerRef": {
    "error": "Error: Expected '<pizza-msg><p>Pizza</p><p>Chocolate</p></pizza-msg>' to be '', 'Expected the DomPortalOutlet to be empty after detach'.",
    "notes": "Unknown"
  },
  "CdkTable should be able to render multiple header and footer rows": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Attempting to access content children before view is initialized"
  },
  "CdkTable should be able to render and change multiple header and footer rows": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Attempting to access content children before view is initialized"
  },
  "CdkTable should render correctly when using native HTML tags": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with sticky positioning on native table layout should stick and unstick headers": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with sticky positioning on native table layout should stick and unstick footers": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with sticky positioning on native table layout should stick tfoot when all rows are stuck": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with sticky positioning on native table layout should stick and unstick left columns": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with sticky positioning on native table layout should stick and unstick right columns": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with sticky positioning on native table layout should stick and unstick combination of sticky header, footer, and columns": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "CdkTable with trackBy should change row implicit data even when trackBy finds no changes": {
    "error": "Error: Expected 'a_1 b_1' to be 'a_2 b_2'.",
    "notes": "Unknown"
  },
  "CdkTable should be able to apply classes to rows based on their context": {
    "error": "Error: Expected false to be true.",
    "notes": "Unknown"
  },
  "CdkTable should be able to apply classes to cells based on their row context": {
    "error": "Error: Expected false to be true.",
    "notes": "Unknown"
  },
  "CdkDrag in a drop container should be able to customize the preview element": {
    "error": "Error: Expected cdk-drag cdk-drag-preview to contain 'custom-preview'.",
    "notes": "FW-1134: Queries don't match structural directives with ng-template in selector"
  },
  "CdkDrag in a drop container should position custom previews next to the pointer": {
    "error": "Error: Expected 'translate3d(8px, 33px, 0px)' to be 'translate3d(50px, 50px, 0px)'.",
    "notes": "FW-1134: Queries don't match structural directives with ng-template in selector"
  },
  "CdkDrag in a drop container should lock position inside a drop container along the x axis": {
    "error": "Error: Expected 'translate3d(58px, 33px, 0px)' to be 'translate3d(100px, 50px, 0px)'.",
    "notes": "FW-1134: Queries don't match structural directives with ng-template in selector"
  },
  "CdkDrag in a drop container should lock position inside a drop container along the y axis": {
    "error": "Error: Expected 'translate3d(8px, 83px, 0px)' to be 'translate3d(50px, 100px, 0px)'.",
    "notes": "FW-1134: Queries don't match structural directives with ng-template in selector"
  },
  "CdkDrag in a drop container should inherit the position locking from the drop container": {
    "error": "Error: Expected 'translate3d(58px, 33px, 0px)' to be 'translate3d(100px, 50px, 0px)'.",
    "notes": "FW-1134: Queries don't match structural directives with ng-template in selector"
  },
  "CdkDrag in a drop container should be able to customize the placeholder": {
    "error": "Error: Expected cdk-drag cdk-drag-placeholder to contain 'custom-placeholder'.",
    "notes": "FW-1134: Queries don't match structural directives with ng-template in selector"
  },
  "CdkTree flat tree should initialize should be able to use units different from px for the indentation": {
    "error": "Error: Failed: Expected node level to be 15rem but was 28px",
    "notes": "Unknown"
  },
  "CdkTree flat tree should initialize should default to px if no unit is set for string value indentation": {
    "error": "Error: Failed: Expected node level to be 17px but was 28px",
    "notes": "Unknown"
  },
  "CdkTree flat tree with toggle should expand/collapse the node": {
    "error": "Error: Failed: Expected node level to be 40px but was ",
    "notes": "Unknown"
  },
  "CdkTree flat tree with toggle should expand/collapse the node recursively": {
    "error": "Error: Failed: Expected node level to be 40px but was ",
    "notes": "Unknown"
  },
  "CdkTree flat tree with trackBy should add/remove/move nodes with property-based trackBy": {
    "error": "Error: Expected null to be '1'.",
    "notes": "Unknown"
  },
  "CdkTree flat tree with trackBy should add/remove/move nodes with index-based trackBy": {
    "error": "Error: Expected null to be '0'.",
    "notes": "Unknown"
  },
  "CdkTree nested tree with toggle should expand/collapse the node multiple times": {
    "error": "Error: Expected 3 to be 1, 'Expect node expanded'.",
    "notes": "Unknown"
  },
  "CdkTree nested tree with toggle should expand/collapse the node recursively": {
    "error": "Error: Failed: Expected node descendant num to be 2 but was 0",
    "notes": "Unknown"
  },
  "MatChipList StandardChipList basic behaviors should toggle the chips disabled state based on whether it is disabled": {
    "error": "Error: Expected true to be false.",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList focus behaviors should focus the first chip on focus": {
    "error": "Error: Expected -1 to be 0.",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList focus behaviors should watch for chip focus": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList focus behaviors on chip destroy should focus the next item": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList focus behaviors on chip destroy should focus the previous item": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList focus behaviors on chip destroy should not focus if chip list is not focused": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList keyboard behavior LTR (default) should focus previous item when press LEFT ARROW": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList keyboard behavior LTR (default) should focus next item when press RIGHT ARROW": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList keyboard behavior LTR (default) should focus the first item when pressing HOME": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList keyboard behavior RTL should focus previous item when press RIGHT ARROW": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList keyboard behavior RTL should focus next item when press LEFT ARROW": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList StandardChipList keyboard behavior should account for the direction changing": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatChipList with chip remove should properly focus next item if chip is removed through click": {
    "error": "TypeError: Cannot read property 'focus' of undefined",
    "notes": "MatChipList does not find MatChip content children because descendants is not true anymore. TODO: Fix spec so that it does not have the wrapping div"
  },
  "MatStepper basic stepper should go to next available step when the next button is clicked": {
    "error": "Error: Expected 2 to be 1.",
    "notes": "Unknown"
  },
  "MatStepper basic stepper should go to previous available step when the previous button is clicked": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "Unknown"
  },
  "MatStepper basic stepper should not set focus on header of selected step if header is not clicked": {
    "error": "Error: Expected 2 to be 1.",
    "notes": "Unknown"
  },
  "MatStepper basic stepper should focus next step header if focus is inside the stepper": {
    "error": "Error: Expected 2 to be 1.",
    "notes": "Unknown"
  },
  "MatStepper basic stepper should only be able to return to a previous step if it is editable": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "Unknown"
  },
  "MatStepper linear stepper should not move to next step if current step is pending": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "Unknown"
  },
  "MatStepper stepper with error state should show error state": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "Unknown"
  },
  "MatStepper stepper with error state should respect a custom falsy hasError value": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "Unknown"
  },
  "MatStepper stepper using Material UI Guideline logic should show done state when step is completed and its not the current step": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "Unknown"
  },
  "MatSidenav should be fixed position when in fixed mode": {
    "error": "Error: Expected ng-tns-c24896-0 ng-trigger ng-trigger-transform mat-drawer mat-sidenav mat-drawer-over ng-star-inserted to contain 'mat-sidenav-fixed'.",
    "notes": "FW-1132: Host class bindings don't work if super class has host class bindings"
  },
  "MatSidenav should set fixed bottom and top when in fixed mode": {
    "error": "Error: Expected '' to be '20px'.",
    "notes": "FW-1132: Host class bindings don't work if super class has host class bindings"
  },
  "MatTree flat tree with toggle should expand/collapse the node": {
    "error": "Error: Expected 0 to be 1, 'Expect node expanded one level'.",
    "notes": "Unknown"
  },
  "MatTree flat tree with toggle should expand/collapse the node recursively": {
    "error": "Error: Expected 0 to be 3, 'Expect nodes expanded'.",
    "notes": "Unknown"
  },
  "MatTree nested tree with toggle should expand/collapse the node": {
    "error": "Error: Expected 0 to be 1, 'Expect node expanded'.",
    "notes": "Unknown"
  },
  "MatTree nested tree with toggle should expand/collapse the node recursively": {
    "error": "Error: Expected 0 to be 3, 'Expect node expanded'.",
    "notes": "Unknown"
  },
  "MatInput without forms validates the type": {
    "error": "Error: Input type \"file\" isn't supported by matInput.",
    "notes": "Unknown"
  },
  "MatInput with textarea autosize should work in a step": {
    "error": "TypeError: Cannot read property 'getBoundingClientRect' of null",
    "notes": "Unknown"
  },
  "Dialog should set the proper animation states": {
    "error": "TypeError: Cannot read property 'componentInstance' of null",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatAutocomplete aria should set role of autocomplete panel to listbox": {
    "error": "TypeError: Cannot read property 'nativeElement' of null",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatAutocomplete aria should set aria-owns based on the attached autocomplete": {
    "error": "TypeError: Cannot read property 'nativeElement' of null",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatDialog should set the proper animation states": {
    "error": "TypeError: Cannot read property 'componentInstance' of null",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatMenu animations should enable ripples on items by default": {
    "error": "TypeError: Cannot read property 'query' of null",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatMenu animations should disable ripples on disabled items": {
    "error": "TypeError: Cannot read property 'query' of undefined",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatMenu animations should disable ripples if disableRipple is set": {
    "error": "TypeError: Cannot read property 'query' of undefined",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatMenu nested menu should close submenu when hovering over disabled sibling item": {
    "error": "TypeError: Cannot read property 'nativeElement' of undefined",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatMenu nested menu should not open submenu when hovering over disabled trigger": {
    "error": "TypeError: Cannot read property 'componentInstance' of null",
    "notes": "FW-1059: DebugNode.query should query nodes in the logical tree"
  },
  "MatSnackBar with TemplateRef should be able to open a snack bar using a TemplateRef": {
    "error": "Error: Expected ' Fries Pizza  ' to contain 'Pasta'.",
    "notes": "FW-842: View engine dirty-checks projected views when the declaration place is checked"
  },
  "MatTooltip special cases should clear the `user-select` when a tooltip is set on a text field": {
    "error": "Error: Expected 'none' to be falsy.",
    "notes": "FW-1133: Inline styles are not applied before constructor is run"
  },
  "MatTooltip special cases should clear the `-webkit-user-drag` on draggable elements": {
    "error": "Error: Expected 'none' to be falsy.",
    "notes": "FW-1133: Inline styles are not applied before constructor is run"
  },
  "MatTable should be able to render a table correctly with native elements": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "MatTable should apply custom sticky CSS class to sticky cells": {
    "error": "Error: Missing definitions for header, footer, and row; cannot determine which columns should be rendered.",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should be able to filter the table contents": {
    "error": "TypeError: Cannot read property 'length' of undefined",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should be able to sort the table contents": {
    "error": "Error: Failed: Expected cell contents to be a_3 but was a_1",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should by default correctly sort an empty string": {
    "error": "Error: Failed: Expected cell contents to be  but was a_1",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should by default correctly sort undefined values": {
    "error": "Error: Failed: Expected cell contents to be  but was a_1",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should sort zero correctly": {
    "error": "Error: Failed: Expected cell contents to be -1 but was a_1",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should be able to page the table contents": {
    "error": "Error: Failed: Expected 7 total rows but got 105",
    "notes": "Unknown"
  },
  "MatTable with MatTableDataSource and sort/pagination/filter should sort strings with numbers larger than MAX_SAFE_INTEGER correctly": {
    "error": "Error: Failed: Expected cell contents to be 9563256840123535 but was a_1",
    "notes": "Unknown"
  }
};
// clang-format on
