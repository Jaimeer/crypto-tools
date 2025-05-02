import pc from 'picocolors'

export class LoggerService {
  private prefix: string
  private showColors = false
  constructor(prefix: string, showColors = true) {
    this.prefix = prefix
    this.showColors = showColors
  }

  info(message: string) {
    console.info(this.parseMessage('info', message))
  }
  error(message: string) {
    console.error(this.parseMessage('error', message))
  }
  warn(message: string) {
    console.warn(this.parseMessage('warn', message))
  }
  debug(message: string) {
    console.debug(this.parseMessage('debug', message))
  }

  private parseMessage(
    level: 'debug' | 'warn' | 'error' | 'info',
    message: string,
  ) {
    const date = new Date()
    const levelText = {
      debug: pc.blue('DEBUG'),
      warn: pc.yellow('WARN'),
      error: pc.red('ERROR'),
      info: pc.green('INFO'),
    }

    if (!this.showColors)
      return [
        date.toISOString().split('T')[1],
        `${level}`,
        `${this.prefix}`,
        message,
      ].join(' ')

    return [
      pc.gray(date.toISOString().split('T')[1]),
      `${levelText[level]}`,
      `${pc.magenta(this.prefix)}`,
      message,
    ].join(' ')
  }
}
