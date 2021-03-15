import './style.less'

const clsPrefix = 'my-comp-'
export const cls = {
  mask: '',
  center: '',
  circle: '',
  pointer: ''
}
for (const key in cls) {
  cls[key] = clsPrefix + (cls[key] || key)
}
