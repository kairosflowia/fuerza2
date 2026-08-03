# Operación y recuperación de FUERZA

Los backups remotos se gestionan desde el proyecto Supabase `fuerza` (`bmzedimxzmkpgqnevnmn`). La disponibilidad de point-in-time recovery depende del plan contratado y debe comprobarse antes del lanzamiento. Nunca se restaura directamente sobre producción para hacer una prueba.

## Copia y restauración

1. Exportar con las herramientas oficiales de Supabase/PostgreSQL sin incluir secrets.
2. Validar el dump con `npm run backup:validate -- /ruta/backup.dump`.
3. Arrancar Supabase local, aplicar primero las migraciones versionadas y restaurar en una base local aislada.
4. Verificar recuentos, RLS, Storage y los flujos de pedido, pago y suscripción.
5. Documentar fecha, responsable, checksum y resultado. El rollback de aplicación se hace desplegando un commit anterior compatible; las migraciones requieren una migración correctiva, nunca `db reset` remoto.

Storage debe exportarse y verificarse por separado. Las variables de entorno se recuperan desde los gestores de secretos de Vercel/Supabase, nunca desde el repositorio.
