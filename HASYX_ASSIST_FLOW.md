Конечно! Вот полный чек-лист и пошаговая инструкция, что и где нужно получить, чтобы полностью пройти настройку проекта с Hasyx, OAuth, БД, облаком и деплоем.

---

## 1. **Google OAuth (Google Client ID и Secret)**
**Зачем:** Для входа через Google-аккаунт.

**Что делать:**
1. Перейти в [Google Cloud Console](https://console.developers.google.com/apis/credentials).
2. Создать проект (если нет).
3. В меню "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID".
4. Тип приложения: **Web application**.
5. В "Authorized redirect URIs" добавить:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Сохранить, скопировать **Client ID** и **Client Secret**.
7. Ввести их в терминал, когда Hasyx ассистент попросит.

---

## 2. **Yandex OAuth (Client ID и Secret)**
**Зачем:** Для входа через Яндекс.

**Что делать:**
1. Перейти на [https://oauth.yandex.com/client/new](https://oauth.yandex.com/client/new).
2. Тип приложения: "Веб-сервисы".
3. Redirect URI:
   ```
   http://localhost:3000/api/auth/callback/yandex
   ```
4. Сохранить, скопировать **Client ID** и **Client Secret**.
5. Ввести их в терминал, когда попросят.

---

## 3. **GitHub OAuth (опционально)**
**Зачем:** Для входа через GitHub.

**Что делать:**
1. Перейти на [https://github.com/settings/developers](https://github.com/settings/developers).
2. "New OAuth App".
3. Callback URL:
   ```
   http://localhost:3000/api/auth/callback/github
   ```
4. Скопировать **Client ID** и **Client Secret**.
5. Ввести их в терминал, если решишь подключить.

---

## 4. **Hasura (GraphQL Endpoint и Admin Secret)**
**Зачем:** Для работы с базой данных через Hasura.

**Что делать:**
1. Развернуть Hasura (локально, на сервере или в облаке).
2. Получить:
   - **GraphQL Endpoint** (например, `http://localhost:8080/v1/graphql`)
   - **Admin Secret** (если установлен)
3. Ввести эти значения при настройке.

---

## 5. **JWT Secret для Hasura**
**Зачем:** Для безопасной авторизации между Next.js и Hasura.

**Что делать:**
- Можно сгенерировать автоматически (Hasyx предложит).
- Или использовать свой 32-байтовый hex-ключ.

---

## 6. **OpenRouter API Key (для AI-функций, опционально)**
**Зачем:** Для работы с AI/LLM через OpenRouter.

**Что делать:**
1. Зарегистрироваться на [https://openrouter.ai](https://openrouter.ai).
2. Получить API Key на странице [https://openrouter.ai/keys](https://openrouter.ai/keys).
3. Ввести ключ при настройке.

---

## 7. **PostgreSQL (БД)**
**Зачем:** Для хранения данных.

**Что делать:**
1. Развернуть PostgreSQL (локально или в облаке).
2. Получить строку подключения или по отдельности:
   - Host (обычно `localhost`)
   - Port (обычно `5432`)
   - Username
   - Password
   - Database name
3. Ввести эти данные при настройке.

---

## 8. **Cloudflare (для DNS/SSL, опционально)**
**Зачем:** Для автоматизации управления DNS и SSL.

**Что делать:**
1. Зарегистрироваться на [https://dash.cloudflare.com/](https://dash.cloudflare.com/).
2. Добавить свой домен.
3. Получить:
   - **API Token** с правами Zone:Edit ([инструкция](https://dash.cloudflare.com/profile/api-tokens))
   - **Zone ID** (на странице домена справа)
   - Email для Let's Encrypt (для SSL)
4. Ввести эти данные при настройке.

---

## 9. **Docker Hub (для автопубликации образов, опционально)**
**Зачем:** Для CI/CD и публикации Docker-образов.

**Что делать:**
1. Зарегистрироваться на [https://hub.docker.com/](https://hub.docker.com/).
2. Получить:
   - **Username**
   - **Access Token** ([инструкция](https://hub.docker.com/settings/security))
3. Ввести эти данные при настройке.

---

## 10. **Vercel (для деплоя, опционально)**
**Зачем:** Для деплоя проекта в облако.

**Что делать:**
1. Зарегистрироваться на [https://vercel.com/](https://vercel.com/).
2. Войти через GitHub.
3. Получить **VERCEL_TOKEN** (если потребуется).
4. Ввести при настройке.

---

## 11. **API-ключи для карт (если нужны карты)**
- **Yandex:** [https://developer.tech.yandex.ru/](https://developer.tech.yandex.ru/)
- **Google:** [https://console.developers.google.com/apis/credentials](https://console.developers.google.com/apis/credentials)
- **2GIS:** [https://dev.2gis.ru/](https://dev.2gis.ru/)

---

## 12. **Порядок действий**
1. Запусти `npx hasyx assist` и следуй инструкциям.
2. На каждом этапе вводи нужные данные (или пропускай, если не используешь сервис).
3. После завершения — проверь `.env`, все ключи должны быть на месте.
4. Запусти миграции и генерацию схемы, если есть Hasura:
   ```
   npx hasyx migrate
   npx hasyx schema
   ```
5. Запусти dev-сервер:
   ```
   npx hasyx dev
   ```
6. Проверь работу приложения.

---

**Если что-то не получается — напиши, на каком шаге застрял, и я помогу!**