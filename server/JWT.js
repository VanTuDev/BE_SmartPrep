import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Sinh ra một chuỗi bí mật dài 12 ký tự
const secret = crypto.randomBytes(12).toString('hex');

// Ghi chuỗi bí mật vào file .env hoặc in ra console
const envPath = path.join(process.cwd(), '.env');
fs.appendFileSync(envPath, `JWT_SECRET=${secret}\n`);

console.log(`JWT_SECRET đã được tạo: ${secret}`);
console.log('Đã ghi JWT_SECRET vào file .env');
