import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from 'vite-plugin-pwa'
export default defineConfig({
  base:'/varuaspa-agenda/',
  plugins:[react(),VitePWA({registerType:'autoUpdate',
    manifest:{name:'Varua Spa - Agenda',short_name:'VaruaSpa',
      start_url:'/varuaspa-agenda/',scope:'/varuaspa-agenda/',
      display:'standalone',background_color:'#1a120b',theme_color:'#1a120b',
      icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]}})]})
