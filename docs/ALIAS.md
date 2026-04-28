# Path Aliases

Les alias permettent d'importer les packages partagés du monorepo sans chemins relatifs.

## Alias disponibles

| Alias | Package |
|---|---|
| `@mailscope/utils` | `packages/utils` |
| `@mailscope/schemas` | `packages/schemas` |

## Mise en place

Les alias sont déclarés dans `packages/tsconfig/base.json` via l'option `paths` de TypeScript.

```json
// packages/tsconfig/base.json
"paths": {
  "@mailscope/utils": ["../../packages/utils/src/index.ts"],
  "@mailscope/schemas": ["../../packages/schemas/src/index.ts"]
}
```

## Utilisation dans une app

### 1. Déclarer la dépendance dans `package.json`

```json
// apps/api/package.json ou apps/front/package.json
"dependencies": {
  "@mailscope/utils": "workspace:*",
  "@mailscope/schemas": "workspace:*",
  "@mailscope/tsconfig": "workspace:*"
}
```

### 2. Étendre la config TypeScript

```json
// apps/api/tsconfig.json
{ "extends": "@mailscope/tsconfig/base.json" }
```

```json
// apps/front/tsconfig.json
{
  "extends": "@mailscope/tsconfig/base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx"
  }
}
```

### 3. Importer

```ts
import { something } from "@mailscope/utils"
import { MySchema } from "@mailscope/schemas"
```

## Ajouter un nouvel alias

1. Créer `packages/<nom>/package.json` avec le nom `@mailscope/<nom>`
2. Ajouter l'entrée dans `paths` dans `packages/tsconfig/base.json`
3. Ajouter l'export dans `packages/tsconfig/package.json` si nécessaire
