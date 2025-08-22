# Documento de Requisitos - Escáner de Manifiestos de Salida

## Introducción

Esta aplicación web está diseñada para automatizar la extracción de datos de manifiestos de salida aeroportuarios, eliminando la necesidad de entrada manual de datos y reduciendo errores. La aplicación permitirá a los operadores de slots y demoras del aeropuerto escanear documentos, extraer información automáticamente y verificar los datos extraídos antes de procesarlos.

## Requisitos

### Requisito 1

**Historia de Usuario:** Como operador de slots del aeropuerto, quiero poder cargar una imagen del manifiesto de salida, para que el sistema extraiga automáticamente todos los datos relevantes sin tener que escribirlos manualmente.

#### Criterios de Aceptación

1. CUANDO el usuario carga una imagen del manifiesto ENTONCES el sistema DEBERÁ mostrar la imagen cargada para verificación visual
2. CUANDO la imagen es procesada ENTONCES el sistema DEBERÁ extraer automáticamente todos los campos de texto visible del documento
3. CUANDO la extracción está completa ENTONCES el sistema DEBERÁ mostrar los datos extraídos en una tabla organizada
4. SI la imagen no es legible o de mala calidad ENTONCES el sistema DEBERÁ mostrar un mensaje de error apropiado

### Requisito 2

**Historia de Usuario:** Como operador de slots del aeropuerto, quiero ver los datos extraídos organizados en una tabla clara, para que pueda verificar rápidamente la precisión de la información antes de procesarla.

#### Criterios de Aceptación

1. CUANDO los datos son extraídos ENTONCES el sistema DEBERÁ organizar la información en las siguientes categorías:
   - Información del vuelo (fecha, folio, aeropuerto, tipo de vuelo)
   - Información de la aeronave (transportista, equipo, matrícula, número de vuelo)
   - Información del piloto y tripulación
   - Movimiento de operaciones (origen, destino, escalas, horarios)
   - Causa de demora
   - Información de embarque (pasajeros, carga, equipaje)
2. CUANDO se muestra la tabla ENTONCES cada campo DEBERÁ estar claramente etiquetado con su nombre correspondiente
3. CUANDO hay campos vacíos o no detectados ENTONCES el sistema DEBERÁ marcarlos como "No detectado" o permitir entrada manual

### Requisito 3

**Historia de Usuario:** Como operador de slots del aeropuerto, quiero poder editar manualmente cualquier dato extraído incorrectamente, para que pueda corregir errores de OCR antes de guardar la información.

#### Criterios de Aceptación

1. CUANDO se muestra la tabla de datos ENTONCES cada campo DEBERÁ ser editable por el usuario
2. CUANDO el usuario modifica un campo ENTONCES el sistema DEBERÁ resaltar visualmente los campos editados
3. CUANDO el usuario guarda los cambios ENTONCES el sistema DEBERÁ validar que los campos obligatorios estén completos
4. SI hay campos obligatorios vacíos ENTONCES el sistema DEBERÁ mostrar un mensaje de error específico

### Requisito 4

**Historia de Usuario:** Como operador de slots del aeropuerto, quiero que la aplicación funcione tanto en mi computadora como en dispositivos móviles, para que pueda procesar manifiestos desde cualquier ubicación en el aeropuerto.

#### Criterios de Aceptación

1. CUANDO se accede desde un dispositivo móvil ENTONCES la interfaz DEBERÁ adaptarse automáticamente al tamaño de pantalla
2. CUANDO se usa en una tablet o teléfono ENTONCES todas las funciones DEBERÁN ser accesibles mediante touch
3. CUANDO se accede desde una computadora ENTONCES la aplicación DEBERÁ aprovechar el espacio de pantalla disponible
4. CUANDO se carga una imagen desde móvil ENTONCES el usuario DEBERÁ poder usar la cámara del dispositivo directamente

### Requisito 5

**Historia de Usuario:** Como operador de slots del aeropuerto, quiero que el sistema guarde automáticamente la imagen original del manifiesto junto con los datos extraídos, para que pueda tener un respaldo visual para auditorías futuras.

#### Criterios de Aceptación

1. CUANDO se procesa un manifiesto ENTONCES el sistema DEBERÁ guardar la imagen original en el almacenamiento local del navegador
2. CUANDO se guardan los datos ENTONCES el sistema DEBERÁ asociar la imagen con los datos extraídos
3. CUANDO se visualizan datos guardados ENTONCES el usuario DEBERÁ poder ver la imagen original correspondiente
4. CUANDO el almacenamiento esté lleno ENTONCES el sistema DEBERÁ notificar al usuario y ofrecer opciones de limpieza

### Requisito 6

**Historia de Usuario:** Como operador de slots del aeropuerto, quiero poder exportar los datos procesados en formato CSV o JSON, para que pueda integrar la información con otros sistemas del aeropuerto.

#### Criterios de Aceptación

1. CUANDO el usuario solicita exportar datos ENTONCES el sistema DEBERÁ ofrecer formatos CSV y JSON
2. CUANDO se exporta en CSV ENTONCES los datos DEBERÁN estar organizados en columnas apropiadas con encabezados
3. CUANDO se exporta en JSON ENTONCES la estructura DEBERÁ ser consistente y bien formateada
4. CUANDO se completa la exportación ENTONCES el archivo DEBERÁ descargarse automáticamente al dispositivo del usuario