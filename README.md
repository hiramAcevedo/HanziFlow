# HanziFlow ✍️

Aplicación web para practicar la escritura de caracteres chinos (hanzi) con animaciones de trazos interactivas.

> **Creado por Hiram（希拉木）- Acevedo, 2026**

![HanziFlow Screenshot](/HanziFlow.png)

## 🎯 Características principales

- **Escritura continua**: Escribe oraciones o párrafos completos, no solo carácter por carácter
- **Visualización de trazos**: Haz clic en cualquier carácter para ver su orden de trazos
- **Modo práctica**: Dibuja los caracteres con el ratón/tactil y recibe retroalimentación
- **Navegación por trazos**: Avanza o retrocede trazo a trazo para estudiar el orden de escritura
- **Control de velocidad**: Ajusta la velocidad de animación en tiempo real (1-9)
- **Atajos de teclado completos**: Diseñado para estudiar con mano derecha en papel y mano izquierda en teclado
- **Pinyin integrado**: Cada carácter muestra su pronunciación en pinyin con marcas de tono
- **Diccionario CC-CEDICT**: Definiciones en inglés para cada carácter, con carga inteligente (5 000 comunes + 11 000 bajo demanda)
- **Diseño responsive**: Funciona en móvil, tablet y escritorio
- **Ejemplos incluidos**: Frases comunes para empezar a practicar

## 🚀 Tecnologías

- [Next.js 16](https://nextjs.org/) - Framework React
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS](https://tailwindcss.com/) - Estilos
- [Hanzi Writer](https://hanziwriter.org/) - Motor de animación de trazos
- [Framer Motion](https://www.framer.com/motion/) - Animaciones
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [pinyin-pro](https://pinyin-pro.cn/) - Conversión de caracteres a pinyin
- [CC-CEDICT](https://cc-cedict.org/) - Diccionario chino-inglés (CC BY-SA 4.0)

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd HanziWriterUI

# Instalar dependencias
npm install

# Generar diccionario (descarga CC-CEDICT y genera JSON)
npm run build:dict

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Build para producción

```bash
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`.

## 📝 Uso

1. Escribe o pega un texto en chino en el área de texto
2. Haz clic en cualquier carácter chino del grid
3. En el modal:
   - **Play/Pausar**: Ver la animación de trazos con pausa y reanudación
   - **Reproducir**: Reiniciar la animación desde el primer trazo
   - **Practicar**: Dibuja el carácter con el ratón/dedo y recibe retroalimentación
   - **Mostrar/Ocultar contorno**: Ver la silueta del carácter
4. Navega entre caracteres y trazos con el teclado

### ⌨️ Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `← →` o `A D` | Navegar entre caracteres |
| `↓` o `S` | Siguiente trazo (añadir uno) |
| `↑` o `W` | Trazo anterior (quitar último) |
| `SPACE` | Play/Stop — pausa la animación y reanuda desde donde se quedó. Si estás en un trazo específico (tras usar W/S), continúa la reproducción desde ahí |
| `R` | Reproducir desde el inicio (trazo 0) |
| `H` | Cambiar a modo ver trazos |
| `T` | Cambiar a modo practicar |
| `1-9` | Ajustar velocidad de animación (1 = lento, 9 = rápido). El cambio se aplica al siguiente trazo, incluso durante la reproducción |
| `ESC` | Cerrar modal |

> **Tip**: Los controles están pensados para estudiar con la mano derecha escribiendo en papel y la mano izquierda en el teclado (WASD + espacio).

## 🗺️ Roadmap

### MVP (Actual)
- ✅ Input de texto libre
- ✅ Grid de caracteres interactivo
- ✅ Visualización de trazos (Hanzi Writer)
- ✅ Modo práctica de escritura (quiz)
- ✅ Navegación entre caracteres (← → / A D)
- ✅ Navegación por trazos (↓ S / ↑ W)
- ✅ Play/Stop con reanudación (SPACE)
- ✅ Reproducir desde inicio (R)
- ✅ Switch de modo por teclado (H / T)
- ✅ Velocidad ajustable en tiempo real (1-9)

- ✅ Pinyin con marcas de tono (pinyin-pro)
- ✅ Diccionario CC-CEDICT (5 000 comunes + 11 000 bajo demanda)

### Próximos módulos
- [ ] **Flashcards SRS**: Sistema de repetición espaciada con práctica de escritura
- [ ] **Progreso**: Guardar caracteres practicados y estadísticas
- [ ] **Listas HSK**: Palabras organizadas por niveles
- [ ] **Audio**: Pronunciación de caracteres
- [ ] **Modo oscuro**: Tema dark

## 🏛️ Inspiración

Las herramientas existentes para practicar escritura china obligan a trabajar carácter por carácter: copiar, pegar, animar, repetir. HanziFlow nace para resolver eso — escribir oraciones completas y navegar libremente entre caracteres y trazos. La escritura a mano es fundamental para reconocer y diferenciar caracteres similares (como 很 vs 得... o al menos a mí me parecen similares), y esta app busca hacer esa práctica lo más fluida posible.

## 📄 Licencia

MIT

## 🙏 Agradecimientos

- [Hanzi Writer](https://hanziwriter.org/) por el motor de animación de trazos
- [Make Me A Hanzi](https://github.com/skishore/makemeahanzi) por los datos de trazos
- [CC-CEDICT](https://cc-cedict.org/) por el diccionario chino-inglés (licencia [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/))
- [pinyin-pro](https://pinyin-pro.cn/) por la conversión a pinyin

---

**Hiram Acevedo — 希拉木 · 2026**
