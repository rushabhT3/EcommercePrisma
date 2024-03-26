// controllers/categoryController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const categories = await prisma.category.findMany({
      take: limit,
      skip: skip,
      include: {
        users: {
          where: { id: req.user.id },
          select: { id: true }, // Only get the user's id
        },
      },
    });

    const totalCategories = await prisma.category.count();
    const totalPages = Math.ceil(totalCategories / limit);

    res.send({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        interested: category.users.length > 0, // If the user is associated with the category, mark as interested
      })),
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).send("An error occurred while fetching categories.");
  }
};

const toggleInterest = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user.id; // from the middleware

    // Find the category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(404).send("Category not found.");
    }

    // Check if the user is already interested in the category
    const userCategories = await prisma.user.findUnique({
      where: { id: userId },
      select: { categories: { select: { id: true } } },
    });
    const isInterested = userCategories.categories.some(
      (cat) => cat.id === categoryId
    );

    if (isInterested) {
      // If the user is already interested, unmark the category
      await prisma.user.update({
        where: { id: userId },
        data: { categories: { disconnect: { id: categoryId } } },
      });
    } else {
      // If the user is not interested, mark the category
      await prisma.user.update({
        where: { id: userId },
        data: { categories: { connect: { id: categoryId } } },
      });
    }

    res.send("Interest toggled successfully.");
  } catch (err) {
    res.status(500).send("An error occurred while toggling interest.");
  }
};

module.exports = { getCategories, toggleInterest };
