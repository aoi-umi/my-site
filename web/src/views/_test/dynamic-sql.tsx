
import { Component, Vue, Watch } from 'vue-property-decorator'

import { Input, Card, Button, Checkbox, Row, Col, Select, Option, Form, FormItem, Divider } from '@/components/iview'

import { MyList } from '@/components/my-list'
import { DynamicComp, DynamicCompType, DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { Base } from '../base'

@Component({})
export default class App extends Base {
  created () {

  }

  render () {
    return (
      <div>

      </div>
    )
  }
}
