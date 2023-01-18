const functions = require("@google-cloud/functions-framework");
const { Storage } = require("@google-cloud/storage");
const { TranslationServiceClient } = require("@google-cloud/translate").v3beta1;
const Joi = require("joi");

const storage = new Storage();

const translationClient = new TranslationServiceClient();

functions.cloudEvent("translateDocument", async (cloudEvent) => {
  const envVarsSchema = Joi.object()
    .keys({
      TARGET_LANGUAGE_CODES: Joi.string().required(),
    })
    .unknown();

  const { value: envVars, error: envVarsError } = envVarsSchema.validate(
    process.env
  );

  if (envVarsError) {
    throw envVarsError;
  }

  const file = cloudEvent.data;

  console.log("Received file", file);

  const fileDownloadResponse = await storage
    .bucket(file.bucket)
    .file(file.name)
    .download();

  const fileContents = fileDownloadResponse.toString();

  const parent = `projects/${await translationClient.getProjectId()}`;

  const detectLanguageContentSizeLimit = 204800 / 2;

  const [detectLanguageResponse] = await translationClient.detectLanguage({
    parent,
    content: fileContents.substring(0, detectLanguageContentSizeLimit),
  });

  console.log("Detected languages", detectLanguageResponse);

  // const detectLangua

  // const [detectLanguageResponse] = await translationClient.detectLanguage()

  // const documentInputConfig = {
  //   gcsSource: {
  //     inputUri: inputUri,
  //   },
  // };

  // const request = {
  //   parent: translationClient.locationPath(projectId, location),
  //   documentInputConfig: documentInputConfig,
  //   sourceLanguageCode: 'en-US',
  //   targetLanguageCode: 'sr-Latn',
  // };

  // // Run request
  // const [response] = await translationClient.translateDocument(request);

  // console.log(
  //   `Response: Mime Type - ${response.documentTranslation.mimeType}`
  // );

  // console.log(`Event ID: ${cloudEvent.id}`);
  // console.log(`Event Type: ${cloudEvent.type}`);

  // console.log(`Bucket: ${file.bucket}`);
  // console.log(`File: ${file.name}`);
  // console.log(`Metageneration: ${file.metageneration}`);
  // console.log(`Created: ${file.timeCreated}`);
  // console.log(`Updated: ${file.updated}`);
});
