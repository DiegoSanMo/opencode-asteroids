'use strict'

const MARKER = '<!-- issue-triage:auto -->'

const LABEL_DEFINITIONS = {
  bug: { color: 'd73a4a', description: "Something isn't working" },
  enhancement: { color: 'a2eeef', description: 'New feature or request' },
  question: { color: 'd876e3', description: 'Further information is requested' },
  documentation: { color: '0075ca', description: 'Improvements or additions to documentation' },
  accessibility: { color: 'f143ab', description: 'Barrier affecting people with disabilities' },
  'needs-triage': { color: 'fbca04', description: 'Pending manual triage' },
  'needs-info': { color: 'd4c5f9', description: 'Missing reproduction details' },
}

const LABEL_RULES = [
  {
    label: 'bug',
    keywords: [
      'bug', 'error', 'falla', 'fallo', 'no funciona', 'rompe', 'roto',
      'crash', 'se cierra', 'se congela', 'no carga', 'colision',
      'excepcion', 'exception', 'stack trace',
    ],
  },
  {
    label: 'enhancement',
    keywords: [
      'feature', 'funcionalidad', 'mejorar', 'mejora', 'agregar', 'anadir',
      'nueva', 'nuevo', 'sugerencia', 'seria bueno', 'propuesta', 'idea',
    ],
  },
  {
    label: 'question',
    keywords: [
      'pregunta', 'duda', 'dudas', 'ayuda', 'consulta', 'soporte',
      'como puedo', 'como hago', 'como se', 'como funciona',
    ],
  },
  {
    label: 'documentation',
    keywords: ['docs', 'doc', 'readme', 'documentacion', 'instrucciones', 'guia'],
  },
  {
    label: 'accessibility',
    keywords: [
      'accesibilidad', 'accesible', 'teclado', 'contraste',
      'lector de pantalla', 'screen reader', 'a11y',
    ],
  },
]

const REPRO_KEYWORDS = [
  'paso', 'pasos', 'reproduc', 'repro', 'esperado', 'actual', 'ocurr',
  'sucede', 'sucedio', 'consola', 'navegador', 'version', 'sistema operativo',
]

const CODE_HINTS = [
  {
    keywords: ['asteroide', 'asteroid', 'fugaz', 'estrella', 'fragment', 'partir'],
    hints: ['`Asteroid`, `RADII`, `SPEEDS`, `POINTS` — fragmentación, movimiento y puntuación'],
  },
  {
    keywords: ['skin', 'nave', 'ship', 'silueta', 'apariencia'],
    hints: ['`Ship`, `SKINS`, `currentSkin`, `drawShipShape` — nave y skins'],
  },
  {
    keywords: ['powerup', 'power-up', 'power up', 'escudo', 'shield', 'velocidad', 'speed'],
    hints: ['`PowerUp`, `shield`, `speed` — power-ups de velocidad y escudo'],
  },
  {
    keywords: ['ovni', 'enemigo', 'enemy', 'ufo'],
    hints: ['`Enemy`, `EnemyBullet` — OVNI y proyectiles enemigos'],
  },
  {
    keywords: ['disparo', 'bala', 'bullet', 'triple', 'shoot'],
    hints: ['`Bullet`, triple shot — disparo manual y ráfaga automática'],
  },
  {
    keywords: ['puntaje', 'puntos', 'score', 'nivel', 'level', 'vida', 'lives'],
    hints: ['`score`, `level`, `lives`, `nextLevel` — progresión y HUD'],
  },
  {
    keywords: ['colision', 'collision', 'choque', 'impacto'],
    hints: ['`dist()` y radios de colisión — ojo: las colisiones no cruzan los bordes de pantalla'],
  },
  {
    keywords: ['control', 'tecla', 'teclado', 'input', 'flecha', 'espacio'],
    hints: ['`keys`, `justPressed`, `pressed` — entrada y controles'],
  },
  {
    keywords: ['sonido', 'audio', 'musica'],
    hints: ['No hay audio implementado actualmente'],
  },
  {
    keywords: ['movil', 'touch', 'tactil'],
    hints: ['No hay controles táctiles implementados actualmente'],
  },
]

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matches(text, keywords) {
  return keywords.some((keyword) => {
    const pattern = new RegExp(`\\b${escapeRegExp(normalize(keyword))}\\b`)
    return pattern.test(text)
  })
}

function detectLabels(title, body) {
  const text = normalize(`${title}\n${body}`)
  const labels = LABEL_RULES
    .filter((rule) => matches(text, rule.keywords))
    .map((rule) => rule.label)

  if (labels.length === 0) labels.push('needs-triage')

  const normalizedBody = normalize(body)
  const tooShort = normalizedBody.trim().length < 40
  const bugWithoutRepro = labels.includes('bug') && !matches(normalizedBody, REPRO_KEYWORDS)

  if (tooShort || bugWithoutRepro) labels.push('needs-info')

  return [...new Set(labels)]
}

function detectCodeHints(title, body) {
  const text = normalize(`${title}\n${body}`)
  const hints = CODE_HINTS
    .filter((entry) => matches(text, entry.keywords))
    .flatMap((entry) => entry.hints)

  return [...new Set(hints)]
}

