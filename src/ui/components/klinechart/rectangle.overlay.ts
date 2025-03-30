import { OverlayTemplate } from 'klinecharts'

export const rectangle: OverlayTemplate = {
  name: 'rectangle',
  totalStep: 2,
  createPointFigures: ({ coordinates }) => {
    return {
      type: 'rect',
      attrs: {
        x: coordinates[0].x,
        y: coordinates[0].y,
        width: coordinates[1].x - coordinates[0].x,
        height: coordinates[1].y - coordinates[0].y,
      },
    }
  },
}
