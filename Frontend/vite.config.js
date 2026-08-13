import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const virtualHtmlPlugin = () => {
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>mhaveer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
</head>
<body> 
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

  return {
    name: 'virtual-html-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];
        const acceptsHtml = req.headers.accept?.includes('text/html');
        const isSpaRoute = !url.includes('.') && acceptsHtml;

        // index.html is supplied virtually, so browser routes also need to
        // receive it before BrowserRouter can process the route.
        if (url === '/' || url === '/index.html' || isSpaRoute) {
          try {
            const transformedHtml = await server.transformIndexHtml(req.url, htmlContent);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(transformedHtml);
            return;
          } catch (e) {
            next(e);
            return;
          }
        }
        next();
      });
    },
    resolveId(id) {
      if (id === 'index.html' || id === '/index.html') {
        return '\0virtual-index.html';
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual-index.html') {
        return htmlContent;
      }
      return null;
    },
    generateBundle(options, bundle) {
      let jsFile = '';
      for (const name in bundle) {
        if (name.endsWith('.js') && name.includes('main')) {
          jsFile = '/' + name;
          break;
        }
      }
      if (!jsFile) {
        for (const name in bundle) {
          if (name.endsWith('.js')) {
            jsFile = '/' + name;
            break;
          }
        }
      }

      let cssTags = '';
      for (const name in bundle) {
        if (name.endsWith('.css')) {
          cssTags += `<link rel="stylesheet" href="/${name}" />\n`;
        }
      }

      const builtHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>mhaveer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
  ${cssTags}
</head>
<body> 
  <div id="root"></div>
  <script type="module" src="${jsFile}"></script>
</body>
</html>`;

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: builtHtml
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), virtualHtmlPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: 'src/main.jsx'
      }
    }
  }
})
