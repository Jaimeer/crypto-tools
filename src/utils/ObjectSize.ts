import prettyBytes from 'pretty-bytes'

export const ObjectSize = {
  // TODO: Type obj
  calculate: (object: Record<string, unknown>) => {
    const jsonString = JSON.stringify(object)
    const byteSize = new Blob([jsonString]).size
    return prettyBytes(byteSize)
  },
}
