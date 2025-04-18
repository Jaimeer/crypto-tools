import md5 from 'md5'

export const HashLib = {
  // TODO: Type obj
  generateHash: (text: string) => {
    const hash = md5(text)
    return hash
  },
}
