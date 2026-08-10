// Page Layout Constants
export const PAGE_WIDTH = 210  // A4 width in mm
export const PAGE_HEIGHT = 297  // A4 height in mm

export const PAGE_MARGIN_TOP = 15
export const PAGE_MARGIN_BOTTOM = 15
export const PAGE_MARGIN_LEFT = 15
export const PAGE_MARGIN_RIGHT = 15

export const HEADER_HEIGHT = 35
export const FOOTER_HEIGHT = 35

export const CONTENT_TOP = PAGE_MARGIN_TOP + HEADER_HEIGHT
export const CONTENT_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - FOOTER_HEIGHT

// Spacing Constants
export const SECTION_MARGIN = 8
export const BLOCK_MARGIN = 6
export const ROW_HEIGHT = 6
export const TABLE_HEADER_HEIGHT = 8
export const TITLE_MARGIN = 10

// Table Constants
export const TABLE_COL_WIDTHS = {
  ID: 25,
  NAME: 45,
  STATUS: 35,
  TIME: 25
}

export const TABLE_COL_STARTS = {
  ID: PAGE_MARGIN_LEFT,
  NAME: PAGE_MARGIN_LEFT + TABLE_COL_WIDTHS.ID,
  STATUS: PAGE_MARGIN_LEFT + TABLE_COL_WIDTHS.ID + TABLE_COL_WIDTHS.NAME,
  TIME: PAGE_MARGIN_LEFT + TABLE_COL_WIDTHS.ID + TABLE_COL_WIDTHS.NAME + TABLE_COL_WIDTHS.STATUS
}

// Summary Box Constants
export const SUMMARY_BOX_WIDTH = 40
export const SUMMARY_BOX_HEIGHT = 35
export const SUMMARY_BOX_GAP = 5

// Category Summary Table Constants
export const CATEGORY_TABLE_COL_WIDTHS = [30, 25, 25, 25, 25, 25]
export const CATEGORY_TABLE_COL_STARTS = [15, 45, 70, 95, 120, 145]
