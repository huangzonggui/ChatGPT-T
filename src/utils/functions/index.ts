export function getCurrentDate() {
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

export const genOptionByList = (list: string[]) => {
  return list.map(v => ({
    label: v,
    value: v,
  }))
}
