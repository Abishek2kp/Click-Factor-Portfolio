/*
  THE ONLY FILE YOU NEED TO EDIT TO ADD OR CHANGE A VIDEO.

  To add a video:
  1. Run this from the docs folder (change the names) to make a web copy:
     ffmpeg -i "C:/path/to/original.mp4" -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart assets/video/my-video.mp4
  2. Save a poster as assets/posters/my-video.jpg and a 4-second silent clip as
     assets/previews/my-video.mp4.
  3. Add an entry below. Layout is automatic. Use format "wide" for 16:9 and
     "tall" for 9:16. Keep each file under 100 MB.
*/
const SECTIONS = [
  {
    id: "made-with-ai",
    title: "Made with AI",
    note: "Generated with AI tools. Concept, pacing and final cut by Click Factor.",
    videos: [
      {
        slug: "zeno",
        title: "The Story of Zeno",
        kind: "Documentary",
        description: "A merchant loses everything at sea and a philosophy is born.",
        tools: ["Grok", "Premiere Pro", "ElevenLabs"],
        format: "wide",
        runtime: "1:07",
      },
      {
        slug: "neuron",
        title: "Neuron",
        kind: "Client ad",
        description: "Product ad for a clinic platform, from WhatsApp to diet chart.",
        tools: ["Claude"],
        format: "tall",
        runtime: "1:07",
      },
      {
        slug: "mockly",
        title: "Mockly",
        kind: "Spec ad",
        description: "A concept SaaS launch ad where every frame is the pitch.",
        tools: ["Claude"],
        format: "tall",
        runtime: "0:20",
      },
      {
        slug: "universe-25",
        title: "Universe 25",
        kind: "Documentary",
        description: "The mouse utopia experiment that ended in extinction.",
        tools: ["Grok", "Premiere Pro", "ElevenLabs"],
        format: "wide",
        runtime: "1:14",
      },
    ],
  },
  {
    id: "after-effects",
    title: "After Effects",
    note: "Motion design built by hand, keyframe by keyframe.",
    videos: [
      {
        slug: "editor-ad",
        title: "Looking for a Video Editor?",
        kind: "Self-promo ad",
        description: "A roaming spotlight turns a hiring question into a pitch.",
        tools: ["After Effects"],
        format: "wide",
        runtime: "0:17",
      },
      {
        slug: "rule-of-72",
        title: "The Rule of 72",
        kind: "Finance explainer",
        description: "How long your money takes to double, in 21 seconds.",
        tools: ["After Effects", "Illustrator"],
        format: "tall",
        runtime: "0:21",
        bright: true,
      },
    ],
  },
];
