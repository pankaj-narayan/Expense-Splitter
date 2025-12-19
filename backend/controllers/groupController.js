const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");

/**
 * CREATE GROUP
 */
exports.createGroup = async (req, res) => {
  try {
    let { name, members = [] } = req.body;

    if (!members.some((m) => m.toString() === req.userId)) {
      members.push(req.userId);
    }

    const group = await Group.create({
      name,
      members,
      createdBy: req.userId,
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET MY GROUPS
 */
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: { $in: [req.userId] },
    }).populate("members", "name email");

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET EXPENSES OF A GROUP
 */
exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      groupId: req.params.id,
    })
      .populate("paidBy", "name email")
      .populate("splits.userId", "name email")
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ADD MEMBER TO GROUP
 */
exports.addMemberToGroup = async (req, res) => {
  try {
    const { email } = req.body;
    const { groupId } = req.params;

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === req.userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (group.members.some((m) => m.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ message: "User already in group" });
    }

    group.members.push(userToAdd._id);
    await group.save();

    res.json({ message: "Member added successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET ALL MEMBERS OF A GROUP
 */
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
      "members",
      "name email"
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only members can view group members
    if (!group.members.some((m) => m._id.toString() === req.userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(group.members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
