import { app } from "@azure/functions"; 
import { BlobServiceClient } from "@azure/storage-blob";


app.http('uploadBlob', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return { status: 400, jsonBody: { ok: false, message: 'No file uploaded' }};
        }

        // Підключення до локального емулятора
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);
        const containerName = 'test-container-psh';
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        const blockBlobClient = containerClient.getBlockBlobClient(file.name);
        const buffer = await file.arrayBuffer();

        await blockBlobClient.uploadData(Buffer.from(buffer));

        return { status: 200, jsonBody: { ok: true, message: 'File uploaded', fileName: file.name }};
    }
});