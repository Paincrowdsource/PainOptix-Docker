/**
 * Central PDF layout constants - single source of truth
 * All measurements in millimeters (mm) unless specified
 */

// Page dimensions (A4)
export const PAGE_W_MM = 210;          // A4 width
export const PAGE_H_MM = 297;          // A4 height
export const FOOTER_H_MM = 15;         // total space footer occupies
export const DISCLAIMER_H_MM = 90;     // height of disclaimer block

// Margins
export const MARGIN_MM = 25;           // 25mm on all sides

// Content area
export const TEXT_W_MM = PAGE_W_MM - (MARGIN_MM * 2);  // 160mm

// Typography
export const BULLET_R_MM = 1.6;        // Circle bullet radius
export const LEAD_MM = 6;              // Line height = 6mm
export const FONT_BODY = 12;           // pt - enhanced & free
export const FONT_MONO = 11;           // pt - monograph
export const FONT_HEADER = 16;         // pt - section headers
export const FONT_FOOTER = 9;          // pt - page footers
export const BODY_FONT_SIZE_ENH = 12;  // enhanced / free
export const BODY_FONT_SIZE_MONO = 11; // monograph

// Spacing
export const PARA_GAP_MM = 2;          // Gap between paragraphs
export const SECTION_GAP_MM = 10;      // Gap between sections
export const HEADER_HEIGHT_MM = 20;    // Blue header bar height
export const TEXT_WIDTH_MM = 160;      // Text width
export const SPACING = {
  line: 7,
  paragraph: 8,
  bullet: 5,
  section: 12,
  header: 10,
};

// Colors (RGB)
export const COLOR_PRIMARY = { r: 11, g: 83, b: 148 };     // Blue
export const COLOR_BLACK = { r: 0, g: 0, b: 0 };           // Pure black
export const COLOR_WHITE = { r: 255, g: 255, b: 255 };     // White
export const COLOR_LIGHT_BLUE = { r: 230, g: 244, b: 255 }; // Light blue
export const COLOR_LIGHT_GRAY = { r: 200, g: 200, b: 200 }; // Light gray