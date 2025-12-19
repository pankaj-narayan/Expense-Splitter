import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/addExpense.css";

export default function AddExpenseModal({ groupId, onClose, onAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");
  const [members, setMembers] = useState([]);
  const [splits, setSplits] = useState({});
  const [paidBy, setPaidBy] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ---------------- FETCH MEMBERS ---------------- */
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await axios.get(
        `http://localhost:5000/api/groups/${groupId}/members`,
        { headers }
      );

      setMembers(res.data);

      const initialSplits = {};
      res.data.forEach((m) => {
        initialSplits[m._id] = "";
      });
      setSplits(initialSplits);

      // default paidBy = logged-in user
      const currentUserId = JSON.parse(atob(token.split(".")[1])).id;
      setPaidBy(currentUserId);
    };

    fetchMembers();
  }, [groupId]);

  /* ---------------- HANDLE INPUT CHANGE ---------------- */
  const handleChange = (userId, value) => {
    setSplits((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  /* ---------------- SUBMIT ---------------- */
  const addExpense = async () => {
    if (!description || !amount) return;

    const payload = {
      groupId,
      description,
      amount: Number(amount),
      splitType,
      paidBy,
    };

    if (splitType !== "EQUAL") {
      payload.splits = Object.entries(splits).map(([user, value]) => ({
        user,
        value: Number(value),
      }));
    }

    await axios.post("http://localhost:5000/api/expenses", payload, {
      headers,
    });

    onClose();
    onAdded();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Expense</h3>

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Total Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* -------- PAID BY -------- */}
        <div className="paid-by-container">
          <label>Paid by</label>

          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* -------- SPLIT TYPE BUTTONS -------- */}
        <div className="split-buttons">
          <button
            className={splitType === "EQUAL" ? "active" : ""}
            onClick={() => setSplitType("EQUAL")}
          >
            Equal
          </button>

          <button
            className={splitType === "PERCENTAGE" ? "active" : ""}
            onClick={() => setSplitType("PERCENTAGE")}
          >
            Percentage
          </button>

          <button
            className={splitType === "EXACT" ? "active" : ""}
            onClick={() => setSplitType("EXACT")}
          >
            Exact
          </button>
        </div>

        {/* -------- DYNAMIC INPUTS PER MEMBER -------- */}
        {splitType !== "EQUAL" &&
          members.map((member) => (
            <div key={member._id} className="split-row">
              <span>{member.name}</span>
              <input
                type="number"
                placeholder={
                  splitType === "PERCENTAGE" ? "Percentage %" : "Exact amount"
                }
                value={splits[member._id] || ""}
                onChange={(e) => handleChange(member._id, e.target.value)}
              />
            </div>
          ))}

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={addExpense}>
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}
