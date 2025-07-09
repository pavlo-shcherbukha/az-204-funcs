import "@azure/functions-extensions-blob";
import { app, output, input } from "@azure/functions"; // Додано 'input' і 'output'
import { BlobServiceClient } from "@azure/storage-blob";

// Оголосіть вихідну прив'язку responseQueueOutput ЗОВНІ функції
const responseQueueOutput = output.storageQueue({
    name: "responseQueueMessage",
    queueName: "blob-copy-response-queue",
    connection: "AzureWebJobsStorage"
});

app.storageQueue("queueConsumerHandler", {
    queueName: "blob-processing-queue",
    connection: "AzureWebJobsStorage",
    extraOutputs: [responseQueueOutput], // Передаємо оголошений об'єкт
    handler: async (queueItem, context) => {
        context.log(`Queue trigger processed message: ${queueItem}`);

        let blobInfo;

        try {
            //blobInfo = JSON.parse(queueItem);
            blobInfo = queueItem;
        } catch (error) {
            context.error(`Failed to parse queue message as JSON: ${error.message}`);
            // Важливо: відправити помилку навіть якщо парсинг JSON не вдався
            context.extraOutputs.set(responseQueueOutput, {
                status: "failed",
                message: "Failed to parse input queue message.",
                rawMessage: queueItem
            });
            return;
        }

        const { blobName, containerName, blobUrl } = blobInfo;
        const targetContainerName = "processed-blob-events";
        const newBlobName = `copied-${blobName}`;

        const connectionString = process.env["AzureWebJobsStorage"];
        if (!connectionString) {
            context.error("AzureWebJobsStorage connection string is not set.");
            context.extraOutputs.set(responseQueueOutput, {
                status: "failed",
                message: "Missing AzureWebJobsStorage connection string.",
                originalBlob: blobName
            });
            return;
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

        try {
            const sourceContainerClient = blobServiceClient.getContainerClient(containerName);
            const sourceBlobClient = sourceContainerClient.getBlobClient(blobName);

            const targetContainerClient = blobServiceClient.getContainerClient(targetContainerName);
            await targetContainerClient.createIfNotExists();
            const targetBlobClient = targetContainerClient.getBlobClient(newBlobName);

            const copyResponse = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
            await copyResponse.pollUntilDone();

            context.log(`Successfully copied blob '${blobName}' from '${containerName}' to '${targetContainerName}' as '${newBlobName}'`);

            context.extraOutputs.set(responseQueueOutput, { // Передаємо об'єкт responseQueueOutput
                status: "success",
                originalBlob: blobName,
                originalContainer: containerName,
                copiedBlob: newBlobName,
                targetContainer: targetContainerName,
                copiedAt: new Date().toISOString(),
                newBlobUrl: targetBlobClient.url
            });

        } catch (error) {
            context.error(`Error copying blob ${blobName}: ${error.message}`);
            context.extraOutputs.set(responseQueueOutput, { // Передаємо об'єкт responseQueueOutput
                status: "failed",
                message: `Failed to copy blob: ${error.message}`,
                originalBlob: blobName,
                originalContainer: containerName,
                errorDetails: error.message
            });
        }
    }
});