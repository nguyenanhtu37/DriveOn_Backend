import Subscription from "../models/subscription.js";
import { subscriptionSchema } from "../validator/subscriptionValidator.js";

export const addSubscription = async ({ name, code, description, pricePerMonth }) => {
  try {
    subscriptionSchema.parse({ name, code, description, pricePerMonth });

    const existingSub = await Subscription.findOne({ code });
    if (existingSub) {
      throw new Error(`Subscription with code "${code}" already exists`);
    }

    const newSubscription = new Subscription({
      name,
      code,
      description,
      pricePerMonth,
    });

    await newSubscription.save();
    return newSubscription;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const getSubscriptions = async () => {
  try {
    const subscriptions = await Subscription.find();
    return subscriptions;
  } catch (err) {
    throw new Error("Failed to retrieve subscriptions");
  }
};

export const updateSubscription = async (subscriptionId, updateData) => {
  try {
    if (!subscriptionId) {
      throw new Error("Invalid subscription ID");
    }

    // validate updateData
    subscriptionSchema.partial().parse(updateData);

    const updated = await Subscription.findByIdAndUpdate(
      subscriptionId,
      updateData,
      { new: true }
    );

    if (!updated) {
      throw new Error("Subscription not found");
    }

    return updated;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const deleteSubscription = async (subscriptionId) => {
  try {
    if (!subscriptionId) {
      throw new Error("Invalid subscription ID");
    }

    const deleted = await Subscription.findByIdAndDelete(subscriptionId);
    return deleted;
  } catch (err) {
    throw new Error(err.message);
  }
};
