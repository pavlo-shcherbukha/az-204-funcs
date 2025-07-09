import { app } from "@azure/functions"
import { BlobServiceClient } from "@azure/storage-blob";
import crypto from 'crypto';




app.http('downloadmultyBlob', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Отримуємо containerName з query-параметра
        const containerName = request.query.get('containerName');
        if (!containerName) {
            return { status: 400, jsonBody: { ok: false, message: 'No containerName specified' }};
        }

        // Список файлів для завантаження
        const filesToDownload = ['pic-01.png', 'pic-02.png'];

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Завантажуємо файли
        const fileParts = [];
        for (const fileName of filesToDownload) {
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);
            const downloadBlockBlobResponse = await blockBlobClient.download();
            const fileBuffer = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);

            fileParts.push({
                fileName,
                buffer: fileBuffer,
                contentType: 'application/octet-stream'
            });
        }

        // Формуємо multipart/form-data відповідь з полем containerName
        const boundary = '----funcboundary' + crypto.randomBytes(8).toString('hex');
        const parts = [];

        // Додаємо текстове поле containerName
        parts.push(Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="containerName"\r\n\r\n${containerName}\r\n`, 'utf8'
        ));

        // Додаємо файли
        for (const part of fileParts) {
            parts.push(Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${part.fileName}"\r\nContent-Type: ${part.contentType}\r\n\r\n`, 'utf8'
            ));
            parts.push(part.buffer);
            parts.push(Buffer.from('\r\n', 'utf8'));
        }

        // Завершення multipart
        parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

        const multipartBody = Buffer.concat(parts);

        return {
            status: 200,
            body: multipartBody,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }
        };
    }
});

// Допоміжна функція для читання потоку у Buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}