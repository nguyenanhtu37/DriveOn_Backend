import mongoose from "mongoose";

const garageSchema = new mongoose.Schema(
  {
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
    staffs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: [String],
      enum: ["pending", "approved", "rejected", "enabled", "disabled"],
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
      hourlyAppointmentLimit: {
        type:Number,
        default:0
      },

    tag: {
      type: String,
      enum: ["normal", "pro"],
      default: "normal",
    },
    expiredTime: {
      type: Date,
      default: null,
    },
    deviceTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

garageSchema.index({ location: "2dsphere" });

const Garage = mongoose.model("Garage", garageSchema);

export default Garage;
