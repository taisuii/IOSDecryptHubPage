<script setup>
import { computed, ref } from 'vue'

const bundleId = ref('com.example.app')
const version = ref('1.2.0')
const submitted = ref(false)

const preview = computed(() => {
  const id = bundleId.value.trim() || 'com.example.app'
  const ver = version.value.trim() || '0.0.0'
  return [
    'task: decrypt',
    `bundle: ${id}`,
    `version: ${ver}`,
    'status: queued (demo only)',
    'note: 此页面不会发起真实请求',
  ].join('\n')
})

function onSubmit() {
  submitted.value = true
}
</script>

<template>
  <main class="demo-layout">
    <h1>交互演示</h1>
    <p>填写一个假的 Bundle ID，看看前端如何组装一条“解密任务”预览。</p>

    <div class="panel demo-card">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="bundle">Bundle Identifier</label>
          <input
            id="bundle"
            v-model="bundleId"
            type="text"
            placeholder="com.example.app"
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="version">Version</label>
          <input
            id="version"
            v-model="version"
            type="text"
            placeholder="1.0.0"
            autocomplete="off"
          />
        </div>
        <button class="btn btn-primary" type="submit">生成预览</button>
      </form>

      <div v-if="submitted" class="result">{{ preview }}</div>
      <div v-else class="result warn">提交后会在这里显示任务预览。</div>
    </div>
  </main>
</template>
