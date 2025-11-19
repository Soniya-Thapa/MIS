import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

const createTopic = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter_id = hashids.decode(chapterId);
    if (chapter_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapter ID",
      });
    }
    const parsedChapter_id = chapter_id[0]
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { topic_name, topic_number, description } = req.body;
    if (!topic_name || !topic_number || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide topic_name, topic_number and description",
      });
    }
    const userId = req.user.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const chapter = await prisma.chapter.findUnique({
      where: {
        chapter_id: parseInt(parsedChapter_id)
      },
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }
    const existingTopic = await prisma.topic.findFirst({
      where: {
        chapter_id: parseInt(parsedChapter_id),
        topic_number: parseInt(topic_number),
      },
    });
    if (existingTopic) {
      return res.status(409).json({
        success: false,
        message: `Topic ${topic_number} already exists for this subject`,
      });
    }

    const topic = await prisma.topic.create({
      data: {
        topic_name,
        topic_number: parseInt(topic_number),
        description,
        created_by: userId,
        chapter_id: parseInt(parsedChapter_id),
        updated_at: new Date(),
      },
      include: {
        chapter: {
          select: {
            chapter_id: true,
            subject_id: true,
            chapter_name: true,
            created_by: true,
            chapter_number: true,
            subjects: {
              select: {
                subject_id: true,
                subject_name: true,
                subject_code: true,
                semester_id: true,
                created_by: true,
                image: true,
                semester: {
                  select: {
                    semester_id: true,
                    course_id: true,
                    semester_number: true,
                    semester_name: true,
                    user_id: true,
                    course: { // ✅ nested select
                      select: {
                        course_id: true,
                        course_code: true,
                        course_name: true,
                        college_id: true,
                        created_by: true,
                        image: true,
                      },
                    },
                  },
                },
              }
            },
          }
        },
        user_topic_created_byTouser: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });
    const hashedTopic = {
      ...topic,
      topic_id: hashids.encode(topic.topic_id),
      chapter_id: hashids.encode(topic.chapter_id),
      created_by: hashids.encode(topic.created_by),
      chapter: {
        ...topic.chapter,
        chapter_id: hashids.encode(topic.chapter.chapter_id),
        subject_id: hashids.encode(topic.chapter.subject_id),
        created_by: hashids.encode(topic.chapter.created_by),
        subjects: {
          ...topic.chapter.subjects,
          subject_id: hashids.encode(topic.chapter.subjects.subject_id),
          semester_id: hashids.encode(topic.chapter.subjects.semester_id),
          created_by: hashids.encode(topic.chapter.subjects.created_by),
          semester: {
            ...topic.chapter.subjects.semester,
            semester_id: hashids.encode(topic.chapter.subjects.semester.semester_id),
            course_id: hashids.encode(topic.chapter.subjects.semester.course_id),
            user_id: hashids.encode(topic.chapter.subjects.semester.user_id),
            course: {
              ...topic.chapter.subjects.semester.course,
              course_id: hashids.encode(topic.chapter.subjects.semester.course.course_id),
              created_by: hashids.encode(topic.chapter.subjects.semester.course.created_by),
            },
          },
        },
      },
      user_topic_created_byTouser: {
        ...topic.user_topic_created_byTouser,
        user_id: hashids.encode(topic.user_topic_created_byTouser.user_id),
      },
    };
    return res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: hashedTopic,
    });
  } catch (error) {
    console.error("Error in createTopic:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating topic",
      error: error.message,
    });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic_id = hashids.decode(topicId);

    if (topic_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID",
      });
    }
    const parsedTopic_id = topic_id[0];

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { topic_name, topic_number, description } = req.body;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const existingTopic = await prisma.topic.findUnique({
      where: { topic_id: parseInt(parsedTopic_id) },
    });

    if (!existingTopic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    const updateData = {};
    if (topic_name) updateData.topic_name = topic_name;
    if (topic_number) updateData.topic_number = parseInt(topic_number);
    if (description) updateData.description = description;
    updateData.updated_at = new Date();

    const topic = await prisma.topic.update({
      where: {
        topic_id: parseInt(parsedTopic_id)
      },
      data: updateData,
      include: {
        chapter: {
          select: {
            chapter_id: true,
            subject_id: true,
            chapter_name: true,
            created_by: true,
            chapter_number: true,
            subjects: {
              select: {
                subject_id: true,
                subject_name: true,
                subject_code: true,
                semester_id: true,
                created_by: true,
                image: true,
                semester: {
                  select: {
                    semester_id: true,
                    course_id: true,
                    semester_number: true,
                    semester_name: true,
                    user_id: true,
                    course: { // ✅ nested select
                      select: {
                        course_id: true,
                        course_code: true,
                        course_name: true,
                        college_id: true,
                        created_by: true,
                        image: true,
                      },
                    },
                  },
                },
              }
            },
          },
        },
        user_topic_created_byTouser: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });
    const hashedTopic = {
      ...topic,
      topic_id: hashids.encode(topic.topic_id),
      chapter_id: hashids.encode(topic.chapter_id),
      created_by: hashids.encode(topic.created_by),
      chapter: {
        ...topic.chapter,
        chapter_id: hashids.encode(topic.chapter.chapter_id),
        subject_id: hashids.encode(topic.chapter.subject_id),
        created_by: hashids.encode(topic.chapter.created_by),
        subjects: {
          ...topic.chapter.subjects,
          subject_id: hashids.encode(topic.chapter.subjects.subject_id),
          semester_id: hashids.encode(topic.chapter.subjects.semester_id),
          created_by: hashids.encode(topic.chapter.subjects.created_by),
          semester: {
            ...topic.chapter.subjects.semester,
            semester_id: hashids.encode(topic.chapter.subjects.semester.semester_id),
            course_id: hashids.encode(topic.chapter.subjects.semester.course_id),
            user_id: hashids.encode(topic.chapter.subjects.semester.user_id),
            course: {
              ...topic.chapter.subjects.semester.course,
              course_id: hashids.encode(topic.chapter.subjects.semester.course.course_id),
              created_by: hashids.encode(topic.chapter.subjects.semester.course.created_by),
            },
          },
        },
      },
      user_topic_created_byTouser: {
        ...topic.user_topic_created_byTouser,
        user_id: hashids.encode(topic.user_topic_created_byTouser.user_id),
      },
    };

    return res.status(200).json({
      success: true,
      message: "Topic updated successfully",
      data: hashedTopic,
    });
  } catch (error) {
    console.error("Error in updateTopic:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating topic",
      error: error.message,
    });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic_id = hashids.decode(topicId);

    if (topic_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID",
      });
    }

    const parsedTopic_id = topic_id[0];
    await prisma.topic.delete({
      where: { topic_id: parseInt(parsedTopic_id) },
    });

    return res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTopic:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting topic",
      error: error.message,
    });
  }
};

const getTopicsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter_id = hashids.decode(chapterId);

    if (chapter_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapter ID",
      });
    }
    const parsedChapter_id = chapter_id[0];
    const topics = await prisma.topic.findMany({
      where: {
        chapter_id: parseInt(parsedChapter_id),
      },
      include: {
        studymaterial: true,  // Changed from studyMaterials to materials
        user_topic_created_byTouser: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
        chapter: {
          select:{
            chapter_id:true,
            subject_id:true,
            chapter_name:true,
            created_by:true,
            chapter_number:true
          }
        }  // Include chapter information if needed
      },
    });
    if (!topics.length) {
      return res.status(404).json({
        success: false,
        message: "Topics not found"
      });
    }
    const hashedTopics = topics.map((topic) => ({
      ...topic,
      topic_id: hashids.encode(topic.topic_id),
      chapter_id: hashids.encode(topic.chapter_id),
      created_by: hashids.encode(topic.created_by),
      user_topic_created_byTouser:{
        ...topic.user_topic_created_byTouser,
        user_id:hashids.encode(topic.user_topic_created_byTouser.user_id)
      },
      chapter:{
        ...topic.chapter,
        chapter_id:hashids.encode(topic.chapter.chapter_id),
        subject_id:hashids.encode(topic.chapter.subject_id),
        created_by:hashids.encode(topic.chapter.created_by),
      }
    }));

    return res.status(200).json({
      success: true,
      data: hashedTopics,
    });
  } catch (error) {
    console.error("Error in getTopics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching topics",
      error: error.message,
    });
  }
};

const getTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic_id = hashids.decode(topicId);

    if (topic_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID",
      });
    }
    const parsedTopic_id = topic_id[0];
    const topic = await prisma.topic.findUnique({
      where: { topic_id: parseInt(parsedTopic_id) },
      include: {
        chapter: {
          select: {
            chapter_id: true,
            subject_id: true,
            chapter_name: true,
            created_by: true,
            chapter_number: true,
            subjects: {
              select: {
                subject_id: true,
                subject_name: true,
                subject_code: true,
                semester_id: true,
                created_by: true,
                image: true,
                semester: {
                  select: {
                    semester_id: true,
                    course_id: true,
                    semester_number: true,
                    semester_name: true,
                    user_id: true,
                    course: { // ✅ nested select
                      select: {
                        course_id: true,
                        course_code: true,
                        course_name: true,
                        college_id: true,
                        created_by: true,
                        image: true,
                      },
                    },
                  },
                },
              }
            },
          }
        },
        studymaterial: true,
        user_topic_created_byTouser: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }
    const hashedTopic = {
      ...topic,
      topic_id: hashids.encode(topic.topic_id),
      chapter_id: hashids.encode(topic.chapter_id),
      created_by: hashids.encode(topic.created_by),
      chapter: {
        ...topic.chapter,
        chapter_id: hashids.encode(topic.chapter.chapter_id),
        subject_id: hashids.encode(topic.chapter.subject_id),
        created_by: hashids.encode(topic.chapter.created_by),
        subjects: {
          ...topic.chapter.subjects,
          subject_id: hashids.encode(topic.chapter.subjects.subject_id),
          semester_id: hashids.encode(topic.chapter.subjects.semester_id),
          created_by: hashids.encode(topic.chapter.subjects.created_by),
          semester: {
            ...topic.chapter.subjects.semester,
            semester_id: hashids.encode(topic.chapter.subjects.semester.semester_id),
            course_id: hashids.encode(topic.chapter.subjects.semester.course_id),
            user_id: hashids.encode(topic.chapter.subjects.semester.user_id),
            course: {
              ...topic.chapter.subjects.semester.course,
              course_id: hashids.encode(topic.chapter.subjects.semester.course.course_id),
              created_by: hashids.encode(topic.chapter.subjects.semester.course.created_by),
            },
          },
        },
      },
      user_topic_created_byTouser: {
        ...topic.user_topic_created_byTouser,
        user_id: hashids.encode(topic.user_topic_created_byTouser.user_id),
      },
    };
    return res.status(200).json({
      success: true,
      data: hashedTopic,
    });
  } catch (error) {
    console.error("Error in getTopicById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching topic",
      error: error.message,
    });
  }
};

const getAllTopics = async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        chapter: {
          select: {
            chapter_id: true,
            chapter_name: true,
            chapter_number: true,
            subjects: {
              select: {
                subject_id: true,
                subject_name: true,
                semester: {
                  select: {
                    semester_id: true,
                    semester_name: true,
                    course: {
                      select: {
                        course_id: true,
                        course_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        user_topic_created_byTouser: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });
    const hashedTopics = topics.map((topic) => ({
      ...topic,
      topic_id: hashids.encode(topic.topic_id),
      chapter_id: hashids.encode(topic.chapter_id),
      created_by: hashids.encode(topic.created_by),
      chapter: {
        ...topic.chapter,
        chapter_id: hashids.encode(topic.chapter.chapter_id),
        subjects: {
          ...topic.chapter.subjects,
          subject_id: hashids.encode(topic.chapter.subjects.subject_id),
          semester: {
            ...topic.chapter.subjects.semester,
            semester_id: hashids.encode(topic.chapter.subjects.semester.semester_id),
            course: {
              ...topic.chapter.subjects.semester.course,
              course_id: hashids.encode(topic.chapter.subjects.semester.course.course_id),
            },
          },
        },
      },
      user_topic_created_byTouser: {
        ...topic.user_topic_created_byTouser,
        user_id: hashids.encode(topic.user_topic_created_byTouser.user_id),
      },
    }));
    return res.status(200).json({
      success: true,
      data: hashedTopics,
    });
  } catch (error) {
    console.error("Error in getAllTopics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching topics",
      error: error.message,
    });
  }
};

const getTopicTitles = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }

    const { topicIds } = req.body; // Array of hashed topic IDs
    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty topicIds array",
      });
    }

    const decodedIds = topicIds
      .map(id => hashids.decode(id)[0])
      .filter(id => id);

    if (decodedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic IDs",
      });
    }

    const topicTitles = await prisma.topic.findMany({
      where: { topic_id: { in: decodedIds } },
      select: { topic_id: true, topic_name: true },
    });

    const hashedTitles = topicTitles.map(topic => ({
      topic_id: hashids.encode(topic.topic_id),
      topic_name: topic.topic_name,
    }));

    return res.status(200).json({
      success: true,
      data: hashedTitles,
    });
  } catch (error) {
    console.error("Error in getTopicTitles:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching topic titles",
      error: error.message,
    });
  }
};

export {
  createTopic,
  updateTopic,
  deleteTopic,
  getTopicsByChapter,
  getTopicById,
  getAllTopics,
  getTopicTitles,
};