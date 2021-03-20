const iview = require('view-design')
import { convClass } from './utils'

export const Affix = convClass<iView.Affix, true>(iview.Affix)
export const AutoComplete = convClass<iView.AutoComplete, true>(iview.AutoComplete)
export const Avatar = convClass<iView.Avatar, true>(iview.Avatar)
export const BackTop = convClass<iView.BackTop, true>(iview.BackTop)
export const Badge = convClass<iView.Badge, true>(iview.Badge)
export const Button = convClass<iView.Button, true>(iview.Button)
export const ButtonGroup = convClass<iView.ButtonGroup, true>(iview.ButtonGroup)
export const Breadcrumb = convClass<iView.Breadcrumb, true>(iview.Breadcrumb)
export const BreadcrumbItem = convClass<iView.BreadcrumbItem, true>(iview.BreadcrumbItem)
export const Card = convClass<iView.Card, true>(iview.Card)
export const Carousel = convClass<iView.Carousel, true>(iview.Carousel)
export const CarouselItem = convClass<iView.CarouselItem, true>(iview.CarouselItem)
export const Checkbox = convClass<iView.Checkbox, true>(iview.Checkbox)
export const Content = convClass<iView.Content, true>(iview.Content)
export const DatePicker = convClass<iView.DatePicker, true>(iview.DatePicker)
export const TimePicker = convClass<iView.TimePicker, true>(iview.TimePicker)
export const Drawer = convClass<iView.Drawer, true>(iview.Drawer)
export const Divider = convClass<iView.Divider, true>(iview.Divider)
export const Form = convClass<iView.Form, true>(iview.Form)
export const FormItem = convClass<iView.FormItem, true>(iview.FormItem)

export const Row = convClass<iView.Row, true>(iview.Row)
export const Col = convClass<iView.Col, true>(iview.Col)
export const ColorPicker = convClass<iView.ColorPicker, true>(iview.ColorPicker)
export const Dropdown = convClass<iView.Dropdown, true>(iview.Dropdown)
export const DropdownMenu = convClass<iView.DropdownMenu, true>(iview.DropdownMenu)
export const DropdownItem = convClass<iView.DropdownItem, true>(iview.DropdownItem)

export const Header = convClass<iView.Header, true>(iview.Header)
export const Icon = convClass<iView.Icon & { custom: string }, true>(iview.Icon)
export const Input = convClass<iView.Input, true>(iview.Input)
export const InputNumber = convClass<iView.InputNumber, true>(iview.InputNumber)
export const Layout = convClass<iView.Layout, true>(iview.Layout)
export const Modal = convClass<iView.Modal, true>(iview.Modal)

export const Page = convClass<iView.Page, true>(iview.Page)
export const Poptip = convClass<iView.Poptip, true>(iview.Poptip)
export const Progress = convClass<iView.Progress, true>(iview.Progress)

export const Radio = convClass<iView.Radio, true>(iview.Radio)
export const RadioGroup = convClass<iView.RadioGroup, true>(iview.RadioGroup)

export const Menu = convClass<iView.Menu, true>(iview.Menu)
export const MenuGroup = convClass<iView.MenuGroup, true>(iview.MenuGroup)
export const MenuItem = convClass<iView.MenuItem, true>(iview.MenuItem)
// export const MenuSub = convClass<iView.MenuSub, true>(iview.MenuSub)
export const Option = convClass<iView.Option, true>(iview.Option)
export const Submenu = convClass<{ name: string }>(iview.Submenu)

export const Select = convClass<iView.Select, true>(iview.Select)
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
export const Spin = convClass<iView.Spin, true>(iview.Spin)
export const Split = convClass<iView.Split, true>(iview.Split)
export const Switch = convClass<iView.Switch, true>(iview.Switch)
export const Table = convClass<iView.Table, true>(iview.Table)
export const Tabs = convClass<iView.Tabs, true>(iview.Tabs)
export const TabPane = convClass<iView.TabPane, true>(iview.TabPane)
export const Tag = convClass<iView.Tag, true>(iview.Tag)
export const Time = convClass<iView.Time, true>(iview.Time)
export const Tooltip = convClass<iView.Tooltip, true>(iview.Tooltip)
export const Transfer = convClass<iView.Transfer, true>(iview.Transfer)
export const Upload = convClass<iView.Upload, true>(iview.Upload)

export const Collapse = convClass<iView.Collapse, true>(iview.Collapse)
export const Panel = convClass<{
  name?: String;
  'hide-arrow'?: boolean
}, true>(iview.Panel)

