# Deploy DulceMae

Objetivo: dejar la pagina publica online y mantener el admin futuro privado con login.

## 1. GitHub

1. Crear un repositorio nuevo en GitHub.
2. No marcar README, .gitignore ni licencia si GitHub pregunta, porque el proyecto ya tendra esos archivos.
3. Copiar la URL del repositorio.
4. En la terminal del proyecto:

```bash
git remote add origin URL_DEL_REPOSITORIO
git branch -M main
git push -u origin main
```

## 2. Vercel

1. Entrar a Vercel con GitHub.
2. Importar el repositorio DulceMae.
3. Configuracion recomendada:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. Deploy.

## 3. Regla de seguridad

La pagina publica puede quedar abierta.

El admin futuro no debe quedar abierto. Debe usar login porque tendra:

- Telefonos.
- Direcciones.
- Ventas.
- Costos.
- Insumos.
- Estados de pedidos.

## 4. Siguiente fase despues del deploy

Implementar checkout WhatsApp completo:

- Retiro o delivery.
- Si es delivery, sumar $3.500.
- Direccion.
- Metodo de pago: transferencia o efectivo.
- Total separado: subtotal, delivery y total final.
- Mensaje WhatsApp ordenado.
- Payload de pedido listo para base de datos.
