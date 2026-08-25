# Especificación: Fundamento de stock por ubicación

## Propósito

Definir el contrato de lectura frontend para consultar stock por ubicación sin mezclar catálogo, disponibilidad del ecommerce ni cantidades de puntos de venta.

## Requisitos

### Requisito: Directorio canónico de ubicaciones

El sistema DEBE representar las ubicaciones mediante códigos estables proporcionados por el contrato de backend y NO DEBE inferir identidad por posición, etiqueta visible o texto libre.

Las ubicaciones soportadas en esta fase son: `BODEGA_CENTRAL` (Bodega Central), `POS_FUNA_UNA` (FUNA-UNA), `POS_EDITORIAL` (Editorial) y `POS_STAND_FERIAS` (Stand Ferias).

#### Escenario: Mostrar las cuatro ubicaciones

- DADO que el directorio de ubicaciones está disponible
- CUANDO se carga el selector de ubicación
- ENTONCES se muestran los cuatro códigos con sus nombres canónicos
- Y cada opción conserva su código como identidad operativa

#### Escenario: Directorio no disponible

- DADO que el backend devuelve un error al consultar ubicaciones
- CUANDO se intenta mostrar el selector
- ENTONCES se informa el error de forma accesible
- Y no se inventan ubicaciones ni cantidades locales

### Requisito: Consulta de stock con alcance explícito

El sistema DEBE consultar y normalizar registros identificados por `productId` y `locationCode`. DEBE mostrar únicamente la ubicación seleccionada y DEBE distinguir un registro ausente de un stock confirmado en cero.

#### Escenario: Consultar una ubicación

- DADO que el usuario selecciona `POS_EDITORIAL`
- CUANDO se solicita el stock
- ENTONCES cada fila mostrada corresponde únicamente a `POS_EDITORIAL`
- Y el contexto visible indica la ubicación seleccionada

#### Escenario: Aislar cantidades entre ubicaciones

- DADO que existen cantidades para Bodega Central y FUNA-UNA
- CUANDO se selecciona FUNA-UNA
- ENTONCES no se muestra ni reutiliza la cantidad de Bodega Central

#### Escenario: Registro ausente o cero

- DADO que un producto no tiene registro para la ubicación seleccionada
- CUANDO se renderiza su estado
- ENTONCES se muestra “sin registro” y no “0”
- Y un registro explícito con stock `0` se muestra como cero confirmado

### Requisito: Separación de catálogo y disponibilidad ecommerce

El sistema DEBE mantener el catálogo independiente de los DTO de stock. La disponibilidad del ecommerce DEBE continuar usando exclusivamente el stock confirmado de `BODEGA_CENTRAL` y NO DEBE cambiar al seleccionar una ubicación POS.

#### Escenario: Seleccionar un punto de venta

- DADO que el usuario selecciona una ubicación POS en administración
- CUANDO cambia la cantidad visible de un producto
- ENTONCES la disponibilidad del ecommerce permanece basada en Bodega Central

#### Escenario: Catálogo sin campos operativos

- DADO que se carga un producto del catálogo
- CUANDO se normaliza su respuesta
- ENTONCES los datos de ubicación y stock permanecen fuera del registro de catálogo

### Requisito: Estados operativos y autorización accesibles

La interfaz DEBE exponer estados de carga, vacío, error y no autorizado con texto comprensible, foco visible y nombres accesibles. DEBE permitir reintentar errores recuperables y NO DEBE presentar controles de edición directa para stock POS.

#### Escenario: Carga y lista vacía

- DADO que se solicita stock para una ubicación válida
- CUANDO la respuesta está pendiente o no contiene registros
- ENTONCES se muestra un estado de carga o vacío diferenciado
- Y la ubicación seleccionada permanece anunciada para tecnologías de asistencia

#### Escenario: Error y reintento

- DADO que la consulta falla por una causa recuperable
- CUANDO se muestra el error
- ENTONCES se ofrece una acción accesible para reintentar la misma ubicación

#### Escenario: Acceso no autorizado

- DADO que el backend responde sin autorización
- CUANDO se procesa la consulta
- ENTONCES se muestra un mensaje de acceso denegado
- Y no se muestran cantidades ni acciones de edición

#### Escenario: Edición POS fuera de alcance

- DADO que la ubicación seleccionada es un punto de venta
- CUANDO se renderiza su stock
- ENTONCES no aparece ningún control para editarlo directamente
