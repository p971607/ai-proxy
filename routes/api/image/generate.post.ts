// 图像生成 API（ComfyUI）
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    // 转发请求到 ComfyUI 服务
    const response = await $fetch(`${config.comfyuiServerUrl}/api/generate`, {
      method: 'POST',
      body,
      // 返回原始响应（图像文件）
      responseType: 'arrayBuffer',
    })

    // 设置响应头
    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="image.png"',
    })

    return response
  } catch (error: any) {
    console.error('Image generation service error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Image generation service error',
    })
  }
})

