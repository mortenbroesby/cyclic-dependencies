const reset = "\x1b[0m"

const fg = {
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
}

const yellow = (text) => `${fg.yellow}${text}${reset}`
const red = (text) => `${fg.red}${text}${reset}`
const green = (text) => `${fg.green}${text}${reset}`

export { yellow, red, green }