function buildTriageBlock({ issue, labels, baseBranch, baseSha, runUrl, codeHints, missingInfo }) {
  const created = new Date(issue.created_at).toISOString().slice(0, 10)
  const labelList = labels.length ? labels.map((label) => `\`${label}\``).join(', ') : '_ninguna_'
  const lines = [
    MARKER,
    '## 🏷️ Triage automático',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    `| Autor | @${issue.user.login} |`,
    `| Creado | ${created} |`,
    `| Issue | #${issue.number} |`,
    `| Rama base | \`${baseBranch}\` @ \`${baseSha.slice(0, 7)}\` |`,
    `| Workflow | [issue-triage.yml](${runUrl}) |`,
    '',
    `**Labels aplicadas:** ${labelList}`,
    '',
  ]

  if (missingInfo) {
    lines.push(
      '> ⚠️ **Falta información para reproducir el problema.** Añade pasos, resultado esperado y resultado actual.',
      '',
    )
  }

  lines.push(
    '### Checklist de revisión',
    '- [ ] ¿Se reproduce el problema?',
    '- [ ] ¿Incluye pasos de reproducción?',
    '- [ ] ¿Indica navegador y sistema operativo?',
    '- [ ] ¿Afecta a `game.js`, `index.html` o al README?',
    '',
  )

  if (codeHints.length > 0) {
    lines.push('### Código posiblemente relacionado')
    lines.push(...codeHints.map((hint) => `- ${hint}`))
    lines.push('')
  }

  lines.push(
    '> Generado automáticamente. El texto original del autor se conserva sin cambios arriba.',
    '',
  )

  return lines.join('\n')
}

async function ensureLabel({ github, owner, repo, name, core }) {
  try {
    await github.rest.issues.getLabel({ owner, repo, name })
    return
  } catch (error) {
    if (error.status !== 404) throw error
  }

  const definition = LABEL_DEFINITIONS[name] || { color: 'ededed', description: '' }

  try {
    await github.rest.issues.createLabel({
      owner,
      repo,
      name,
      color: definition.color,
      description: definition.description,
    })
    core.info(`Created missing label "${name}".`)
  } catch (error) {
    // 422 means the label was created by another run in the meantime.
    if (error.status !== 422) throw error
  }
}

async function getBaseCommit({ github, owner, repo, core }) {
  try {
    const { data: repository } = await github.rest.repos.get({ owner, repo })
    const { data: branch } = await github.rest.repos.getBranch({
      owner,
      repo,
      branch: repository.default_branch,
    })
    return { branch: repository.default_branch, sha: branch.commit.sha }
  } catch (error) {
    core.warning(`Could not resolve the base branch commit: ${error.message}`)
    return { branch: 'main', sha: 'desconocido' }
  }
}

module.exports = async function triageIssue({ github, context, core, issueNumber }) {
  const { owner, repo } = context.repo
  const requestedNumber = Number(issueNumber)

  let issue = context.payload.issue

  if (!issue) {
    if (!Number.isInteger(requestedNumber) || requestedNumber <= 0) {
      throw new Error('No issue in the event payload and no valid issue_number input was provided.')
    }

    const { data } = await github.rest.issues.get({ owner, repo, issue_number: requestedNumber })
    issue = data
  }

  if (issue.pull_request) {
    core.info(`#${issue.number} is a pull request; skipping.`)
    return
  }

  const body = issue.body || ''
  const labels = detectLabels(issue.title, body)
  const codeHints = detectCodeHints(issue.title, body)
  const missingInfo = labels.includes('needs-info')
  const existingLabels = new Set(
    (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name)),
  )
  const labelsToAdd = labels.filter((label) => !existingLabels.has(label))

  for (const label of labelsToAdd) {
    await ensureLabel({ github, owner, repo, name: label, core })
  }

  if (labelsToAdd.length > 0) {
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issue.number,
      labels: labelsToAdd,
    })
    core.info(`Applied labels: ${labelsToAdd.join(', ')}`)
  } else {
    core.info('All detected labels were already present.')
  }

  if (body.includes(MARKER)) {
    core.info('Triage block already present; skipping body update.')
  } else {
    const { branch, sha } = await getBaseCommit({ github, owner, repo, core })
    const runUrl = `${context.serverUrl || 'https://github.com'}/${owner}/${repo}/actions/runs/${context.runId}`
    const block = buildTriageBlock({
      issue,
      labels,
      baseBranch: branch,
      baseSha: sha,
      runUrl,
      codeHints,
      missingInfo,
    })

    await github.rest.issues.update({
      owner,
      repo,
      issue_number: issue.number,
      body: `${body}${body ? '\n\n---\n\n' : ''}${block}`,
    })
    core.info('Issue body updated with the triage block.')
  }

  await core.summary
    .addHeading(`Triage del issue #${issue.number}`, 3)
    .addRaw(`- **Labels:** ${labels.map((label) => `\`${label}\``).join(', ') || '_ninguna_'}\n`)
    .addRaw(`- **Texto original:** ${body.includes(MARKER) ? 'ya procesado' : 'conservado y ampliado'}\n`)
    .write()
}
