import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { isDbConnected } from "../config/db.js";

// In-memory orders for fallback mode
let fallbackOrders = [];

/**
 * @desc   Create a new order with shipping address
 * @route  POST /api/orders
 * @access Public / Optional User Auth
 */
export async function createOrder(req, res) {
  try {
    const {
      items = [],
      shippingAddress = {},
      paymentMethod = "COD",
      discount = 0,
      customerName,
      customerEmail,
      customerPhone,
      isGift = false,
      giftMessage = "",
      couponCode = "",
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({ message: "Delivery address, city, and PIN code are required" });
    }

    let subtotal = 0;
    const normalized = [];

    for (const item of items) {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      subtotal += price * quantity;

      normalized.push({
        product: item.id || item._id || item.product,
        name: item.name,
        price,
        quantity,
        image: item.image,
      });

      // Decrement stock in MongoDB Atlas
      if (isDbConnected()) {
        try {
          const prodIdentifier = item.product || item.id || item._id;
          const query =
            typeof prodIdentifier === "string" && prodIdentifier.match(/^[0-9a-fA-F]{24}$/)
              ? { _id: prodIdentifier }
              : {
                  $or: [
                    { slug: prodIdentifier },
                    { slug: item.slug },
                    { name: item.name },
                  ].filter(Boolean),
                };

          await Product.findOneAndUpdate(query, { $inc: { stock: -quantity } });
        } catch (err) {
          console.warn("Stock decrement note:", err.message);
        }
      }
    }

    const shipping = subtotal >= 1499 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shipping);
    const orderNumber = "AJ-" + Math.floor(100000 + Math.random() * 900000);

    const orderData = {
      orderNumber,
      user: req.user?._id || null,
      customerName: customerName || shippingAddress.fullName || req.user?.name || "Customer",
      customerEmail: customerEmail || req.user?.email || "",
      customerPhone: customerPhone || shippingAddress.phone || "",
      items: normalized,
      shippingAddress,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod,
      orderStatus: "PLACED",
      isGift: Boolean(isGift),
      giftMessage: giftMessage ? String(giftMessage).trim() : "",
      couponCode: couponCode ? String(couponCode).trim().toUpperCase() : "",
      createdAt: new Date().toISOString(),
    };

    // Increment coupon usage
    if (couponCode && isDbConnected()) {
      try {
        await Coupon.findOneAndUpdate(
          { code: couponCode.trim().toUpperCase() },
          { $inc: { usageCount: 1 } }
        );
      } catch (e) {
        console.warn("Coupon usage increment note:", e.message);
      }
    }

    if (!isDbConnected()) {
      fallbackOrders.unshift(orderData);
      return res.status(201).json(orderData);
    }

    const savedOrder = await Order.create(orderData);
    return res.status(201).json(savedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get logged-in user's orders
 * @route  GET /api/orders/mine
 * @access Private
 */
export async function getMyOrders(req, res) {
  try {
    if (!isDbConnected()) {
      const userOrders = fallbackOrders.filter(
        (o) => o.user === req.user._id || (req.user.email && o.customerEmail?.toLowerCase() === req.user.email.toLowerCase())
      );
      return res.json(userOrders);
    }

    const filters = [{ user: req.user._id }];
    if (req.user?.email) {
      filters.push({ customerEmail: req.user.email.toLowerCase() });
      filters.push({ customerEmail: req.user.email });
    }

    const orders = await Order.find({ $or: filters })
      .populate("items.product")
      .sort("-createdAt");
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get all orders (Admin)
 * @route  GET /api/orders
 * @access Admin
 */
export async function getAllOrders(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(fallbackOrders);
    }

    const orders = await Order.find()
      .populate("user", "name email")
      .sort("-createdAt");
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get single order by ID or orderNumber
 * @route  GET /api/orders/:id
 * @access Public / Customer Lookup
 */
export async function getOrderById(req, res) {
  try {
    const isObjectId = typeof req.params.id === "string" && /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { orderNumber: req.params.id };

    if (!isDbConnected()) {
      const order = fallbackOrders.find((o) => o.orderNumber === req.params.id || o._id === req.params.id);
      if (order) return res.json(order);
      return res.status(404).json({ message: "Order not found" });
    }

    const order = await Order.findOne(query).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Update order status (Admin)
 * @route  PUT /api/orders/:id/status
 * @access Admin
 */
export async function updateOrderStatus(req, res) {
  try {
    const { orderStatus } = req.body;

    if (!isDbConnected()) {
      const order = fallbackOrders.find((o) => o.orderNumber === req.params.id || o._id === req.params.id);
      if (order) {
        order.orderStatus = orderStatus;
        return res.json(order);
      }
      return res.status(404).json({ message: "Order not found" });
    }

    const isObjectId = typeof req.params.id === "string" && /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { orderNumber: req.params.id };

    const existingOrder = await Order.findOne(query);
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If changing from active to CANCELLED, restore product stock in Atlas
    if (orderStatus === "CANCELLED" && existingOrder.orderStatus !== "CANCELLED") {
      for (const item of existingOrder.items) {
        try {
          const prodIdentifier = item.product || item.id || item._id;
          const prodQuery =
            typeof prodIdentifier === "string" && prodIdentifier.match(/^[0-9a-fA-F]{24}$/)
              ? { _id: prodIdentifier }
              : {
                  $or: [
                    { slug: prodIdentifier },
                    { slug: item.slug },
                    { name: item.name },
                  ].filter(Boolean),
                };
          await Product.findOneAndUpdate(prodQuery, { $inc: { stock: item.quantity || 1 } });
        } catch (err) {
          console.warn("Stock restore on cancel note:", err.message);
        }
      }
    }

    existingOrder.orderStatus = orderStatus;
    const updatedOrder = await existingOrder.save();
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Customer self-cancel order (allowed only if status is PLACED)
 * @route  POST /api/orders/:id/customer-cancel
 * @access Public / Customer
 */
export async function customerCancelOrder(req, res) {
  try {
    const isObjectId = typeof req.params.id === "string" && /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { orderNumber: req.params.id };

    if (!isDbConnected()) {
      const order = fallbackOrders.find((o) => o.orderNumber === req.params.id || o._id === req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.orderStatus !== "PLACED") {
        return res.status(400).json({
          message: `Order cannot be self-cancelled because it is already ${order.orderStatus.toLowerCase()}. Please contact concierge.`,
        });
      }
      order.orderStatus = "CANCELLED";
      return res.json(order);
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({
        message: `Order cannot be self-cancelled because it is already ${order.orderStatus.toLowerCase()}. Please contact concierge.`,
      });
    }

    // Restore product stock in Atlas
    for (const item of order.items) {
      try {
        const prodIdentifier = item.product || item.id || item._id;
        const prodQuery =
          typeof prodIdentifier === "string" && prodIdentifier.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: prodIdentifier }
            : {
                $or: [
                  { slug: prodIdentifier },
                  { slug: item.slug },
                  { name: item.name },
                ].filter(Boolean),
              };
        await Product.findOneAndUpdate(prodQuery, { $inc: { stock: item.quantity || 1 } });
      } catch (err) {
        console.warn("Stock restore on customer cancel note:", err.message);
      }
    }

    order.orderStatus = "CANCELLED";
    const updated = await order.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

