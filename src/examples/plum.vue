<script setup="props" lang="ts">
import { useRafFn } from '@vueuse/core'
import type { Fn } from '@vueuse/core'

const r180 = Math.PI
const r90 = Math.PI / 2
const r15 = Math.PI / 12
const color = '#88888850'

const el = ref<HTMLCanvasElement | null>(null)

const { random } = Math

const f = {
  start: () => {},
}

const init = ref(5)
const len = ref(5)
const stopped = ref(false)

function initCanvas(canvas: HTMLCanvasElement, width = 400, height = 400, _dpi?: number) {
  const ctx = canvas.getContext('2d')!

  const dpr = window.devicePixelRatio || 1
  // @ts-expect-error vendor prefix
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1

  const dpi = _dpi || dpr / bsr

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = dpi * width
  canvas.height = dpi * height
  ctx.scale(dpi, dpi)

  return { ctx, dpi }
}

function polar2cart(x = 0, y = 0, r = 0, theta = 0) {
  const dx = r * Math.cos(theta)
  const dy = r * Math.sin(theta)
  return [x + dx, y + dy]
}

onMounted(async () => {
  const canvas = el.value!
  const { ctx } = initCanvas(canvas)
  const { width, height } = canvas

  let steps: Fn[] = []
  let prevSteps: Fn[] = []

  let iterations = 0

  const step = (x: number, y: number, rad: number) => {
    const length = random() * len.value

    const [nx, ny] = polar2cart(x, y, length, rad)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(nx, ny)
    ctx.stroke()

    const rad1 = rad + random() * r15
    const rad2 = rad - random() * r15

    if (nx < -100 || nx > 500 || ny < -100 || ny > 500)
      return

    if (iterations <= init.value || random() > 0.5)
      steps.push(() => step(nx, ny, rad1))
    if (iterations <= init.value || random() > 0.5)
      steps.push(() => step(nx, ny, rad2))
  }

  let controls: ReturnType<typeof useRafFn>

  const frame = () => {
    iterations += 1
    prevSteps = steps
    steps = []

    if (!prevSteps.length) {
      controls.pause()
      stopped.value = true
    }
    prevSteps.forEach(i => i())
  }

  controls = useRafFn(frame, { immediate: false })

  f.start = () => {
    controls.pause()
    iterations = 0
    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = 1
    ctx.strokeStyle = color
    prevSteps = []
    steps = random() < 0.5
      ? [
          () => step(0, random() * 400, 0),
          () => step(400, random() * 400, r180),
        ]
      : [
          () => step(random() * 400, 0, r90),
          () => step(random() * 400, 400, -r90),
        ]
    controls.resume()
    stopped.value = false
  }

  f.start()
})
</script>

<template>
  <div>
    <canvas ref="el" width="400" height="400" border />
    <div hover:color-gray-600 duration-200 cursor-pointer mt-2 inline-block @click="f.start">
      restart
    </div>
  </div>
</template>
