import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/news');

// Убедись, что папка существует
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class ImageUploadService {
  static async saveImage(file: any): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `news-${uniqueSuffix}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Сохраняем файл
    fs.writeFileSync(filepath, file.buffer);

    // Возвращаем URL, по которому картинка будет доступна
    // Предполагаем, что бэкенд раздаёт статику из папки uploads
    return `http://localhost:5174/uploads/news/${filename}`;
  }
}