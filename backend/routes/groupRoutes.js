const express = require("express");
const auth = require("../middleware/authMiddleware");
const {createGroup,getMyGroups,getGroupExpenses, addMemberToGroup, getGroupMembers} = require("../controllers/groupController");

const router = express.Router();

router.post("/", auth, createGroup);

router.get("/", auth, getMyGroups);

router.get("/:id/expenses", auth, getGroupExpenses);

router.post("/:groupId/add-member", auth, addMemberToGroup);

router.get("/:groupId/members",auth,getGroupMembers);

module.exports = router;
