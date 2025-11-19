import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

const createChapter = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSubject_id = subject_id[0]
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { chapter_name, chapter_number, description } = req.body;
    if (!chapter_name || !chapter_number || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide chapter_name, description and chapter_number",
      });
    }
    const userId = req.user.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const subject = await prisma.subject.findUnique({
      where: {
        subject_id: parseInt(parsedSubject_id),
      }
    });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const existingChapter = await prisma.chapter.findFirst({
      where: {
        subject_id: parseInt(parsedSubject_id),
        chapter_number: parseInt(chapter_number),
      },
    });
    if (existingChapter) {
      return res.status(409).json({
        success: false,
        message: `Chapter ${chapter_number} already exists for this subject`,
      });
    }

    const chapter = await prisma.chapter.create({
      data: {
        chapter_name,
        chapter_number: parseInt(chapter_number),
        description,
        subjects: { connect: { subject_id: parseInt(parsedSubject_id) } },
        user_chapter_created_byTouser: { connect: { user_id: userId } },
        updated_at: new Date(),
      },
      include: {
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
        user_chapter_created_byTouser: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    const hashedChapter = {
      ...chapter,
      chapter_id: hashids.encode(chapter.chapter_id),
      subject_id: hashids.encode(chapter.subject_id),
      created_by: hashids.encode(chapter.created_by),
      subjects: {
        ...chapter.subjects,
        subject_id: hashids.encode(chapter.subjects.subject_id),
        semester_id: hashids.encode(chapter.subjects.semester_id),
        created_by: hashids.encode(chapter.subjects.created_by),
        semester: {
          ...chapter.subjects.semester,
          semester_id: hashids.encode(chapter.subjects.semester.semester_id),
          course_id: hashids.encode(chapter.subjects.semester.course_id),
          user_id: hashids.encode(chapter.subjects.semester.user_id),
          course: {
            ...chapter.subjects.semester.course,
            course_id: hashids.encode(chapter.subjects.semester.course.course_id),
            created_by: hashids.encode(chapter.subjects.semester.course.created_by),
          },
        },
      },
      user_chapter_created_byTouser: {
        ...chapter.user_chapter_created_byTouser,
        user_id: hashids.encode(chapter.user_chapter_created_byTouser.user_id),
      }
    };
    return res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: hashedChapter,
    });
  } catch (error) {
    console.error("Error in createChapter:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating chapter",
      error: error.message,
    });
  }
};

const updateChapter = async (req, res) => {
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
    const { chapter_name, chapter_number, description } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        chapter_id: parseInt(parsedChapter_id)
      },
    });
    if (!existingChapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }
    const updateData = {};
    if (chapter_name) updateData.chapter_name = chapter_name;
    if (chapter_number) updateData.chapter_number = parseInt(chapter_number);
    if (description) updateData.description = description;
    updateData.updated_at = new Date();

    const chapter = await prisma.chapter.update({
      where: {
        chapter_id: parseInt(parsedChapter_id)
      },
      data: updateData,
      include: {
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
        user_chapter_created_byTouser: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    const hashedChapter = {
      ...chapter,
      chapter_id: hashids.encode(chapter.chapter_id),
      subject_id: hashids.encode(chapter.subject_id),
      created_by: hashids.encode(chapter.created_by),
      subjects: {
        ...chapter.subjects,
        subject_id: hashids.encode(chapter.subjects.subject_id),
        semester_id: hashids.encode(chapter.subjects.semester_id),
        created_by: hashids.encode(chapter.subjects.created_by),
        semester: {
          ...chapter.subjects.semester,
          semester_id: hashids.encode(chapter.subjects.semester.semester_id),
          course_id: hashids.encode(chapter.subjects.semester.course_id),
          user_id: hashids.encode(chapter.subjects.semester.user_id),
          course: {
            ...chapter.subjects.semester.course,
            course_id: hashids.encode(chapter.subjects.semester.course.course_id),
            created_by: hashids.encode(chapter.subjects.semester.course.created_by),
          },
        },
      },
      user_chapter_created_byTouser: {
        ...chapter.user_chapter_created_byTouser,
        user_id: hashids.encode(chapter.user_chapter_created_byTouser.user_id),
      },
    };
    return res.status(200).json({
      success: true,
      message: "Chapter updated successfully",
      data: hashedChapter,
    });
  } catch (error) {
    console.error("Error in updateChapter:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating chapter",
      error: error.message,
    });
  }
};

const deleteChapter = async (req, res) => {
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
    await prisma.chapter.delete({
      where: {
        chapter_id: parseInt(parsedChapter_id)
      },
    });

    return res.status(200).json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteChapter:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting chapter",
      error: error.message,
    });
  }
};

const getChaptersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSubject_id = subject_id[0]
    const chapters = await prisma.chapter.findMany({
      where: {
        subject_id: parseInt(parsedSubject_id),
      },
      include: {
        topic: true,
        user_userchapters: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });
    if (chapters.length == 0) {
      return res.status(404).json({
        success: false,
        message: "Chapters not found"
      });
    }
    const hashedChapters = chapters.map((chapter) => ({
      ...chapter,
      chapter_id: hashids.encode(chapter.chapter_id),
      subject_id: hashids.encode(chapter.subject_id),
      created_by: hashids.encode(chapter.created_by),
    }));
    return res.status(200).json({
      success: true,
      data: hashedChapters,
    });
  } catch (error) {
    console.error("Error in getChapters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chapters",
      error: error.message,
    });
  }
};

const getChapterById = async (req, res) => {
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
    const chapter = await prisma.chapter.findUnique({
      where: {
        chapter_id: parseInt(parsedChapter_id)
      },
      include: {
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
        topic: true,
        user_userchapters: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }
    const hashedChapter = {
      ...chapter,
      chapter_id: hashids.encode(chapter.chapter_id),
      subject_id: hashids.encode(chapter.subject_id),
      created_by: hashids.encode(chapter.created_by),
      subjects: {
        ...chapter.subjects,
        subject_id: hashids.encode(chapter.subjects.subject_id),
        semester_id: hashids.encode(chapter.subjects.semester_id),
        created_by: hashids.encode(chapter.subjects.created_by),
        semester: {
          ...chapter.subjects.semester,
          semester_id: hashids.encode(chapter.subjects.semester.semester_id),
          course_id: hashids.encode(chapter.subjects.semester.course_id),
          user_id: hashids.encode(chapter.subjects.semester.user_id),
          course: {
            ...chapter.subjects.semester.course,
            course_id: hashids.encode(chapter.subjects.semester.course.course_id),
            created_by: hashids.encode(chapter.subjects.semester.course.created_by),
          },
        },
      },
      user_userchapters: chapter.user_userchapters.map(user => ({
        ...user,
        user_id: hashids.encode(user.user_id),
      })),
    };
    return res.status(200).json({
      success: true,
      data: hashedChapter,
    });
  } catch (error) {
    console.error("Error in getChapterById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chapter",
      error: error.message,
    });
  }
};

const getAllChapters = async (req, res) => {
  try {
    const chapters = await prisma.chapter.findMany({
      include: {
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
        topic: true, // Include topic if needed
      },
    });
    const hashedChapters = chapters.map((chapter) => ({
      ...chapter,
      chapter_id: hashids.encode(chapter.chapter_id),
      subject_id: hashids.encode(chapter.subject_id),
      created_by: hashids.encode(chapter.created_by),
      subjects: {
        ...chapter.subjects,
        subject_id: hashids.encode(chapter.subjects.subject_id),
        semester: {
          ...chapter.subjects.semester,
          semester_id: hashids.encode(chapter.subjects.semester.semester_id),
          course: {
            ...chapter.subjects.semester.course,
            course_id: hashids.encode(chapter.subjects.semester.course.course_id),
          }
        }
      }
    }));
    return res.status(200).json({
      success: true,
      data: hashedChapters,
    });
  } catch (error) {
    console.error("Error in getAllChapters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chapters",
      error: error.message,
    });
  }
};

const getChapterTitles = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { chapterIds } = req.body; // Expect an array of course IDs in the request body
    if (!chapterIds) {
      return res.status(400).json({
        success: false,
        message: "ChapterIds are required"
      });
    }
    if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty chapterIds array",
      });
    }
    // Decode each hashed ID
    const decodedIds = chapterIds
      .map(id => hashids.decode(id)[0])
      .filter(id => id); // remove any undefined/null
    if (decodedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapter IDs",
      });
    }
    // Fetch course titles for the given course IDs
    const chapterTitles = await prisma.chapter.findMany({
      where: {
        chapter_id: {
          in: decodedIds,
        },
      },
      select: {
        chapter_id: true,
        chapter_name: true,
      },
    });
    const encodedTitles = chapterTitles.map((chapter) => ({
      chapter_id: hashids.encode(chapter.chapter_id),
      chapter_name: chapter.chapter_name,
    }));
    return res.status(200).json({
      success: true,
      data: encodedTitles,
    });
  } catch (error) {
    console.error("Error in getChapterTitles:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chapter titles",
      error: error.message,
    });
  }
};

export {
  createChapter,
  updateChapter,
  deleteChapter,
  getChaptersBySubject,
  getChapterById,
  getAllChapters,
  getChapterTitles,
};