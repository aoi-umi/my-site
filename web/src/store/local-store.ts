export class LocalStore {
  static getItem (key) {
    let v: any = localStorage.getItem(key)
    if (![null, undefined].includes(v)) {
      try {
        v = JSON.parse(v)
      } catch (e) { }
    }
    return v
  }

  static setItem (key, val) {
    return localStorage.setItem(key, JSON.stringify(val))
  }

  static removeItem (key) {
    return localStorage.removeItem(key)
  }
}
