# DramaBox API

API sederhana dengan Node.js untuk mengelola data drama, chapter, dan fitur streaming dengan sistem autentikasi yang lengkap.

## 📋 Fitur

- **Authentication System** - Sistem token berbasis JWT
- **Drama Management** - CRUD operations untuk data drama
- **Chapter Management** - Pengelolaan episode/chapter
- **Search Functionality** - Pencarian dengan filter advanced
- **Streaming URLs** - Endpoint untuk mendapatkan URL streaming
- **Rate Limiting** - Pembatasan request untuk keamanan
- **Analytics** - Tracking dan metrics
- **Client Management** - Manajemen konfigurasi client

## 🚀 Quick Start

### 1. Installation

```bash
cd C:\Users\MS\Desktop\angele\apikujuh
npm install
```

### 2. Environment Setup

**PENTING:** Buat file `.env` dan konfigurasikan `DRAMABOX_TOKEN_URL`

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi yang sesuai:

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# WAJIB DIISI! URL untuk mendapatkan token DramaBox
DRAMABOX_TOKEN_URL=https://your-token-service.com/get-token

# Konfigurasi DramaBox API (opsional, menggunakan default jika kosong)
DRAMABOX_VERSION_CODE=430
DRAMABOX_VERSION_NAME=4.3.0
DRAMABOX_CID=DRA1000042
DRAMABOX_LANGUAGE=in
```

**Catatan:** `DRAMABOX_TOKEN_URL` harus mengembalikan response JSON dengan format:
```json
{
  "token": "your_bearer_token_here",
  "deviceid": "device_id_here"
}
```

### 3. Run Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3001`

## 📁 Struktur File

```
apikujuh/
├── server.js              # Entry point server
├── package.json           # Dependencies & scripts
├── .env.example           # Environment template
├── dramaboxHelper.js      # Helper functions
├── get-token.js           # Token management utility
├── token.js               # Authentication endpoints
├── chapter.js             # Chapter/episode endpoints
├── client.js              # Client management endpoints
├── detail.js              # Basic detail endpoints
├── details.js             # Comprehensive detail endpoints
├── drama.js               # Drama management endpoints
└── search.js              # Search functionality endpoints
```

## 🔌 API Endpoints

### Authentication
- `POST /api/token` - Get authentication token
- `POST /api/token/refresh` - Refresh token
- `POST /api/token/validate` - Validate token
- `DELETE /api/token` - Revoke token

### Drama Management
- `GET /api/drama` - Get drama list with pagination
- `GET /api/drama/:id` - Get specific drama details
- `GET /api/drama/latest` - Get latest dramas
- `GET /api/drama/:id/episodes` - Get episodes for drama

### Chapter Management
- `GET /api/chapter/:bookId` - Get chapters for book/drama
- `GET /api/chapter/:bookId/:chapterId` - Get specific chapter
- `POST /api/chapter/:bookId/:chapterId/stream` - Get streaming URL

### Search
- `GET /api/search?q=query` - Basic search
- `GET /api/search/suggestions?q=query` - Search suggestions
- `POST /api/search/advanced` - Advanced search with filters
- `GET /api/search/trending` - Trending search terms

### Detail Information
- `GET /api/detail/:id` - Basic detail info
- `GET /api/details/:id` - Comprehensive details
- `GET /api/details/:id/analytics` - Analytics data
- `POST /api/details/:id/interaction` - Record interactions

### Client Management
- `GET /api/client` - Client information
- `GET /api/client/status` - API status
- `GET /api/client/config` - Client configuration
- `POST /api/client/feedback` - Submit feedback
- `POST /api/client/log` - Client logging
- `GET /api/client/metrics` - API metrics (admin)

### Health Check
- `GET /health` - Health check endpoint
- `GET /` - API information

## 🔧 Usage Examples

### Get Authentication Token
```bash
# Token didapat otomatis dari DRAMABOX_TOKEN_URL
curl -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "Bearer_token_here",
    "deviceId": "device_id_here",
    "expiresAt": "2023-12-01T11:00:00.000Z",
    "type": "Bearer"
  },
  "message": "Token retrieved successfully"
}
```

