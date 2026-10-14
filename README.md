# Varua Spa · Agenda (PWA)
1. `npm install` · `npm run dev` · `npm run build`
2. Firebase Console: Authentication → habilitar **Google**; Realtime Database → crear base y pegar `database.rules.json` en Reglas (verifica `databaseURL` en src/firebase.js).
3. Primer admin: inicia sesión una vez, copia tu UID (Authentication → Usuarios) y crea en la base `admins/<UID> = true`.
4. Cada prestador entra con Google, completa nombre/celular/color y el admin lo aprueba en Administración.
5. Despliegue: `firebase deploy` (Hosting) o Vercel/Netlify; agrega el dominio en Authentication → Dominios autorizados.
