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

| Tecla     | Acción       |
| --------- | ------------ |
| `←` `→`   | Rotar nave   |
| `↑`       | Propulsar    |
| `Espacio` | Disparar     |
| `S` / `C` | Cambiar skin |

## Skins

La apariencia de la nave se puede cambiar en cualquier momento con `S` o `C`:

| Skin     | Estilo                             |
| -------- | ---------------------------------- |
| Clásica  | Silueta original blanca            |
| Neón     | Dardo verde con brillo             |
| Fuego    | Ala ancha naranja/ámbar            |
| Fantasma | Interceptor violeta con brillo     |

Las skins son puramente estéticas (no cambian el radio de colisión) y la última elegida se guarda en `localStorage`, por lo que se mantiene al recargar la página.

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
- Power-up de **velocidad**: al recogerlo, la propulsión se duplica durante 5 segundos (indicador con cuenta atrás en el HUD). Aparece al destruir asteroides y desaparece si no se recoge.
- **Estrella fugaz**: asteroide dorado con estela que se mueve mucho más rápido. Se desvanece solo a los pocos segundos (parpadea antes de desaparecer). Al destruirlo da el triple de puntos, no se fragmenta y suelta power-ups con más frecuencia.
