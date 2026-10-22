# OpenRouter checker

Статическая страница: берёт ключ `sk-or-` из localStorage и показывает `/auth/key` и `/credits`.
Nuxt 4, `ssr: false`, вся страница — `app/app.vue`.

Push в `main` выкатывает на https://egorrko.github.io/openrouter-checker/ (GitHub Actions, `NUXT_APP_BASE_URL=/openrouter-checker/`).

Интерфейс на английском: в шрифтах Press Start 2P и VT323 нет кириллицы.
