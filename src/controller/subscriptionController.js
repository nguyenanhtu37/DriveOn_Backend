import * as subscriptionService from "../service/subscriptionService.js";

export const addSubscription = async (req, res) => {
  const { name, code, description, price, month } = req.body;

  try {
    const newSubscription = await subscriptionService.addSubscription({
      name,
      code,
      description,
      price,
      month,
    });

    res.status(201).json(newSubscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getSubscriptions();
    res.status(200).json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, price, month } = req.body;

  try {
    const updated = await subscriptionService.updateSubscription(id, {
      name,
      code,
      description,
      price,
      month,
    });

    if (!updated) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await subscriptionService.deleteSubscription(id);

    if (!deleted) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.sendStatus(204); // No Content
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
