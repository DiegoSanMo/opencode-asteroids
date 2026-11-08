---
description: Crea un worktree git en .worktrees a partir del argumento
---

!`slug=$(printf '%s' '$ARGUMENTS' | perl -CS -Mutf8 -pe 's/[áàäâã]/a/gi; s/[éèëê]/e/gi; s/[íìïî]/i/gi; s/[óòöôõ]/o/gi; s/[úùüû]/u/gi; s/ñ/n/gi; s/[^a-zA-Z0-9]+/-/g; s/^-+//; s/-+$//; $_=lc'); if [ -z "$slug" ]; then echo "Uso: /worktree <descripcion>" >&2; exit 1; fi; git worktree add ".worktrees/$slug"`

No hagas nada más. No cambies de directorio ni ejecutes comandos adicionales. Si el bloque anterior falló, limítate a mostrar el error.
