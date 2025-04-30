import { LineType, OverlayTemplate } from 'klinecharts'

export function isValid<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isFunction<T = (...args: unknown[]) => unknown>(
  value: unknown,
): value is T {
  return typeof value === 'function'
}

export const simpleAnnotationDown: OverlayTemplate = {
  name: 'simpleAnnotationDown',
  totalStep: 2,
  styles: {
    line: { style: LineType.Dashed },
  },
  createPointFigures: ({ overlay, coordinates }) => {
    let text = ''
    if (isValid(overlay.extendData)) {
      if (!isFunction(overlay.extendData)) {
        text = (overlay.extendData ?? '') as string
      } else {
        text = overlay.extendData(overlay) as string
      }
    }
    const startX = coordinates[0].x
    const startY = coordinates[0].y + 6
    const lineEndY = startY + 15
    const arrowEndY = lineEndY + 5
    return [
      {
        type: 'line',
        attrs: {
          coordinates: [
            { x: startX, y: startY },
            { x: startX, y: lineEndY },
          ],
        },
        ignoreEvent: true,
      },
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: startX, y: lineEndY },
            { x: startX - 4, y: arrowEndY },
            { x: startX + 4, y: arrowEndY },
          ],
        },
        ignoreEvent: true,
      },
      {
        type: 'text',
        attrs: {
          x: startX,
          y: arrowEndY + 20,
          text,
          align: 'center',
          baseline: 'bottom',
        },
        ignoreEvent: true,
      },
    ]
  },
}
