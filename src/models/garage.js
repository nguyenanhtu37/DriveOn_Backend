import mongoose from "mongoose";

const garageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    //địa chỉ text. Ví dụ: 123 Nguyễn Văn Linh, Quận 7, TP.HCM
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
  operating_days: [
    {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
  ],
  facadeImages: [
    {
      //ảnh mặt tiền
      type: String,
    },
  ],
  interiorImages: [
    {
      //ảnh bên trong
      type: String,
    },
  ],
  documentImages: [
    {
      //ảnh giấy tờ chứng minh
      type: String,
    },
  ],
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
    type: [String],
    enum: ["pending", "approved", "rejected", "enabled", "disabled"], // dùng chung cho cả enable/disable garage và approve/reject garage
    default: "pending",
  },
  location: {
    //lưu điểm tọa độ
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      //tọa độ
      type: [Number], //[kinh độ, vĩ độ]
    },
  },
  tag: {
    type: String,
    enum: ["normal", "pro"],
    default: "normal"
  },
  appointment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],
  expiredTime: {
    type: Date,
    default: null
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  deviceTokens: {
    type: [String],
    default: [],
  },
});

garageSchema.index({ location: "2dsphere" });
/*
Vdu: db.garages.getIndexes();
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { location: '2dsphere' },
    name: 'location_2dsphere',
    '2dsphereIndexVersion': 3
  }
]
*/

const Garage = mongoose.model("Garage", garageSchema);
export default Garage;
