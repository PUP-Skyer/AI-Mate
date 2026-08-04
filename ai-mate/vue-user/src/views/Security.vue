<template>
  <div class="security">
    <n-h1>账号安全</n-h1>
    <n-space vertical>
      <n-card title="修改密码">
        <n-form>
          <n-form-item label="当前密码">
            <n-input v-model:value="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" />
          </n-form-item>
          <n-form-item label="新密码">
            <n-input v-model:value="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
          </n-form-item>
          <n-form-item label="确认新密码">
            <n-input v-model:value="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
          </n-form-item>
          <n-button type="primary">修改密码</n-button>
        </n-form>
      </n-card>
      <n-card title="两步验证">
        <n-space vertical>
          <n-p>启用两步验证以提高账号安全性。</n-p>
          <n-switch v-model:value="twoFactorEnabled">
            <template #checked>已开启</template>
            <template #unchecked>已关闭</template>
          </n-switch>
        </n-space>
      </n-card>
      <n-card title="登录记录">
        <n-list bordered>
          <n-list-item v-for="i in 3" :key="i">
            <n-thing :title="`设备 ${i}`" :description="`最近登录：2024-01-${10 + i}`" />
          </n-list-item>
        </n-list>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { NButton, NCard, NForm, NFormItem, NInput, NH1, NP, NSpace, NSwitch, NList, NListItem, NThing } from 'naive-ui'

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const twoFactorEnabled = ref(false)
</script>
