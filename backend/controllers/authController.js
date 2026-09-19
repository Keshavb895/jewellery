import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isDbConnected } from "../config/db.js";

// In-memory demo users when MongoDB is offline
let fallbackUsers = [
  {
    _id: "user_admin_001",
    id: "user_admin_001",
    name: "Aurelia Admin",
    email: "admin@aurelia.com",
    password: "admin123", // plaintext check in dev fallback
    role: "admin",
  },
  {
    _id: "user_customer_002",
    id: "user_customer_002",
    name: "Sophia Sterling",
    email: "customer@aurelia.com",
    password: "customer123",
    role: "customer",
  },
];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, role: user.role },
    process.env.JWT_SECRET || "aurelia_jewels_super_secret_jwt_key_2026",
    { expiresIn: "7d" }
  );
};

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      console.warn(
        `[AUTH REGISTER WARNING] MongoDB Atlas is currently OFFLINE / DISCONNECTED. User "${cleanEmail}" was saved into temporary in-memory RAM fallback only. It will NOT appear in your MongoDB database until Atlas Network Access IP is whitelisted.`
      );

      const existing = fallbackUsers.find((u) => u.email === cleanEmail);
      if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const newUser = {
        _id: "user_" + Date.now(),
        id: "user_" + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: password,
        role: "customer",
      };
      fallbackUsers.push(newUser);

      return res.status(201).json({
        token: generateToken(newUser),
        warning: "MongoDB is disconnected; user saved in temporary memory fallback only.",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        defaultPaymentMethod: user.defaultPaymentMethod || "COD",
        addresses: user.addresses || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Authenticate user and get token
 * @route  POST /api/auth/login
 * @access Public
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u.email === cleanEmail);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        token: generateToken(user),
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          defaultPaymentMethod: user.defaultPaymentMethod || "COD",
          addresses: user.addresses || [],
        },
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        defaultPaymentMethod: user.defaultPaymentMethod || "COD",
        addresses: user.addresses || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get current logged in user profile
 * @route  GET /api/auth/me
 * @access Private
 */
export async function getMe(req, res) {
  try {
    return res.json(req.user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Update customer profile (name, phone, default payment)
 * @route  PUT /api/auth/profile
 * @access Private
 */
export async function updateProfile(req, res) {
  try {
    const { name, phone, defaultPaymentMethod } = req.body;

    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u._id === req.user._id || u.id === req.user._id);
      if (user) {
        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (defaultPaymentMethod) user.defaultPaymentMethod = defaultPaymentMethod;
        return res.json({
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          defaultPaymentMethod: user.defaultPaymentMethod || "COD",
          addresses: user.addresses || [],
        });
      }
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (defaultPaymentMethod) user.defaultPaymentMethod = defaultPaymentMethod;

    const updatedUser = await user.save();
    return res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || "",
      role: updatedUser.role,
      defaultPaymentMethod: updatedUser.defaultPaymentMethod || "COD",
      addresses: updatedUser.addresses || [],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get all saved addresses for logged-in user
 * @route  GET /api/auth/addresses
 * @access Private
 */
export async function getAddresses(req, res) {
  try {
    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u._id === req.user._id || u.id === req.user._id);
      return res.json(user?.addresses || []);
    }

    const user = await User.findById(req.user._id);
    return res.json(user?.addresses || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Add a new delivery address
 * @route  POST /api/auth/addresses
 * @access Private
 */
export async function addAddress(req, res) {
  try {
    const { tag = "Home", fullName, phone, address, city, state = "Delhi", pincode, country = "India", isDefault } = req.body;

    if (!fullName || !phone || !address || !city || !pincode) {
      return res.status(400).json({ message: "Full name, phone, address, city and pincode are required" });
    }

    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u._id === req.user._id || u.id === req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!Array.isArray(user.addresses)) user.addresses = [];

      const shouldBeDefault = Boolean(isDefault) || user.addresses.length === 0;
      if (shouldBeDefault) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }

      const newAddr = {
        _id: "addr_" + Date.now(),
        tag,
        fullName,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        isDefault: shouldBeDefault,
      };

      user.addresses.unshift(newAddr);
      return res.status(201).json(user.addresses);
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const shouldBeDefault = Boolean(isDefault) || user.addresses.length === 0;
    if (shouldBeDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.unshift({
      tag,
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
      country,
      isDefault: shouldBeDefault,
    });

    await user.save();
    return res.status(201).json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Update an existing delivery address
 * @route  PUT /api/auth/addresses/:addressId
 * @access Private
 */
export async function updateAddress(req, res) {
  try {
    const { addressId } = req.params;
    const { tag, fullName, phone, address, city, state, pincode, country, isDefault } = req.body;

    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u._id === req.user._id || u.id === req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const target = user.addresses?.find((a) => a._id === addressId || a.id === addressId);
      if (!target) return res.status(404).json({ message: "Address not found" });

      if (isDefault) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }

      Object.assign(target, {
        tag: tag || target.tag,
        fullName: fullName || target.fullName,
        phone: phone || target.phone,
        address: address || target.address,
        city: city || target.city,
        state: state || target.state,
        pincode: pincode || target.pincode,
        country: country || target.country,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : target.isDefault,
      });

      return res.json(user.addresses);
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const target = user.addresses.id(addressId);
    if (!target) return res.status(404).json({ message: "Address not found" });

    if (isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    if (tag) target.tag = tag;
    if (fullName) target.fullName = fullName;
    if (phone) target.phone = phone;
    if (address) target.address = address;
    if (city) target.city = city;
    if (state) target.state = state;
    if (pincode) target.pincode = pincode;
    if (country) target.country = country;
    if (isDefault !== undefined) target.isDefault = Boolean(isDefault);

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Delete an address from address book
 * @route  DELETE /api/auth/addresses/:addressId
 * @access Private
 */
export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;

    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u._id === req.user._id || u.id === req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.addresses = (user.addresses || []).filter((a) => a._id !== addressId && a.id !== addressId);
      return res.json(user.addresses);
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses = user.addresses.filter((a) => a._id.toString() !== addressId);
    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Set an address as default
 * @route  PUT /api/auth/addresses/:addressId/default
 * @access Private
 */
export async function setDefaultAddress(req, res) {
  try {
    const { addressId } = req.params;

    if (!isDbConnected()) {
      const user = fallbackUsers.find((u) => u._id === req.user._id || u.id === req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.addresses?.forEach((a) => {
        a.isDefault = a._id === addressId || a.id === addressId;
      });
      return res.json(user.addresses);
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
