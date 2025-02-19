import mongoose from "mongoose";

const garageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: { //địa chỉ text. Ví dụ: 123 Nguyễn Văn Linh, Quận 7, TP.HCM
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  openTime: {
    type: String,
    required: true,
  },
  closeTime: {
    type: String,
    required: true,
  },
  operating_days: [{
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true
  }],
  facadeImages: [{ //ảnh mặt tiền
    type: String
  }],
  interiorImages: [{ //ảnh bên trong
    type: String
  }],
  documentImages: [{ //ảnh giấy tờ chứng minh
    type: String
  }],
  coinBalance: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  ratingAverage: {
    type: Number,
    default: 0,
  },
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  images: [{
    type: String
  }],
  location: { //lưu điểm tọa độ
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: { //tọa độ
      type: [Number], //[kinh độ, vĩ độ]
      required: true
    }
  },
  tag: {
    type: String,
    enum: ["pro", "normal"],
    default: "normal",
    required: true,
  },
  appointment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],
  isActive: { type: Boolean, default: true, required: true } //
});

const Garage = mongoose.model("Garage", garageSchema);
export default Garage;
