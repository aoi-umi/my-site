
import * as fxp from 'fast-xml-parser'

function xmlEscape (text) {
  return text.replace(/[<>"&']/g, function (match, pos, originalText) {
    switch (match) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '"': return '&quot;'
      case "'": return '&apos;'
    }
  })
}
let _j2xParser: fxp.j2xParser
const xmlAttrKey = 'attr_'

export class Xml {
  private static get j2xParser () {
    if (!_j2xParser) {
      let j2xParser = new fxp.j2xParser({
        attrNodeName: xmlAttrKey,
        tagValueProcessor: a => {
          if (typeof a !== 'string') return a
          return escape(a)
        },
        attrValueProcessor: a => {
          if (typeof a !== 'string') return a
          return escape(a)
        }
      })
      _j2xParser = j2xParser
    }
    return _j2xParser
  }

  static xml2json (xml: string, opt?): Object {
    let json = fxp.parse(xml, {
      attributeNamePrefix: xmlAttrKey,
      ignoreAttributes: false,
      parseTrueNumberOnly: true
    })
    function removeAttrPrefix (o) {
      let obj = o instanceof Array ? [] : {}
      for (let k in o) {
        let newK = k.replace(xmlAttrKey, '')
        if (typeof o[k] === 'object') {
          obj[newK] = removeAttrPrefix(o[k])
        } else {
          obj[newK] = o[k]
        }
      }
      return obj
    }
    return removeAttrPrefix(json)
  }
}
