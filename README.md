# Simulación Estelar en Three.js
Este proyecto es una simulación interactiva de un sistema estelar binario, creada con Three.js.
En ella, dos estrellas orbitan su baricentro común, mientras varios planetas y lunas se mueven siguiendo trayectorias elípticas.

# Características principales
Sistema binario con cálculo orbital paramétrico.
Planetas y lunas con inclinaciones variables y órbitas elípticas.
Fondo galáctico 3D (skybox o skysphere con textura).
Iluminación dinámica con sombras y luces puntuales.
Interfaz gráfica (GUI) para controlar la simulación en tiempo real.

# Controles
## Movimiento de cámara
OrbitControls: Cámara orbital (rota, acerca y aleja con el ratón).
FlyControls: Cámara libre (vuelo en primera persona).
  W / A / S / D: Movimiento adelante, izquierda, atrás, derecha
  Q / E: Ascender / Descender
  Mouse: Cambia orientación
Se puede alternar entre ambos modos usando el botón del GUI.

# GUI de control
El panel lateral permite:
  Modo cámara → Muestra el modo actual (Orbit o Fly).
  Alternar cámara → Cambia entre controles de cámara.
  Pause/Resume → Pausa o reanuda el movimiento orbital de los cuerpos celestes.

# Interacción con objetos
Al hacer clic sobre un planeta, luna o estrella, se despliega un panel informativo con detalles como:
  Nombre del cuerpo
  Distancia orbital
  Velocidad de rotación
  Inclinación orbital

# Demo en video
link de descarga: https://github.com/OmarOrtS/Solar-System/releases/download/video/demo.mkv

# Codesandbox
https://codesandbox.io/p/sandbox/sistema-solar-zvm9qd?file=%2Fsrc%2Findex.js
