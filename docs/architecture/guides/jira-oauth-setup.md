# Guía: Configurar OAuth 2.0 con Jira Cloud para Yappie

Esta guía te lleva paso a paso desde cero hasta tener Yappie exportando tickets a Jira. Está pensada tanto para desarrollo local como para contribuidores del proyecto open source.

**Tiempo estimado:** 15-20 minutos.

**Requisitos previos:**

- Una cuenta de Atlassian (gratuita). Si no tienes una, créala en [atlassian.com](https://www.atlassian.com).
- Un sitio de Jira Cloud (el plan free funciona perfecto). Puedes crear uno en [jira.atlassian.com](https://www.atlassian.com/software/jira/free).
- Yappie corriendo en local (`docker compose up`).

---

## Paso 1: Crear la app en Atlassian Developer Console

1. Ve a [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps/)
2. Haz clic en **"Create"** → selecciona **"OAuth 2.0 integration"**
3. Ponle nombre: `Yappie (dev)` (o lo que quieras, es solo para identificarla)
4. Acepta los términos y haz clic en **"Create"**

Ya tienes tu app. Ahora hay que configurar tres cosas: permisos, callback URL, y copiar las credenciales.

---

## Paso 2: Configurar permisos (scopes)

1. En el menú lateral de tu app, haz clic en **"Permissions"**
2. Busca **"Jira API"** y haz clic en **"Add"**
3. Haz clic en **"Configure"** junto a Jira API
4. Añade estos scopes (son los mínimos que Yappie necesita):

| Scope             | Para qué lo usa Yappie              |
| ----------------- | ----------------------------------- |
| `read:jira-work`  | Leer proyectos y issues del usuario |
| `write:jira-work` | Crear issues (exportar tickets)     |
| `read:jira-user`  | Obtener info del usuario conectado  |

5. Haz clic en **"Save"**

> **Nota:** Si en el futuro quieres que Yappie lea los issues existentes para dar más contexto (feature post-MVP), necesitarás `read:jira-work` que ya tienes.

---

## Paso 3: Configurar la Callback URL

1. En el menú lateral, haz clic en **"Authorization"**
2. Junto a **"OAuth 2.0 (3LO)"**, haz clic en **"Configure"**
3. En **"Callback URL"**, introduce:

**Para desarrollo local:**

```
http://localhost:3001/api/v1/integrations/jira/callback
```

**Para producción (cuando despliegues):**

```
https://tu-dominio.com/api/v1/integrations/jira/callback
```

4. Haz clic en **"Save changes"**

> **Importante:** La callback URL debe coincidir EXACTAMENTE con la que configures en tu `.env`. Si hay una diferencia (http vs https, puerto, ruta), Jira rechazará la autorización con un error críptico.

---

## Paso 4: Copiar Client ID y Client Secret

1. En el menú lateral, haz clic en **"Settings"**
2. Copia estos dos valores:
   - **Client ID** → lo verás directamente
   - **Secret** → haz clic en **"Create secret"** si no tienes uno, luego cópialo

> **⚠️ El secret solo se muestra una vez.** Cópialo ahora y guárdalo en un lugar seguro. Si lo pierdes, tendrás que generar uno nuevo.

---

## Paso 5: Configurar Yappie

1. Abre tu archivo `.env` (o crea uno copiando `.env.example`)
2. Rellena estas variables:

```bash
# Jira OAuth 2.0
JIRA_CLIENT_ID=tu-client-id-aquí
JIRA_CLIENT_SECRET=tu-secret-aquí
JIRA_REDIRECT_URI=http://localhost:3001/api/v1/integrations/jira/callback
```

3. Reinicia la API:

```bash
# Si usas Docker
docker compose restart api

# Si corres la API directamente
npm run dev --filter=api
```

---

## Paso 6: Probar la conexión

1. Abre Yappie en el navegador: `http://localhost:3000`
2. Ve a **Settings → Integraciones**
3. Haz clic en **"Conectar Jira"**
4. Se abrirá la pantalla de autorización de Atlassian:
   - Selecciona tu sitio de Jira
   - Haz clic en **"Allow"**
5. Serás redirigido de vuelta a Yappie
6. Deberías ver **"Jira conectado ✅"** con el nombre de tu sitio

---

## Paso 7: Probar la exportación de un ticket

1. Sube un audio de prueba y espera a que se generen los tickets
2. En un ticket generado, haz clic en **"Exportar a Jira"**
3. Selecciona el proyecto de Jira destino
4. Haz clic en **"Exportar"**
5. Verifica que el issue apareció en tu board de Jira

Si todo funciona, deberías ver el link directo al issue de Jira junto al ticket en Yappie.

---

## Troubleshooting

### "Invalid redirect URI"

La callback URL en tu `.env` no coincide con la configurada en Atlassian Developer Console. Comprueba que sean idénticas, incluyendo el protocolo (http/https) y el puerto.

### "Access denied" al autorizar

Revisa que hayas añadido los scopes correctos en el paso 2. Si añades scopes después de haber autorizado, necesitas desconectar y volver a conectar Jira.

### "401 Unauthorized" al crear un issue

El access token ha expirado. Yappie debería refrescar el token automáticamente, pero si falla, desconecta y reconecta Jira desde Settings.

### El issue se crea pero sin campos correctos

Comprueba que el proyecto de Jira tiene los tipos de issue que Yappie intenta crear (Task, Bug, Story). Algunos proyectos personalizados no tienen todos los tipos por defecto.

### "CORS error" en la consola del navegador

Asegúrate de que tu API (NestJS) tiene CORS configurado para permitir requests desde `http://localhost:3000`. Esto ya debería estar configurado si usas el Docker Compose del proyecto.

---

## Cómo funciona internamente

Para los curiosos (o para contribuidores que quieran entender el flujo):

```
1. Usuario hace clic en "Conectar Jira"
   └→ Frontend llama GET /api/integrations/jira/auth-url
   └→ API genera URL de Atlassian con client_id, redirect_uri, scopes, y state (CSRF token)
   └→ Frontend redirige al usuario a esa URL

2. Usuario autoriza en Atlassian
   └→ Atlassian redirige a /api/v1/integrations/jira/callback?code=XXX&state=YYY
   └→ API verifica el state (anti-CSRF)
   └→ API intercambia el code por access_token + refresh_token
      POST https://auth.atlassian.com/oauth/token
      { grant_type: "authorization_code", client_id, client_secret, code, redirect_uri }
   └→ API obtiene el cloud_id del sitio de Jira
      GET https://api.atlassian.com/oauth/token/accessible-resources
   └→ API guarda en DB: access_token (encriptado), refresh_token (encriptado), cloud_id
   └→ Redirige al usuario al dashboard con "Jira conectado ✅"

3. Usuario exporta un ticket
   └→ API lee los tokens de DB, los desencripta
   └→ Si el access_token expiró, usa el refresh_token para obtener uno nuevo
      POST https://auth.atlassian.com/oauth/token
      { grant_type: "refresh_token", client_id, client_secret, refresh_token }
   └→ API crea el issue en Jira
      POST https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue
      {
        fields: {
          project: { key: "PROJ" },
          summary: ticket.title,
          description: { type: "doc", content: [...] },  // ADF format
          issuetype: { name: "Task" },
          priority: { name: "High" },
          labels: ticket.labels
        }
      }
   └→ API guarda jira_issue_key y jira_issue_url en el ticket
```

> **Nota sobre el formato de descripción:** Jira Cloud API v3 usa Atlassian Document Format (ADF) para las descripciones, no markdown. Yappie convierte el markdown del ticket a ADF automáticamente antes de enviar. Si contribuyes al JiraModule, ten esto en cuenta.

---

## Para contribuidores: testing sin cuenta de Jira

Si quieres contribuir a Yappie y no tienes (o no quieres crear) una cuenta de Jira, los tests del JiraModule usan MSW (Mock Service Worker) para simular todas las respuestas de Atlassian. Puedes correr `npm run test` sin ninguna configuración de Jira.

Para tests de integración manuales, Atlassian ofrece cuentas gratuitas. Un sitio de Jira free con hasta 10 usuarios es más que suficiente para desarrollo.

---

## Links útiles

- [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
- [Documentación OAuth 2.0 (3LO) de Atlassian](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [Scopes disponibles para Jira](https://developer.atlassian.com/cloud/jira/platform/scopes-for-oauth-2-3LO-and-forge-apps/)
- [Jira Cloud REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Atlassian Document Format (ADF)](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/)
