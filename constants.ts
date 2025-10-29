// Fix: Import types from the dedicated types.ts file.
import { Message, MediaInfo } from './types';
import { Type } from '@google/genai';

export const SYSTEM_PROMPT = `You are a friendly, human-sounding 'Auto Insurance Prep Agent'. Your goal is to help users understand and decide on their auto insurance needs.
You will guide them through various coverage types and collect their vehicle information and desired coverage amounts.

For EVERY response, you MUST perform three tasks:
1.  Determine the most relevant topic for the conversation to select an 'imageKey'.
2.  Provide an illustrative story in the 'story' field. This MUST be an array of short strings (1-2 sentences each), where each string is a "frame" of the story. The story can have 1 to 3 frames.
3.  Analyze the user's LATEST message to extract any NEW or UPDATED information for the 'coverageUpdate' object. Only include fields that the user just provided or changed. If no new information is present for a category (vehicle or coverages), omit that category entirely.

**Structure for 'coverageUpdate':**
Your response MUST be a nested object. All vehicle-related details go inside a 'vehicle' object, and all coverage amounts go inside a 'coverages' object.

**Image Keys (imageKey):**
You MUST ONLY use one of the following: 'liability', 'collision', 'comprehensive', 'pip', 'underinsured', 'vehicle_selection', 'summary', 'error', 'default', 'welcome'.

**Coverage Details (coverageUpdate):**
- When the user provides their car details, extract them into 'coverageUpdate.vehicle'.
- When a user decides on a coverage amount, extract it into 'coverageUpdate.coverages'. For example, if they say "I'll take $100,000 for liability", you would set 'coverages': { 'liability': '$100,000' }.
- Be mindful of state context (e.g., state minimums for liability, or if PIP/MedPay is more common).

Your entire output MUST be a single, valid JSON object matching the provided schema. Be conversational and helpful in your 'responseText'.`;

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    responseText: {
      type: Type.STRING,
      description: 'Your conversational reply to the user.',
    },
    imageKey: {
      type: Type.STRING,
      description: `The most relevant image key. Must be one of: 'liability', 'collision', 'comprehensive', 'pip', 'underinsured', 'vehicle_selection', 'summary', 'error', 'default', 'welcome'.`,
    },
    story: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'An array of short, illustrative story "frames" for the current topic. Each frame should be 1-2 sentences. Usually 1-3 frames total.',
    },
    coverageUpdate: {
      type: Type.OBJECT,
      description: 'Contains NEW or UPDATED details from the user\'s last message, organized into vehicle and coverages.',
      properties: {
        vehicle: {
          type: Type.OBJECT,
          properties: {
            state: { type: Type.STRING, description: 'The user\'s state of residence (e.g., "California").' },
            makeModel: { type: Type.STRING, description: 'Vehicle make and model (e.g., "Honda Accord").' },
            year: { type: Type.STRING, description: 'Vehicle year (e.g., "2015").' },
            miles: { type: Type.STRING, description: 'Vehicle mileage (e.g., "120,000 miles").' },
            condition: { type: Type.STRING, description: 'Vehicle condition (e.g., "Good").' },
          }
        },
        coverages: {
          type: Type.OBJECT,
          properties: {
            liability: { type: Type.STRING, description: 'Liability coverage amount.' },
            collision: { type: Type.STRING, description: 'Collision coverage details (e.g., "$500 deductible").' },
            comprehensive: { type: Type.STRING, description: 'Comprehensive coverage details (e.g., "$250 deductible").' },
            pip: { type: Type.STRING, description: 'Personal Injury Protection or MedPay amount.' },
            underinsured: { type: Type.STRING, description: 'Uninsured/Underinsured Motorist coverage amount.' },
          }
        }
      }
    }
  },
  required: ['responseText', 'imageKey', 'story'],
};

export const PROGRESS_STEPS = ['vehicle', 'liability', 'collision', 'comprehensive', 'pip', 'underinsured'];

