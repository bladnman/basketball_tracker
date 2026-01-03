import { Text } from 'troika-three-text';
import {
  DAY_LABEL_COLOR,
  WEEK_LABEL_COLOR,
  MONTH_LABEL_COLOR,
  TODAY_HIGHLIGHT_COLOR,
} from '../constants';

export class TileLabel {
  /**
   * Create a day label (e.g., "MON 7") positioned on the table surface
   */
  public static createDayLabel(
    dayNumber: number,
    dayName: string,
    isToday: boolean
  ): Text {
    const text = new Text();
    text.text = `${dayName} ${dayNumber}`;
    text.fontSize = 0.3;
    text.color = isToday ? TODAY_HIGHLIGHT_COLOR : DAY_LABEL_COLOR;
    text.anchorX = 'center';
    text.anchorY = 'middle';
    // Position on the floor, in front of the crate
    text.position.set(0, 0.02, 1.4);
    // Rotate to lay flat on the floor, facing up toward camera
    text.rotation.set(-Math.PI / 2, 0, 0);
    text.sync();
    return text;
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
    label: Text,
    dayNumber: number,
    dayName: string,
    isToday: boolean
  ): void {
    label.text = `${dayName} ${dayNumber}`;
    label.color = isToday ? TODAY_HIGHLIGHT_COLOR : DAY_LABEL_COLOR;
    label.sync();
  }
}
