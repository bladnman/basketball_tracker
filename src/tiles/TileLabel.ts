import * as THREE from 'three';
import { Text } from 'troika-three-text';
import {
  DAY_LABEL_COLOR,
  DAY_LABEL_INACTIVE_COLOR,
  WEEK_LABEL_COLOR,
  MONTH_LABEL_COLOR,
  TODAY_HIGHLIGHT_COLOR,
} from '../constants';

// Available sporty fonts for date numbers (using Google Fonts CDN - TTF format required by troika)
export const SPORTY_FONTS: Record<string, string> = {
  'System Default': '',
  'Bebas Neue': 'https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXooxW4.ttf',
  'Anton': 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf',
  'Oswald': 'https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs1xZogUE.ttf',
  'Black Ops One': 'https://fonts.gstatic.com/s/blackopsone/v21/qWcsB6-ypo7xBdr6Xshe96H3WDw.ttf',
};

// Default to Black Ops One for sporty look
let currentFontUrl: string = 'https://fonts.gstatic.com/s/blackopsone/v21/qWcsB6-ypo7xBdr6Xshe96H3WDw.ttf';

/**
 * Set the font for date numbers (used by debug panel)
 */
export function setDateFont(fontUrl: string): void {
  currentFontUrl = fontUrl;
}

/**
 * Get current font URL
 */
export function getDateFont(): string {
  return currentFontUrl;
}

/**
 * Get current font name
 */
export function getDateFontName(): string {
  for (const [name, url] of Object.entries(SPORTY_FONTS)) {
    if (url === currentFontUrl) return name;
  }
  return 'System Default';
}

export interface DayLabelGroup extends THREE.Group {
  dayNameText: Text;
  dayNumberText: Text;
}

export class TileLabel {
  /**
   * Create a stacked day label with day name on top, large day number below
   */
  public static createDayLabel(
    dayNumber: number,
    dayName: string,
    isToday: boolean,
    isActive: boolean = false
  ): DayLabelGroup {
    const group = new THREE.Group() as DayLabelGroup;
    // Today is always highlighted, active tiles are bright, inactive are dimmer
    const color = isToday ? TODAY_HIGHLIGHT_COLOR : (isActive ? DAY_LABEL_COLOR : DAY_LABEL_INACTIVE_COLOR);

    // Day name (top, smaller)
    const dayNameText = new Text();
    dayNameText.text = dayName;
    dayNameText.fontSize = 0.4;
    dayNameText.color = color;
    dayNameText.anchorX = 'center';
    dayNameText.anchorY = 'bottom';
    // Position above the number (moved forward for visibility)
    dayNameText.position.set(0, 0.02, 1.8);
    dayNameText.rotation.set(-Math.PI / 2, 0, 0);
    dayNameText.sync();

    // Day number (bottom, larger and bolder with sporty font)
    const dayNumberText = new Text();
    dayNumberText.text = String(dayNumber);
    if (currentFontUrl) {
      dayNumberText.font = currentFontUrl;
    }
    dayNumberText.fontSize = 1.4; // Larger to match the chunky style
    dayNumberText.color = color;
    dayNumberText.anchorX = 'center';
    dayNumberText.anchorY = 'top';
    // Position below day name, moved forward for visibility
    dayNumberText.position.set(0, 0.02, 1.9);
    dayNumberText.rotation.set(-Math.PI / 2, 0, 0);
    dayNumberText.sync();

    group.add(dayNameText);
    group.add(dayNumberText);
    group.dayNameText = dayNameText;
    group.dayNumberText = dayNumberText;

    return group;
  }

  /**
   * Create a week label (W01, W02, etc.)
   */
  public static createWeekLabel(weekNumber: string): Text {
    const text = new Text();
    text.text = weekNumber;
    text.fontSize = 0.25;
    text.color = WEEK_LABEL_COLOR;
    text.anchorX = 'center';
    text.anchorY = 'bottom';
    text.position.set(0, 2.2, 0);
    text.sync();
    return text;
  }

  /**
   * Create a month label (January 2026)
   */
  public static createMonthLabel(monthYear: string): Text {
    const text = new Text();
    text.text = monthYear;
    text.fontSize = 0.3;
    text.color = MONTH_LABEL_COLOR;
    text.anchorX = 'left';
    text.anchorY = 'bottom';
    text.position.set(-1, 2.8, 0);
    text.sync();
    return text;
  }

  /**
   * Update day label appearance
   */
  public static updateDayLabel(
    labelGroup: DayLabelGroup,
    dayNumber: number,
    dayName: string,
    isToday: boolean,
    isActive: boolean = false
  ): void {
    // Today is always highlighted, active tiles are bright, inactive are dimmer
    const color = isToday ? TODAY_HIGHLIGHT_COLOR : (isActive ? DAY_LABEL_COLOR : DAY_LABEL_INACTIVE_COLOR);

    labelGroup.dayNameText.text = dayName;
    labelGroup.dayNameText.color = color;
    labelGroup.dayNameText.sync();

    labelGroup.dayNumberText.text = String(dayNumber);
    labelGroup.dayNumberText.color = color;
    // Apply current font (in case it changed or tile is being reused)
    if (currentFontUrl) {
      labelGroup.dayNumberText.font = currentFontUrl;
    }
    labelGroup.dayNumberText.sync();
  }

  /**
   * Dispose day label group
   */
  public static disposeDayLabel(labelGroup: DayLabelGroup): void {
    labelGroup.dayNameText.dispose();
    labelGroup.dayNumberText.dispose();
  }
}
