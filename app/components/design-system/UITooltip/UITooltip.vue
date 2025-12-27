<template>
  <div 
    class="relative inline-flex items-center justify-center" 
    ref="triggerRef"
    @mouseenter="show"
    @mouseleave="hide"
    title=""
  >
    <!-- Trigger Element -->
    <slot />

    <!-- Teleported Tooltip Bubble -->
    <Teleport to="body">
      <div
        v-if="isVisible"
        ref="tooltipRef"
        class="fixed px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none transition-[opacity,transform,filter] duration-300 ease-out"
        :class="[
          widthClass,
          multiline ? 'whitespace-pre-wrap' : 'whitespace-nowrap',
          isFadingIn ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-sm translate-y-1'
        ]"
        :style="tooltipStyle"
      >
        <slot name="content">
          {{ text }}
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'

type Position = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(defineProps<{
  text?: string
  width?: string
  position?: Position
  multiline?: boolean
}>(), {
  text: '',
  width: '',
  position: 'top'
})

const widthClass = computed(() => props.width || '')
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

const isVisible = ref(false)
const isFadingIn = ref(false)
const tooltipStyle = ref<Record<string, string>>({ 
  top: '-9999px', 
  left: '-9999px', 
  zIndex: '999999' 
})

let fadeTimeout: ReturnType<typeof setTimeout> | null = null

const calculatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  
  let top = 0
  let left = 0
  const gap = 6

  switch (props.position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - gap
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
      break
    case 'bottom':
      top = triggerRect.bottom + gap
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
      left = triggerRect.left - tooltipRect.width - gap
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
      left = triggerRect.right + gap
      break
    default:
      top = triggerRect.top - tooltipRect.height - gap
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
  }

  // Prevent edge overflow
  if (left < 4) left = 4
  if (left + tooltipRect.width > window.innerWidth - 4) left = window.innerWidth - tooltipRect.width - 4
  if (top < 4) top = 4 

  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '999999'
  }
}

const show = async () => {
  if (fadeTimeout) clearTimeout(fadeTimeout)
  isVisible.value = true
  
  await nextTick()
  calculatePosition()
  
  // Force a reflow before adding the visible class for transition to work
  // Using double requestAnimationFrame for safety
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isFadingIn.value = true
    })
  })
}

const hide = () => {
  isFadingIn.value = false
  
  if (fadeTimeout) clearTimeout(fadeTimeout)
  fadeTimeout = setTimeout(() => {
    isVisible.value = false
  }, 300) // Match CSS duration
}

onBeforeUnmount(() => {
  if (fadeTimeout) clearTimeout(fadeTimeout)
})
</script>
