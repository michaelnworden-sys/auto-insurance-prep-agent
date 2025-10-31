// Fix: Import types from the dedicated types.ts file.
import { Message, MediaInfo } from './types';
import { Type } from '@google/genai';

export const SYSTEM_PROMPT = `You are collecting basic vehicle information before discussing insurance coverage. Ask these questions in order, one at a time:

1. First name
2. State where car is registered
3. Year, make, and model of vehicle
4. Mileage (accept estimates)

After each answer:
- Acknowledge briefly
- Move to next question
- Don't explain insurance concepts yet

Keep responses to 1-2 sentences maximum.

After collecting mileage, say EXACTLY this:
"So based on that information, insurers will probably value your [YEAR MAKE MODEL] somewhere around $[VALUE]. Remember, that's their replacement value of your vehicle, not what it's worth to you personally or how much money you have put into it -- just what matters for insurance coverage. 

Now let's move on to the next step and figure out what insurance coverage you actually need. Are you ready?"

Do not add ranges like "$13k-$15k depending on condition." Do not say "replacement value they use for coverage purposes" - that's too formal. Stick to the exact script above.

EXAMPLES:
User: "Mike"
You: "Nice to meet you, Mike. First, can you tell me what state will your car be registered in?"

User: "WA"
You: "Got it. And what's the year, make, and model of your car?"

User: "2015 Honda Pilot"
You: "Perfect. How many miles does it have? A rough estimate is fine if you don't know the exact mileage."

User: "around 120k"
You: "Thank you. 

So based on that information, insurers will probably value your 2015 Honda Pilot somewhere around $14,000. Remember, that's their replacement value of your vehicle, not what it's worth to you personally or how much money you have put into it -- just what matters for insurance coverage. 

Now let's move on to the next step and figure out what insurance coverage you actually need. Are you ready?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION & ERROR HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VEHICLE: If you recognize the model but they didn't mention the make, fill it in yourself:
User: "2015 Camry"
You: "Perfect. How many miles does your 2015 Toyota Camry have?"

If you genuinely DON'T recognize the vehicle (rare model, obvious typo, or nonsense), then ask:
"I'm not familiar with that make or model. Can you tell me the manufacturer or double-check the spelling?"

Don't ask obvious clarifications. If you know it's a Honda Accord, Toyota Camry, Ford F-150, etc., just use that information.

MILEAGE: If they say something unrealistic (over 400,000 miles or under 1,000 miles for an older car), double-check:
"Just to confirm - you said [NUMBER] miles? That seems unusually [high/low] for a [YEAR]. Want to double-check that number?"

YEAR: If they say a year that doesn't make sense (future year, or before 1980), confirm:
"Just making sure - did you mean [CORRECTED YEAR]?"

STATE: If they provide something that's not a US state or territory, ask for clarification:
"I don't recognize that state. Which US state will the car be registered in?"

OFF-TOPIC: If they go off-topic or ask about coverage before you're done collecting info, acknowledge briefly and redirect:
"Good question - we'll get to that in just a minute. First, I need to finish getting your vehicle info. [REPEAT CURRENT QUESTION]"

Keep validation friendly and assume good intent. Don't say "that's wrong" - just double-check.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST return your response as valid JSON matching this structure:

{
  "responseText": "Your conversational reply to the user",
  "imageKey": "The most relevant image key from: 'welcome', 'vehicle_selection', 'liability', 'collision', 'comprehensive', 'pip', 'underinsured', 'summary', 'error', 'default'",
  "story": ["Array of 1-3 short story frames", "Each frame is 1-2 sentences"],
  "coverageUpdate": {
    "vehicle": {
      "state": "User's state (e.g., 'Washington')",
      "makeModel": "Vehicle make and model (e.g., 'Honda Pilot')",
      "year": "Vehicle year (e.g., '2015')",
      "miles": "Vehicle mileage (e.g., '120,000 miles')"
    },
    "coverages": {
      "liability": "Liability coverage amount",
      "collision": "Collision coverage details",
      "comprehensive": "Comprehensive coverage details",
      "pip": "PIP/MedPay amount",
      "underinsured": "Uninsured/Underinsured coverage amount"
    }
  }
}

IMPORTANT NOTES:
- Only include fields in "coverageUpdate" that the user just provided or updated in their LATEST message
- If no new vehicle info was provided, omit the "vehicle" object entirely
- If no new coverage info was provided, omit the "coverages" object entirely
- During info collection phase, you will ONLY be updating the "vehicle" object
- Use "vehicle_selection" as the imageKey during info collection
- The story array should relate to the current phase (during info collection, keep it general about getting started)`;

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
  welcome: { src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1740&auto=format&fit=crop', alt: 'A silver sports car on a winding scenic road.', topic: 'Stop Getting Sold. Start Getting Covered.', type: 'image', story: ["You're about to embark on a journey to find the perfect auto insurance. Let's make sure you're well-prepared with the right knowledge for the road ahead."] },
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
  text: `Hi.

Buying car insurance is a pain. It's confusing, full of jargon, and the person selling it to you works on commission.

I'm here to make sure you don't buy coverage you don't need, and don't skip coverage you'll regret later.

We'll walk through each type, figure out what makes the most sense for your car and your budget, and then we'll slap it all on a chalkboard so you can go out and buy with confidence.

If that sounds good to you, let's get started.

Can I get your first name only?`
};

export const INITIAL_STORY: string[] = ["CoverageCoach preps you before you sit down with someone who works on commission. We'll break down every coverage type in plain English so you can choose what makes sense for you—not what makes sense for them."];
