const reset = "\x1b[0m"

const fg = {
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  white: "\x1b[37m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
}

export const yellow = (text) => `${fg.yellow}${text}${reset}`
export const red = (text) => `${fg.red}${text}${reset}`
export const green = (text) => `${fg.green}${text}${reset}`
export const white = (text) => `${fg.white}${text}${reset}`
export const blue = (text) => `${fg.blue}${text}${reset}`
export const gray = (text) => `${fg.gray}${text}${reset}`
