import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
const path=process.argv[2];if(!path||!existsSync(path)||!statSync(path).isFile()){console.error("Uso: npm run backup:validate -- /ruta/backup.dump");process.exit(2)}
const result=spawnSync("pg_restore",["--list",path],{encoding:"utf8"});if(result.status!==0){console.error("El archivo no es un backup PostgreSQL restaurable.");process.exit(1)}
const entries=result.stdout.split("\n").filter(line=>line&&!line.startsWith(";")).length;if(!entries){console.error("El backup está vacío.");process.exit(1)}console.log(`Backup válido: ${entries} objetos. La restauración debe ensayarse únicamente en Supabase local.`);
