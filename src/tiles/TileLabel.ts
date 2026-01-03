import * as THREE from 'three';
import { Text } from 'troika-three-text';
import {
  DAY_LABEL_COLOR,
  WEEK_LABEL_COLOR,
  MONTH_LABEL_COLOR,
  TODAY_HIGHLIGHT_COLOR,
} from '../constants';

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
    isToday: boolean
  ): DayLabelGroup {
    const group = new THREE.Group() as DayLabelGroup;
    const color = isToday ? TODAY_HIGHLIGHT_COLOR : DAY_LABEL_COLOR;

    // Day name (top, smaller)
    const dayNameText = new Text();
    dayNameText.text = dayName;
    dayNameText.fontSize = 0.4;
    dayNameText.color = color;
    dayNameText.anchorX = 'center';
    dayNameText.anchorY = 'bottom';
    // Position above the number
    dayNameText.position.set(0, 0.02, 1.1);
    dayNameText.rotation.set(-Math.PI / 2, 0, 0);
    dayNameText.sync();

    // Day number (bottom, larger)
    const dayNumberText = new Text();
    dayNumberText.text = String(dayNumber);
    dayNumberText.fontSize = 0.9;
    dayNumberText.color = color;
    dayNumberText.anchorX = 'center';
    dayNumberText.anchorY = 'top';
    // Position below, slightly closer to camera (larger Z)
    dayNumberText.position.set(0, 0.02, 1.25);
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
    isToday: boolean
  ): void {
    const color = isToday ? TODAY_HIGHLIGHT_COLOR : DAY_LABEL_COLOR;

    labelGroup.dayNameText.text = dayName;
    labelGroup.dayNameText.color = color;
    labelGroup.dayNameText.sync();

    labelGroup.dayNumberText.text = String(dayNumber);
    labelGroup.dayNumberText.color = color;
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
