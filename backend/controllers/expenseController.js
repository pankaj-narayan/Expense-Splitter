const Expense = require("../models/Expense");
const Balance = require("../models/Balance");
const Group = require("../models/Group");

exports.addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, splitType, splits = [] } = req.body;
    const paidBy = req.body.paidBy || req.userId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const safeSplits = splitType === "EQUAL" ? [] : splits;

    const normalizedSplits = safeSplits.map((s) => ({
      userId: s.user || s.userId,
      amount: s.amount ?? s.value,
      percent: s.percent ?? s.value,
    }));

    let finalSplits = [];

    // ---------- EQUAL SPLIT ----------
    if (splitType === "EQUAL") {
      const splitAmount = Number((amount / group.members.length).toFixed(2));

      finalSplits = group.members.map((member) => ({
        userId: member,
        amount: splitAmount,
      }));
    }

    // ---------- EXACT SPLIT ----------
    if (splitType === "EXACT") {
      if (normalizedSplits.length === 0) {
        return res.status(400).json({ message: "Exact splits required" });
      }

      const total = normalizedSplits.reduce(
        (sum, s) => sum + Number(s.amount),
        0
      );

      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({ message: "Invalid exact split total" });
      }

      finalSplits = normalizedSplits.map((s) => ({
        userId: s.userId,
        amount: Number(s.amount),
      }));
    }

    // ---------- PERCENTAGE SPLIT ----------
    if (splitType === "PERCENTAGE") {
      if (normalizedSplits.length === 0) {
        return res.status(400).json({ message: "Percentage splits required" });
      }

      const percentTotal = normalizedSplits.reduce(
        (sum, s) => sum + Number(s.percent),
        0
      );

      if (percentTotal !== 100) {
        return res.status(400).json({ message: "Percent must total 100" });
      }

      finalSplits = normalizedSplits.map((s) => ({
        userId: s.userId,
        amount: Number(((s.percent / 100) * amount).toFixed(2)),
      }));
    }

    // ---------- REMOVE SELF SPLITS ----------
    finalSplits = finalSplits.filter(
      (s) => s.userId.toString() !== paidBy.toString()
    );

    // ---------- CREATE EXPENSE ----------
    const expense = await Expense.create({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      splits: finalSplits,
    });

    // ---------- UPDATE BALANCES ----------
    for (const split of finalSplits) {
      const existing = await Balance.findOne({
        from: split.userId,
        to: paidBy,
      });

      if (existing) {
        existing.amount = Number((existing.amount + split.amount).toFixed(2));
        await existing.save();
      } else {
        await Balance.create({
          from: split.userId,
          to: paidBy,
          amount: split.amount,
        });
      }
    }

    res.status(201).json(expense);
  } catch (err) {
    console.error("ADD EXPENSE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