### Search Dramas
```bash
curl "http://localhost:3001/api/search?q=romance&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Drama Details
```bash
curl "http://localhost:3001/api/drama/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Chapters/Episodes
```bash
curl "http://localhost:3001/api/chapter/bookId123?page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Streaming URL
```bash
curl -X POST "http://localhost:3001/api/chapter/bookId123/1/stream" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quality": "hd"}'
```

## 🛡️ Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/token` | 10 requests/minute |
| `/api/search` | 60 requests/minute |
| `/api/chapter/.../stream` | 20 requests/minute |
| Default | 60 requests/minute |

## 📊 Response Format

Semua response menggunakan format konsisten:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## 🔒 Security Features

- **DramaBox Token System** - Menggunakan token dan device ID dari DramaBox API
- **Rate Limiting** - Prevent abuse dengan pembatasan request per menit
- **CORS Protection** - Cross-origin security
- **Helmet.js** - Security headers
- **Input Validation** - Parameter validation
- **Error Handling** - Secure error messages
- **Auto Token Refresh** - Otomatis refresh token saat expired

## 🌐 DramaBox API Integration

API ini mengintegrasikan dengan DramaBox API menggunakan:

- **Base URL**: `https://sapi.dramaboxdb.com/drama-box`
- **Authentication**: Bearer token + Device ID
- **Headers**: Sesuai format DramaBox (tn, device-id, version, dll)
- **Endpoints**:
  - `/search/suggest` - Search suggestions
  - `/chapterv2/batch/load` - Chapters dan streaming
  - `/he001/theater` - Latest dramas

### Required Headers Format:
```javascript
{
  'tn': 'Bearer your_token_here',
  'device-id': 'your_device_id',
  'version': '430',
  'vn': '4.3.0',
  'cid': 'DRA1000042',
  'package-name': 'com.storymatrix.drama',
  'apn': '1',
  'language': 'in',
  'current-language': 'in',
  'p': '43',
  'time-zone': '+0700'
}
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "dramabox-api"
```

## 📝 Configuration

Environment variables yang bisa dikonfigurasi:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |
| `ALLOWED_ORIGINS` | * | CORS allowed origins |
| `DRAMABOX_TOKEN_URL` | - | **WAJIB!** URL untuk mendapatkan token dan device ID |
| `DRAMABOX_VERSION_CODE` | 430 | DramaBox app version code |
| `DRAMABOX_VERSION_NAME` | 4.3.0 | DramaBox app version name |
| `DRAMABOX_CID` | DRA1000042 | DramaBox channel ID |
| `DRAMABOX_LANGUAGE` | in | Language code |
| `DRAMABOX_PLATFORM_P` | 43 | Platform ID |

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

Jika mengalami masalah:

1. **Token Issues**: Pastikan `DRAMABOX_TOKEN_URL` sudah diset dan mengembalikan response yang benar
2. **API Errors**: Periksa log server di console untuk detail error
3. **Environment**: Pastikan environment variables sudah benar di file `.env`
4. **Health Check**: Cek endpoint `/health` untuk status API
5. **Diagnostics**: Gunakan endpoint `/api/client/status` untuk diagnostic
6. **Token Info**: Gunakan `/api/token` untuk cek status token saat ini

### Common Issues:

**1. "DRAMABOX_TOKEN_URL not set"**
- Pastikan file `.env` ada dan berisi `DRAMABOX_TOKEN_URL`

**2. "Invalid token payload"**
- URL token harus return JSON: `{"token": "...", "deviceid": "..."}`

**3. "Token expired, please refresh"** 
- Token otomatis refresh, tapi bisa manual dengan `/api/token/refresh`

## 📚 API Documentation

Untuk dokumentasi API lengkap, akses:
- Health check: `GET http://localhost:3001/health`
- API info: `GET http://localhost:3001/`
- Client config: `GET http://localhost:3001/api/client/config`

---

**Happy Coding! 🎬✨**