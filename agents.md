Gestión de Entorno y Pruebas (Next.js & Python):
"Al ejecutar pruebas automatizadas, ya sea para el frontend en Next.js o el microservicio en Python, ten en cuenta que los servidores de desarrollo pueden estar actualmente en ejecución.

NO cambies de forma dinámica ni aleatoria los puertos de configuración si encuentras que el puerto predeterminado está ocupado.

ACCIÓN REQUERIDA: Si detectas un conflicto de puertos, detén los procesos asociados a mi proyecto de VS Code de forma limpia (matando el proceso en el puerto específico) o notifícame explícitamente para que yo detenga los servidores en la terminal antes de continuar con la ejecución de las pruebas."
