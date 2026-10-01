<template>
  <div class="flex justify-center">
    <TDropdownMenu>
      <TDropdownMenuTrigger as-child>
        <TButton variant="outline">通知频率</TButton>
      </TDropdownMenuTrigger>
      <TDropdownMenuContent class="w-48">
        <TRadioGroup default-value="daily" class="p-1">
          <TRadioGroupItem value="daily" class="px-2 py-1.5">每天</TRadioGroupItem>
          <TRadioGroupItem value="weekly" class="px-2 py-1.5">每周</TRadioGroupItem>
          <TRadioGroupItem value="never" class="px-2 py-1.5">从不</TRadioGroupItem>
        </TRadioGroup>
      </TDropdownMenuContent>
    </TDropdownMenu>
  </div>
</template>
