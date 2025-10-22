import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  satellites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Satellite",
    },
  ],
});

export const Group = mongoose.model("Group", GroupSchema);
