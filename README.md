# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide     | Puntos |
| ------------- | ------ |
| Grande        | 20     |
| Mediano       | 50     |
| Pequeño       | 100    |
| Estrella fugaz | 3× el valor de su tamaño |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- **OVNI enemigo**: aparece periódicamente, se desplaza por la pantalla y dispara proyectiles dirigidos hacia la nave. Al destruirlo otorga 150 puntos y suelta un escudo.
- Power-up de **velocidad**: al recogerlo, la propulsión se duplica durante 5 segundos (indicador con cuenta atrás en el HUD). Aparece al destruir asteroides y desaparece si no se recoge.
- Power-up de **escudo**: protege a la nave de los proyectiles enemigos durante 8 segundos (indicador con cuenta atrás en el HUD). Absorbe un impacto y se rompe; no protege de colisiones con asteroides ni con el OVNI. Aparece al destruir asteroides y siempre al destruir un OVNI.
- **Estrella fugaz**: asteroide dorado con estela que se mueve mucho más rápido. Se desvanece solo a los pocos segundos (parpadea antes de desaparecer). Al destruirlo da el triple de puntos, no se fragmenta y suelta power-ups con más frecuencia.
