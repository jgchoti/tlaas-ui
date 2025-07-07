export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://too-lazy-as-a-service.onrender.com',
        changeOrigin: true,
        secure: true,

      },
    },
  },
})