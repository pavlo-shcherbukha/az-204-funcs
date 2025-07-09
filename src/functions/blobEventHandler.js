import { app } from "@azure/functions";
import { BlobServiceClient, ContainerClient, BlobClient } from "@azure/storage-blob";

app.storageBlob("blobEventHandler", {
    path: 'test-blob-events/{name}',
    connection: 'AzureWebJobsStorage', // Це рядок підключення
    handler: async (blobContent, context) => { // Змінили ім'я параметра на blobContent
        context.log(`Blob trigger processing: ${context.triggerMetadata.name}`);
                                                       // Ім'я блоба з метаданих
        const blobName = context.triggerMetadata.name //as string; 
        const containerName = "test-blob-events"; // Ім'я контейнера з шляху тригера

        // Отримайте рядок підключення з налаштувань програми
        const connectionString = process.env["AzureWebJobsStorage"];
        if (!connectionString) {
            context.error("AzureWebJobsStorage connection string is not set.");
            return;
        }

        // Створіть BlobServiceClient
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

        // Отримайте ContainerClient
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Отримайте BlobClient для поточного блоба
        const blobClient = containerClient.getBlobClient(blobName);

        // Тепер ви можете використовувати методи BlobClient
        try {
            const blobProperties = await blobClient.getProperties();
            context.log(`Blob size: ${blobProperties.contentLength}`);
            context.log(`Blob content type: ${blobProperties.contentType}`);

            // Завантаження вмісту (для демонстрації, обережно з великими файлами!)
            // const downloadResponse = await blobClient.downloadToBuffer();
            // context.log(`Downloaded content length: ${downloadResponse.length}`);

        } catch (error) {
            context.error(`Error accessing blob properties: ${error.message}`);
        }

        // Якщо blobContent - це вміст блоба, ви можете його обробити:
        if (blobContent instanceof Buffer) {
            context.log(`Blob content received as Buffer, length: ${blobContent.length}`);
            // Приклад: перетворення в рядок, якщо це текстовий файл
            // context.log(`Blob content (first 50 chars): ${blobContent.toString('utf8').substring(0, 50)}`);
        } else if (typeof blobContent === 'string') {
            context.log(`Blob content received as string, length: ${blobContent.length}`);
            // context.log(`Blob content (first 50 chars): ${blobContent.substring(0, 50)}`);
        } else {
             context.log(`Blob content received as unexpected type: ${typeof blobContent}`);
        }
    }
});