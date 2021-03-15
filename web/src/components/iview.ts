import * as iviewTypes from 'view-design'
const iview = require('view-design')

import { convClass } from './utils'

export const Affix = convClass<iviewTypes.Affix, true>(iview.Affix)
export const AutoComplete = convClass<iviewTypes.AutoComplete, true>(iview.AutoComplete)
export const Avatar = convClass<iviewTypes.Avatar, true>(iview.Avatar)
export const BackTop = convClass<iviewTypes.BackTop, true>(iview.BackTop)
export const Badge = convClass<iviewTypes.Badge, true>(iview.Badge)
export const Button = convClass<iviewTypes.Button, true>(iview.Button)
export const ButtonGroup = convClass<iviewTypes.ButtonGroup, true>(iview.ButtonGroup)
export const Card = convClass<iviewTypes.Card, true>(iview.Card)
export const Carousel = convClass<iviewTypes.Carousel, true>(iview.Carousel)
export const CarouselItem = convClass<iviewTypes.CarouselItem, true>(iview.CarouselItem)
export const Checkbox = convClass<iviewTypes.Checkbox, true>(iview.Checkbox)
export const Content = convClass<iviewTypes.Content, true>(iview.Content)
export const DatePicker = convClass<iviewTypes.DatePicker, true>(iview.DatePicker)
export const TimePicker = convClass<iviewTypes.TimePicker, true>(iview.TimePicker)
export const Drawer = convClass<iviewTypes.Drawer, true>(iview.Drawer)
export const Divider = convClass<iviewTypes.Divider, true>(iview.Divider)
export const Form = convClass<iviewTypes.Form, true>(iview.Form)
export const FormItem = convClass<iviewTypes.FormItem, true>(iview.FormItem)

export const Row = convClass<iviewTypes.Row, true>(iview.Row)
export const Col = convClass<iviewTypes.Col, true>(iview.Col)
export const ColorPicker = convClass<iviewTypes.ColorPicker, true>(iview.ColorPicker)
export const Dropdown = convClass<iviewTypes.Dropdown, true>(iview.Dropdown)
export const DropdownMenu = convClass<iviewTypes.DropdownMenu, true>(iview.DropdownMenu)
export const DropdownItem = convClass<iviewTypes.DropdownItem, true>(iview.DropdownItem)

export const Header = convClass<iviewTypes.Header, true>(iview.Header)
export const Icon = convClass<iviewTypes.Icon & { custom: string }, true>(iview.Icon)
export const Input = convClass<iviewTypes.Input, true>(iview.Input)
export const InputNumber = convClass<iviewTypes.InputNumber, true>(iview.InputNumber)
export const Layout = convClass<iviewTypes.Layout, true>(iview.Layout)
export const Modal = convClass<iviewTypes.Modal, true>(iview.Modal)

export const Page = convClass<iviewTypes.Page, true>(iview.Page)
export const Poptip = convClass<iviewTypes.Poptip, true>(iview.Poptip)
export const Progress = convClass<iviewTypes.Progress, true>(iview.Progress)

export const Radio = convClass<iviewTypes.Radio, true>(iview.Radio)
export const RadioGroup = convClass<iviewTypes.RadioGroup, true>(iview.RadioGroup)

export const Menu = convClass<iviewTypes.Menu, true>(iview.Menu)
export const MenuGroup = convClass<iviewTypes.MenuGroup, true>(iview.MenuGroup)
export const MenuItem = convClass<iviewTypes.MenuItem, true>(iview.MenuItem)
// export const MenuSub = convClass<iviewTypes.MenuSub, true>(iview.MenuSub)
export const Option = convClass<iviewTypes.Option, true>(iview.Option)
export const Submenu = convClass<{ name: string }>(iview.Submenu)

export const Select = convClass<iviewTypes.Select, true>(iview.Select)
export const Sider = convClass<{
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  value?: boolean;
  width?: number;
  collapsible?: boolean;
  'collapsed-width'?: number;
  'hide-trigger'?: boolean;
  'default-collapsed'?: boolean;
  'reverse-arrow'?: boolean;
}>(iview.Sider)
export const Spin = convClass<iviewTypes.Spin, true>(iview.Spin)
export const Split = convClass<iviewTypes.Split, true>(iview.Split)
export const Switch = convClass<iviewTypes.Switch, true>(iview.Switch)
export const Table = convClass<iviewTypes.Table, true>(iview.Table)
export const Tabs = convClass<iviewTypes.Tabs, true>(iview.Tabs)
export const TabPane = convClass<iviewTypes.TabPane, true>(iview.TabPane)
export const Tag = convClass<iviewTypes.Tag, true>(iview.Tag)
export const Time = convClass<iviewTypes.Time, true>(iview.Time)
export const Tooltip = convClass<iviewTypes.Tooltip, true>(iview.Tooltip)
export const Transfer = convClass<iviewTypes.Transfer, true>(iview.Transfer)
export const Upload = convClass<iviewTypes.Upload, true>(iview.Upload)

export const Collapse = convClass<iviewTypes.Collapse, true>(iview.Collapse)
export const Panel = convClass<{
  name?: String;
  'hide-arrow'?: boolean
}, true>(iview.Panel)

