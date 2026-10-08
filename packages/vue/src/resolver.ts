/**
 * unplugin-vue-components 专用 Resolver：
 * 消费者配置后可在模板中直接使用 <TButton> / <t-button>，无需手动 import。
 *
 * 采用白名单而非裸 /^T[A-Z]/ 正则，避免误捕 Vue 内置组件
 * （Transition/Teleport 等 T 开头名称会被 slice(1) 解析成错误导入）。
 * 白名单与 index.ts 的组件导出保持同步（resolver.test.ts 强制校验）。
 */
export const COMPONENT_NAMES = [
  "Avatar",
  "Badge",
  "Button",
  "Card",
  "CardContent",
  "CardDescription",
  "CardFooter",
  "CardHeader",
  "CardTitle",
  "Checkbox",
  "Dialog",
  "DialogClose",
  "DialogContent",
  "DialogDescription",
  "DialogFooter",
  "DialogHeader",
  "DialogTitle",
  "DialogTrigger",
  "DropdownMenu",
  "DropdownMenuContent",
  "DropdownMenuGroup",
  "DropdownMenuItem",
  "DropdownMenuLabel",
  "DropdownMenuSeparator",
  "DropdownMenuTrigger",
  "Field",
  "FieldErrorText",
  "FieldHelperText",
  "FieldInput",
  "FieldLabel",
  "FieldTextarea",
  "Input",
  "Label",
  "Popover",
  "PopoverContent",
  "PopoverTrigger",
  "RadioGroup",
  "RadioGroupItem",
  "Select",
  "SelectContent",
  "SelectItem",
  "SelectTrigger",
  "SelectValueText",
  "Separator",
  "Skeleton",
  "Slider",
  "Slot",
  "Switch",
  "Tabs",
  "TabsContent",
  "TabsList",
  "TabsTrigger",
  "Textarea",
  "Tooltip",
  "TooltipContent",
  "TooltipTrigger",
] as const;

/** 结构兼容 unplugin-vue-components 的 ComponentResolveResult，无需依赖其类型 */
export interface ComponentResolveResult {
  name: string;
  from: string;
}

export type ComponentResolver = (name: string) => ComponentResolveResult | undefined;

export function TuDesignResolver(): ComponentResolver {
  return (name) => {
    if (!/^T[A-Z]/.test(name)) return;
    const partial = name.slice(1);
    if (!(COMPONENT_NAMES as readonly string[]).includes(partial)) return;
    return { name: partial, from: "@tu-design/vue" };
  };
}
