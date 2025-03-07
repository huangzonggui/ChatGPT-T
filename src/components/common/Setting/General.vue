<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NButton, NInput, NInputGroup, NList, NListItem, NPopconfirm, NSelect, NTag, useMessage } from 'naive-ui'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'
import type { Language, Theme } from '@/store/modules/app/helper'
import { SvgIcon } from '@/components/common'
import { useAppStore, useUserStore } from '@/store'
import { getCurrentDate } from '@/utils/functions'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'

const appStore = useAppStore()
const userStore = useUserStore()

const model = ref({
  apiKey: '',
  accessToken: '',
  host: '',
})

const { isMobile } = useBasicLayout()

const ms = useMessage()

const theme = computed(() => appStore.theme)

const language = computed({
  get() {
    return appStore.language
  },
  set(value: Language) {
    appStore.setLanguage(value)
  },
})

const themeOptions: { label: string; key: Theme; icon: string }[] = [
  {
    label: 'Auto',
    key: 'auto',
    icon: 'ri:contrast-line',
  },
  {
    label: 'Light',
    key: 'light',
    icon: 'ri:sun-foggy-line',
  },
  {
    label: 'Dark',
    key: 'dark',
    icon: 'ri:moon-foggy-line',
  },
]

const languageOptions: { label: string; key: Language; value: Language }[] = [
  { label: '简体中文', key: 'zh-CN', value: 'zh-CN' },
  { label: '繁體中文', key: 'zh-TW', value: 'zh-TW' },
  { label: 'English', key: 'en-US', value: 'en-US' },
]

function exportData(): void {
  const date = getCurrentDate()
  const data: string = localStorage.getItem('chatStorage') || '{}'
  const jsonString: string = JSON.stringify(JSON.parse(data), null, 2)
  const blob: Blob = new Blob([jsonString], { type: 'application/json' })
  const url: string = URL.createObjectURL(blob)
  const link: HTMLAnchorElement = document.createElement('a')
  link.href = url
  link.download = `chat-store_${date}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function importData(event: Event): void {
  const target = event.target as HTMLInputElement
  if (!target || !target.files)
    return

  const file: File = target.files[0]
  if (!file)
    return

  const reader: FileReader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      localStorage.setItem('chatStorage', JSON.stringify(data))
      ms.success(t('common.success'))
      location.reload()
    }
    catch (error) {
      ms.error(t('common.invalidFileFormat'))
    }
  }
  reader.readAsText(file)
}

function clearData(): void {
  localStorage.removeItem('chatStorage')
  location.reload()
}

function resetHost(): void {
  userStore.resetHost()
  model.value.host = ''
}

function handleImportButtonClick(): void {
  const fileInput = document.getElementById('fileInput') as HTMLElement
  if (fileInput)
    fileInput.click()
}

const updateLoading = ref<boolean>(false)

async function checkAppUpdate() {
  const update_info = await checkUpdate()
  if (update_info.shouldUpdate) {
    try {
      ms.info('发现新版本，正在更新...')
      updateLoading.value = true
      await installUpdate()
      await relaunch()
      updateLoading.value = false
    }
    catch (error) {
      updateLoading.value = false
      ms.error(error as string)
    }
  }
  else {
    ms.info('当前是最新版本！')
  }
}
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div
        class="flex items-center space-x-4"
        :class="isMobile && 'items-start'"
      >
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.chatHistory') }}</span>

        <div class="flex flex-wrap items-center gap-4">
          <NButton size="small" @click="exportData">
            <template #icon>
              <SvgIcon icon="ri:download-2-fill" />
            </template>
            {{ $t('common.export') }}
          </NButton>

          <input id="fileInput" type="file" style="display:none" @change="importData">
          <NButton size="small" @click="handleImportButtonClick">
            <template #icon>
              <SvgIcon icon="ri:upload-2-fill" />
            </template>
            {{ $t('common.import') }}
          </NButton>

          <NPopconfirm placement="bottom" @positive-click="clearData">
            <template #trigger>
              <NButton size="small">
                <template #icon>
                  <SvgIcon icon="ri:close-circle-line" />
                </template>
                {{ $t('common.clear') }}
              </NButton>
            </template>
            {{ $t('chat.clearHistoryConfirm') }}
          </NPopconfirm>

          <NPopconfirm placement="bottom" @positive-click="resetHost">
            <template #trigger>
              <NButton size="small">
                <template #icon>
                  <SvgIcon icon="ri:close-circle-line" />
                </template>
                {{ '恢复默认Host设置' }}
              </NButton>
            </template>
            {{ '确定？' }}
          </NPopconfirm>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.theme') }}</span>
        <div class="flex flex-wrap items-center gap-4">
          <template v-for="item of themeOptions" :key="item.key">
            <NButton
              size="small"
              :type="item.key === theme ? 'primary' : undefined"
              @click="appStore.setTheme(item.key)"
            >
              <template #icon>
                <SvgIcon :icon="item.icon" />
              </template>
            </NButton>
          </template>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.language') }}</span>
        <div class="flex flex-wrap items-center gap-4">
          <NSelect
            style="width: 140px"
            :value="language"
            :options="languageOptions"
            @update-value="value => appStore.setLanguage(value)"
          />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">更新</span>
        <div class="flex flex-wrap items-center gap-4">
          <NButton size="small" :loading="updateLoading" :disabled="updateLoading" @click="checkAppUpdate">
            <template #icon>
              <SvgIcon icon="ri:download-2-fill" />
            </template>
            检查更新
          </NButton>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">Api Key 列表</span>
        <div class="flex-wrap items-center gap-4">
          <NInputGroup>
            <NButton @click="userStore.addApiKey(model.apiKey)">
              添加
            </NButton>
            <NInput v-model:value="model.apiKey" />
          </NInputGroup>
          <NList>
            <NListItem v-for="item in userStore.userConfig.apiKeyList" :key="item">
              <NButton @click="userStore.deleteApiKey(item)">
                删除
              </NButton>
              <NTag type="info" class="m-2">
                {{ item }}
              </NTag>
            </NListItem>
          </NList>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">Access Token 列表</span>
        <div class="flex flex-wrap items-center gap-4">
          <NInputGroup>
            <NButton @click="userStore.addAccessToken(model.accessToken)">
              添加
            </NButton>
            <NInput v-model:value="model.accessToken" class="w-[300px]" />
          </NInputGroup>
          <NList>
            <NListItem v-for="item in userStore.userConfig.accessTokenList" :key="item">
              <NButton @click="userStore.deleteAccessToken(item)">
                删除
              </NButton>
              <NTag type="info" class="m-2">
                {{ item }}
              </NTag>
            </NListItem>
          </NList>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">Host 列表</span>
        <div class="flex flex-wrap items-center gap-4">
          <NInputGroup>
            <NButton @click="userStore.addHost(model.host)">
              添加
            </NButton>
            <NInput v-model:value="model.host" />
          </NInputGroup>
          <NList>
            <NListItem v-for="item in userStore.userConfig.hostList" :key="item">
              <NButton @click="userStore.deleteHost(item)">
                删除
              </NButton>
              <NTag type="info" class="m-2">
                {{ item }}
              </NTag>
            </NListItem>
          </NList>
        </div>
      </div>
    </div>
  </div>
</template>
