<template>
  <div
    class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20"
  >
    <Icon name="tabler:wifi-off" class="w-3.5 h-3.5 text-red-500" />
    <span class="text-xs font-medium text-red-500">{{ $t('modules.status.disconnected') }}</span>
  </div> 
</template>
