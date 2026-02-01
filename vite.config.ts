import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as fs from "fs";
import * as path from "path";

// Helper to read .env file manually with proper priority
function getApiUrl(mode: string): string {
  const cwd = process.cwd();

  // Priority order (highest first): .env.local, .env.[mode].local, .env.[mode], .env
  const envFiles = [".env.local", `.env.${mode}.local`, `.env.${mode}`, ".env"];

  for (const file of envFiles) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const match = content.match(/^VITE_API_URL=(.+)$/m);
      if (match) {
        const url = match[1].trim().replace(/^["']|["']$/g, ""); // Remove quotes if any
        console.log(`📁 Found VITE_API_URL in ${file}: ${url}`);
        return url;
      }
    }
  }

  console.log("📁 No VITE_API_URL found, using default");
  return "https://localhost:7152";
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get API URL with proper priority
  const apiUrl = getApiUrl(mode);

  // Log for debugging
  console.log("🔧 Vite Config - Mode:", mode);
  console.log("🌐 VITE_API_URL:", apiUrl);

  return {
    plugins: [react()],

    // Explicitly load environment files
    envDir: process.cwd(),
    envPrefix: "VITE_",

    // Force environment variable to be available at runtime
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },

    server: {
      port: 5173,
      strictPort: false,
      host: true, // Allow network access
      open: false,
      // Allow all hosts - required for Cloudflare Tunnel (URL changes each time)
      allowedHosts: true,
    },

    preview: {
      port: 3000,
      strictPort: false,
      host: true,
      // Allow all hosts for preview mode too
      allowedHosts: true,
    },

    build: {
      outDir: "dist",
      sourcemap: false,
      // Optimize for production
      minify: "terser",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
