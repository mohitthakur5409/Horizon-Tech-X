// storyController.js
// Controller for managing user stories on a social-media web app

const Story = require('../models/story'); // Assuming you have a Story model
const User = require('../models/user');   // Optional: if you need user validation

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { text, content, mediaUrl } = req.body;

    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const story = new Story({
      userId,
      content: text ?? content ?? "",
      mediaUrl: mediaUrl || undefined,
      createdAt: Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await story.save();
    await story.populate("userId", "username profilePic");

    res.status(201).json(storyToUi(story));
  } catch (error) {
    res.status(500).json({ message: "Error creating story", error: error.message });
  }
};

// Get all active stories
exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: Date.now() } })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    res.json(stories.map(storyToUi));
  } catch (error) {
    res.status(500).json({ message: "Error fetching stories", error: error.message });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const stories = await Story.find({ userId, expiresAt: { $gt: Date.now() } })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    res.json(stories.map(storyToUi));
  } catch (error) {
    res.status(500).json({ message: "Error fetching stories", error: error.message });
  }
};

// Delete a story
exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id;

    const story = await Story.findOne({ _id: storyId, userId });
    if (!story) return res.status(404).json({ message: "Story not found or unauthorized" });

    await story.deleteOne();
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting story", error: error.message });
  }
};

function storyToUi(story) {
  return {
    id: story._id,
    accent: "#2563eb",
    author: {
      id: story.userId?._id,
      name: story.userId?.username || "User",
      username: story.userId?.username || "user",
      avatar: story.userId?.profilePic,
    },
    text: story.content,
    mediaUrl: story.mediaUrl,
    createdAt: story.createdAt,
  };
}

