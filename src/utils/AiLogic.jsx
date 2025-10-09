import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, Schema } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};


const firebaseApp = initializeApp(firebaseConfig);
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const appCheck = initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider('your-key-here'),

  isTokenAutoRefreshEnabled: true
});

const metadataSchema = Schema.object({
  properties: {
    description: Schema.string({ description: "A concise, one-sentence description of the image." }),
    categories: Schema.array({
      description: "An array of 4-7 relevant keywords.",
      items: Schema.string(),
    }),
    dominant_colors: Schema.array({
      description: "An array of the top 3 dominant color hex codes in the image.",
      items: Schema.string(),
    }),
  },
  required: ["description", "categories", "dominant_colors"],
});

const sortingSchema = Schema.object({
  properties: {
    sorted_groups: Schema.array({
      description: "An array of groups, where each group contains images belonging to that category.",
      items: Schema.object({
        properties: {
          group_name: Schema.string({ description: "The name of the category or group." }),
          images: Schema.array({ items: metadataSchema }),
        },
        required: ["group_name", "images"],
      }),
    }),
  },
  required: ["sorted_groups"],
});

export const metadataModel = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: { model: "gemini-2.5-flash-lite", generationConfig: { responseMimeType: "application/json", responseSchema: metadataSchema }},
    onDeviceParams: { promptOptions: { responseConstraint: metadataSchema }, createOptions: {expectedInputs: [{type: "image"}, {type: "text"}]}},
});

const sortingModel = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: { model: "gemini-2.5-flash-lite", generationConfig: { responseMimeType: "application/json", responseSchema: sortingSchema }},
    onDeviceParams: { promptOptions: { responseConstraint: sortingSchema }},
});

const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const generateImageMetadata = async (images, userInput = '') => {
  try {
    const metadataPromises = images.map(async (imageFile) => {
      const imagePart = await fileToGenerativePart(imageFile);
      let prompt = `Analyze this image and generate the following metadata in JSON format: a concise 'description', an array of 4-7 'categories', and the top 3 'dominant_colors' as hex codes.`;
      if (userInput) {
        prompt += ` Focus the analysis on: "${userInput}".`;
      }
      const result = await metadataModel.generateContent([prompt, imagePart]);
      return JSON.parse(result.response.text());
    });
    return await Promise.all(metadataPromises);
  } catch (error) {
    console.error("Error generating image metadata:", error);
    return new Array(images.length).fill(null);
  }
}

export const sortAndCategorizeImages = async (imageMetadataArray, sortBy) => {
  if (!imageMetadataArray || imageMetadataArray.length === 0) return { sorted_groups: [] };
  try {
    const prompt = `You are a photo gallery organizer. Based on the following image metadata, group the images according to the user's preference to sort by ${sortBy}. Image Metadata: ${JSON.stringify(imageMetadataArray, null, 2)}. Return a single JSON object categorizing all images into logical groups. Ensure every image is placed into exactly one group.`;

    const result = await sortingModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Error sorting images:", error);
    return { sorted_groups: [] };
  }
}
