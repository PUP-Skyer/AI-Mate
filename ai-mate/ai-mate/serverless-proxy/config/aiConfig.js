/**
 * AI API 配置
 * 所有API Key从环境变量读取，不硬编码
 */

module.exports = {
  // 智谱GLM配置
  zhipu: {
    baseUrl: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.ZHIPU_API_KEY || '',
    model: process.env.ZHIPU_MODEL || 'glm-4-plus',
    // GLM-5.1 暂用 glm-4-plus 作为默认模型，可根据实际情况调整
  },

  // Coze配置
  coze: {
    baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.cn/v3',
    apiKey: process.env.COZE_API_KEY || '',
    botId: process.env.COZE_BOT_ID || '',
  },

  // WorkBuddy MCP配置
  workbuddy: {
    baseUrl: process.env.WORKBUDDY_MCP_URL || 'http://localhost:8081/mcp',
    apiKey: process.env.WORKBUDDY_API_KEY || '',
  },

  // Trae MCP配置
  trae: {
    baseUrl: process.env.TRAE_MCP_URL || 'http://localhost:8082/mcp',
    apiKey: process.env.TRAE_API_KEY || '',
  },

  // 服务配置
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'ai-mate-default-secret-change-in-production',
    promptGuardMode: process.env.PROMPT_GUARD_MODE || 'sanitize', // 'reject' | 'sanitize' | 'log'
    contentFilterMode: process.env.CONTENT_FILTER_MODE || 'sanitize', // 'reject' | 'sanitize' | 'log'
    maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH || '8000', 10),
  },
};