export const IMAGE_MAP: { [key: string]: MediaInfo } = {
  welcome: { src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1740&auto=format&fit=crop', alt: 'A silver sports car on a winding scenic road.', topic: 'Welcome!', type: 'image', story: ["You're about to embark on a journey to find the perfect auto insurance. Let's make sure you're well-prepared with the right knowledge for the road ahead."] },
  liability: { src: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1740&auto=format&fit=crop', alt: 'Two cars after a minor fender bender, representing liability coverage.', topic: 'Liability Coverage', type: 'image', story: ["You're trying to merge onto a busy street and accidentally misjudge the distance, causing a minor fender-bender with the car in front.", "Liability coverage is what pays for the other person's repairs and medical bills if you're at fault in an accident."] },
  collision: { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', alt: 'A car with significant front-end damage after a collision.', topic: 'Collision Coverage', type: 'video', story: ["You're driving through an intersection on a green light when another car unexpectedly runs their red light, hitting your passenger side.", "The impact crumples your door and shatters the window. Thankfully you're okay, but your car will need major repairs.", "Collision coverage helps pay for the damage to your own vehicle, regardless of who is at fault."] },
  comprehensive: { src: 'https://images.unsplash.com/photo-1599941951215-9a4c185b1a6b?q=80&w=1740&auto=format&fit=crop', alt: 'A car with a tree fallen on it, representing comprehensive coverage.', topic: 'Comprehensive Coverage', type: 'image', story: ["A surprise hailstorm rolls through your neighborhood overnight, leaving dozens of small dents on the hood and roof of your parked car.", "Comprehensive coverage handles damage from non-collision events, like weather, theft, vandalism, or hitting an animal."] },
  pip: { src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1740&auto=format&fit=crop', alt: 'A doctor checking a patient, representing personal injury protection.', topic: 'PIP / MedPay', type: 'image', story: ["After a minor accident, you and your passenger both have neck pain that requires a visit to the doctor and a few physical therapy sessions.", "Personal Injury Protection (PIP) or Medical Payments (MedPay) helps cover medical expenses and lost wages for you and your passengers, no matter who caused the accident."] },
  underinsured: { src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1674&auto=format&fit=crop', alt: 'A person on the phone looking at their damaged car with a worried expression.', topic: 'Uninsured/Underinsured', type: 'image', story: ["You're sitting at a red light when you're rear-ended. The other driver has no insurance, leaving you with a damaged bumper and a headache.", "This is where Uninsured Motorist coverage kicks in. It protects you by covering your repairs and medical bills when the at-fault driver has no insurance, or not enough insurance, to pay for your damages."] },
  vehicle_selection: { src: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1740&auto=format&fit=crop', alt: 'A shiny, modern yellow sports car.', topic: 'Your Vehicle', type: 'image', story: ["The first step is telling me about your vehicle. Every car has a unique story and insurance profile."] },
  summary: { src: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1740&auto=format&fit=crop', alt: 'A person reviewing an insurance document, representing a summary of needs.', topic: 'Your Insurance Plan', type: 'image', story: ["Let's review the plan we've built together to make sure it's a perfect fit for your needs."] },
  error: { src: 'https://images.unsplash.com/photo-1543285193-33e879824cc7?q=80&w=1740&auto=format&fit=crop', alt: 'A foggy road with low visibility, representing an error or confusion.', topic: 'Oops!', type: 'image', story: ["It seems we've hit a small bump in the road. Let's try that last part again."] },
  default: { src: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?q=80&w=1631&auto=format&fit=crop', alt: 'A person typing on a laptop, representing a general conversation topic.', topic: 'Let\'s Talk Insurance', type: 'image', story: ["Insurance can seem complex, but breaking it down step-by-step makes it easy to understand."] },
};

export const INITIAL_MESSAGE: Message = {
  role: 'model',
  text: "Hello! I'm here to help you figure out what auto insurance you might need. We can talk about different coverages and get you prepared before you shop for a policy. To start, could you please tell me the year, make, and model of your car, and what state you live in?"
};

export const INITIAL_STORY: string[] = ["You're about to embark on a journey to find the perfect auto insurance. Let's make sure you're well-prepared with the right knowledge and coverages for the road ahead."];
