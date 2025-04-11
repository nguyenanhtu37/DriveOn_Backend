import * as subscriptionService from "../service/subscriptionService.js";

export const addSubscription = async (req, res) => {
  const { name, code, description, pricePerMonth } = req.body;

  try {
    const newSubscription = await subscriptionService.addSubscription({
      name,
      code,
      description,
      pricePerMonth,
    });

    res.status(201).json({
      message: "Subscription added successfully",
      subscription: newSubscription,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const subscriptionList = await subscriptionService.getSubscriptions();

    if (!subscriptionList || subscriptionList.length === 0) {
      return res.status(404).json({ message: "No subscriptions found!" });
    }

    res.status(200).json({
      message: "Subscription list",
      data: subscriptionList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, pricePerMonth } = req.body;

  try {
    const updatedSubscription = await subscriptionService.updateSubscription(id, {
      name,
      code,
      description,
      pricePerMonth,
    });

    res.status(200).json({
      message: "Subscription updated successfully!",
      subscription: updatedSubscription,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await subscriptionService.deleteSubscription(id);

    if (!result) {
      return res.status(404).json({ message: "Subscription not found!" });
    }

    res.status(200).json({ message: "Subscription deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Delete subscription failed!", error: err.message });
  }
};
