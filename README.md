# ASU Dorms Management System - Frontend

React-based frontend for the ASU Dorms Management System.

## 🚀 Quick Start

### Local Development (Default)

```bash
npm install
npm run dev
```

The app will connect to `https://localhost:7152` by default.

### With Cloudflare Tunnel (Remote Access)

1. **Start your backend with Cloudflare Tunnel** (in the backend project):

   ```powershell
   .\START-WITH-TUNNEL.bat
   ```

2. **Copy the tunnel URL** (e.g., `https://random-words.trycloudflare.com`)

3. **Set the tunnel URL** in the frontend:

   ```powershell
   .\scripts\Set-TunnelUrl.ps1 -TunnelUrl "https://your-tunnel-url.trycloudflare.com"
   ```

   Or double-click `SET-TUNNEL-URL.bat`

4. **Start the React dev server**:
   ```bash
   npm run dev
   ```

---

## 📁 Environment Configuration

| File               | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `.env`             | Default values (committed to git)        |
| `.env.local`       | **Your local overrides** (gitignored) ⭐ |
| `.env.development` | Dev mode defaults                        |
| `.env.production`  | Production build defaults                |

### Environment Variables

| Variable       | Description     | Example                  |
| -------------- | --------------- | ------------------------ |
| `VITE_API_URL` | Backend API URL | `https://localhost:7152` |

### Priority Order

1. `.env.local` (highest - not in git)
2. `.env.development` or `.env.production` (mode-specific)
3. `.env` (lowest - defaults)

---

## 🌐 Cloudflare Tunnel Setup

### Quick Setup

```powershell
# Set your tunnel URL
.\scripts\Set-TunnelUrl.ps1 -TunnelUrl "https://your-tunnel-url.trycloudflare.com"

# Check current configuration
.\scripts\Get-ApiConfig.ps1
```

### Manual Setup

Create `.env.local`:

```env
VITE_API_URL=https://your-tunnel-url.trycloudflare.com
```

---

## 📜 Available Scripts

| Script                      | Description               |
| --------------------------- | ------------------------- |
| `npm run dev`               | Start development server  |
| `npm run build`             | Build for production      |
| `npm run preview`           | Preview production build  |
| `scripts/Set-TunnelUrl.ps1` | Set Cloudflare tunnel URL |
| `scripts/Get-ApiConfig.ps1` | Show current API config   |

---

## 🐛 Troubleshooting

### API Connection Issues

1. **Check your API URL**:

   ```powershell
   .\scripts\Get-ApiConfig.ps1
   ```

2. **Verify the backend is running**:
   - Open the tunnel URL in browser
   - Should see Swagger docs at `/swagger`

3. **CORS errors**:
   - Make sure the backend has the tunnel URL in CORS allowed origins
   - Restart the backend after starting the tunnel

### Environment Variables Not Working

- Restart the dev server after changing `.env` files
- Environment variables must start with `VITE_` to be exposed to the browser

---

## 📖 Original Design

The original UI design is available at https://www.figma.com/design/y1nGq8iN8WTdCgKJOf37Z0/ASU-Dorms-Management-System-UI
