export type VideoStatus =
  | "queued" | "analyzing" | "analyzed" | "generating" | "generated" | "published" | "failed";

export type Video = {
  id: string;
  title: string;
  source: string;
  status: VideoStatus;
  duration: number;
  thumb: string;
  tag: string;
  updated: string;
  channel: string;
  progress?: number;
};

export const VIDEOS: Video[] = [
  { id: "v_4kh2", title: "How black holes warp time", source: "youtube.com/shorts/abc1", status: "generated", duration: 47, thumb: "#6d28d9", tag: "Physics", updated: "2h ago", channel: "minutephysics" },
  { id: "v_7lp9", title: "Why bees can't fly — in theory", source: "youtube.com/shorts/def4", status: "generating", duration: 38, thumb: "#0891b2", tag: "Biology", updated: "4m ago", progress: 62, channel: "kurzgesagt" },
  { id: "v_2nm1", title: "The chaos of three pendulums", source: "youtube.com/shorts/ghi7", status: "analyzed", duration: 55, thumb: "#0e7490", tag: "Math", updated: "12m ago", channel: "3blue1brown" },
  { id: "v_9qq3", title: "Penrose tilings, explained", source: "youtube.com/shorts/jkl0", status: "queued", duration: 0, thumb: "#475569", tag: "Math", updated: "1m ago", channel: "numberphile" },
  { id: "v_3rt6", title: "Where does mass come from?", source: "youtube.com/shorts/mno3", status: "published", duration: 51, thumb: "#a16207", tag: "Physics", updated: "1d ago", channel: "pbsspacetime" },
  { id: "v_6kd2", title: "A geometric proof of Pythagoras", source: "youtube.com/shorts/pqr5", status: "failed", duration: 32, thumb: "#991b1b", tag: "Math", updated: "6h ago", channel: "3blue1brown" },
  { id: "v_8vk9", title: "Why prime gaps look chaotic", source: "youtube.com/shorts/stu7", status: "analyzing", duration: 0, thumb: "#1e3a8a", tag: "Math", updated: "just now", progress: 28, channel: "numberphile" },
  { id: "v_5jh1", title: "Light cones in special relativity", source: "youtube.com/shorts/vwx9", status: "generated", duration: 44, thumb: "#831843", tag: "Physics", updated: "3d ago", channel: "pbsspacetime" },
];

export const CHANNELS = [
  { id: "c_3b1b", name: "3Blue1Brown",   handle: "@3blue1brown",   subs: "6.4M",  shorts: 38, accent: "#0e7490" },
  { id: "c_kurz", name: "Kurzgesagt",    handle: "@kurzgesagt",    subs: "22.1M", shorts: 24, accent: "#0891b2" },
  { id: "c_mp",   name: "MinutePhysics", handle: "@minutephysics", subs: "5.8M",  shorts: 51, accent: "#6d28d9" },
  { id: "c_npy",  name: "Numberphile",   handle: "@numberphile",   subs: "4.6M",  shorts: 19, accent: "#a16207" },
];

export const SHORTS = [
  { id: "s1", title: "The strange geometry of a Möbius strip", dur: "0:48", views: "2.4M", age: "2 days ago",  accent: "#0e7490", queued: false },
  { id: "s2", title: "How does a prism actually split light?",  dur: "0:55", views: "1.1M", age: "4 days ago",  accent: "#0891b2", queued: true,  status: "analyzed" as VideoStatus },
  { id: "s3", title: "Why π shows up in places it shouldn't",   dur: "1:02", views: "4.8M", age: "1 week ago",  accent: "#6d28d9", queued: false },
  { id: "s4", title: "The mind-bending math of fractals",       dur: "0:42", views: "892K", age: "1 week ago",  accent: "#1e3a8a", queued: true,  status: "published" as VideoStatus },
  { id: "s5", title: "Curvature is just rotation, sort of",     dur: "0:51", views: "1.5M", age: "2 weeks ago", accent: "#831843", queued: false },
  { id: "s6", title: "Eigenvectors, but visually",              dur: "0:39", views: "3.2M", age: "3 weeks ago", accent: "#a16207", queued: false },
];

export const STATUS_LABELS: Record<VideoStatus, string> = {
  queued: "Queued", analyzing: "Analyzing", analyzed: "Analyzed",
  generating: "Generating", generated: "Generated", published: "Published", failed: "Failed",
};

export const SCRIPT_TEXT = `from manim import *

class BlackHoleWarp(Scene):
    def construct(self):
        title = Text("How black holes warp time", font_size=42)
        title.set_color_by_gradient(BLUE_C, PURPLE_B)
        self.play(Write(title))
        self.wait(0.6)
        self.play(title.animate.to_edge(UP, buff=0.5).scale(0.6))

        grid = NumberPlane(
            x_range=[-7, 7, 1], y_range=[-4, 4, 1],
            background_line_style={"stroke_opacity": 0.4},
        )
        self.play(Create(grid), run_time=1.5)`;

export const TRANSCRIPT_TEXT = `Time, as Einstein realized, isn't a backdrop — it's part of the geometry.
Near a massive object, the spacetime grid stretches. Clocks tick slower the deeper you sit in the well.
A second on Earth is not the same second a satellite measures. We've checked. The numbers match.
And near a black hole, the warp gets so sharp that, from a distance, time appears to halt at the event horizon.`;

export const DESCRIPTION_TEXT = `A 60-second visualization of how mass distorts the geometry of time. Pulls from Schwarzschild's solution but stays intuitive — no math required. Designed for a portrait short.`;

export const PROMPT_TEXT = `Open on the title in light blue gradient on a dark navy background. Replace it with a 14×8 spacetime grid (white lines, 40% opacity). Drop a single bright "mass" dot at the origin and warp the grid radially inward, easing over ~2.6s. Add a small clock orbiting the dot — its tick speed should visibly slow as it nears the center. Annotate "event horizon" with a thin dashed circle at radius 1.4. Keep palette to white, navy, deep purple. Render at 9:16, 720p.`;
